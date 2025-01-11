const { scanPage } = require('../services/accessibilityScanner');
require('dotenv').config();

const IMPACT_LEVELS = {
    CRITICAL: 'critical',
    SERIOUS: 'serious',
    MODERATE: 'moderate',
    MINOR: 'minor'
};

// Constantes para códigos de error
const ERROR_CODES = {
    URL_REQUIRED: 'URL_REQUIRED',
    INVALID_URL: 'INVALID_URL_FORMAT',
    SCAN_ERROR: 'SCAN_ERROR',
    PROCESS_ERROR: 'PROCESS_ERROR'
};

exports.analyzeURL = async (req, res) => {
    try {
        const { url } = validateAndSanitizeInput(req.body);
        
        console.log(`Iniciando análisis de accesibilidad para: ${url}`);
        const scanResults = await scanPage(url);
        
        const analysisResults = {
            status: 'success',
            data: {
                url,
                timestamp: new Date().toISOString(),
                analysis: {
                    violations: scanResults.violations,
                    recommendations: generateRecommendations(scanResults.violations),
                },
                summary: generateSummary(scanResults.violations)
            },
            metadata: {
                scanDuration: `${Date.now() - req._startTime}ms`,
                version: '1.0'
            }
        };

        res.status(200).json(analysisResults);
    } catch (error) {
        handleError(error, res);
    }
};

function validateAndSanitizeInput(body) {
    const { url } = body;

    if (!url) {
        throw createError('URL no proporcionada', ERROR_CODES.URL_REQUIRED, 400);
    }

    try {
        const sanitizedUrl = new URL(url).toString();
        return { url: sanitizedUrl };
    } catch {
        throw createError('URL inválida', ERROR_CODES.INVALID_URL, 400);
    }
}

function generateRecommendations(violations) {
    return violations.map(violation => ({
        issue: violation.description,
        impact: violation.impact,
        recommendation: generateSpecificRecommendation(violation),
        priority: getPriorityLevel(violation.impact),
        wcag_reference: violation.wcag_reference,
        affected_elements: violation.nodes,
        remediation_complexity: calculateRemediationComplexity(violation)
    }));
}

function generateSpecificRecommendation(violation) {
    return violation.suggested_fix || `Para corregir este problema de ${violation.impact} impacto, 
        revise y modifique los elementos identificados siguiendo las pautas WCAG referenciadas en ${violation.wcag_reference}.`;
}

function getPriorityLevel(impact) {
    const priorityMap = {
        [IMPACT_LEVELS.CRITICAL]: 1,
        [IMPACT_LEVELS.SERIOUS]: 2,
        [IMPACT_LEVELS.MODERATE]: 3,
        [IMPACT_LEVELS.MINOR]: 4
    };
    return priorityMap[impact.toLowerCase()] || 5;
}

function calculateRemediationComplexity(violation) {
    const complexityFactors = {
        nodeCount: violation.nodes.length,
        impactWeight: getPriorityLevel(violation.impact)
    };
    
    const complexity = (complexityFactors.nodeCount * complexityFactors.impactWeight) / 10;
    
    if (complexity > 8) return 'Alta';
    if (complexity > 4) return 'Media';
    return 'Baja';
}

function generateSummary(violations) {
    const summary = {
        total_violations: violations.length,
        violations_by_impact: {},
        most_common_issues: []
    };

    // Agrupar por impacto
    violations.forEach(violation => {
        const impact = violation.impact.toLowerCase();
        summary.violations_by_impact[impact] = (summary.violations_by_impact[impact] || 0) + 1;
    });

    // Identificar problemas más comunes
    const issueCount = violations.reduce((acc, violation) => {
        acc[violation.description] = (acc[violation.description] || 0) + violation.nodes.length;
        return acc;
    }, {});

    summary.most_common_issues = Object.entries(issueCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([description, count]) => ({ description, affected_elements: count }));

    return summary;
}

function createError(message, code, statusCode) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
}

function handleError(error, res) {
    console.error('Error en el análisis:', error);
    
    const statusCode = error.statusCode || 500;
    const errorResponse = {
        status: 'error',
        message: error.message || 'Error interno del servidor',
        code: error.code || ERROR_CODES.PROCESS_ERROR,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    res.status(statusCode).json(errorResponse);
}