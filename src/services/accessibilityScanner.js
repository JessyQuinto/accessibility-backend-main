// accessibilityScanner.js
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

class BrowserManager {
    static async findChromePath() {
        const defaultPaths = {
            win32: [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
            ],
            darwin: [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
            ],
            linux: [
                '/usr/bin/google-chrome',
                '/usr/bin/microsoft-edge'
            ]
        };

        const platform = os.platform();
        const paths = defaultPaths[platform] || [];

        for (const browserPath of paths) {
            if (fs.existsSync(browserPath)) {
                return browserPath;
            }
        }
        return null;
    }

    static async launch() {
        const browserPath = await this.findChromePath();
        
        return puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080'
            ],
            executablePath: browserPath || undefined
        });
    }
}

exports.scanPage = async (url) => {
    let browser = null;
    let page = null;

    try {
        browser = await BrowserManager.launch();
        page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultNavigationTimeout(30000);

        console.log(`Analyzing page: ${url}`);
        
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Inject axe-core
        await page.evaluate(axeCore.source);

        // Run the accessibility scan
        const results = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                window.axe.run(document, {
                    resultTypes: ['violations', 'incomplete', 'passes'],
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'best-practice']
                    },
                    rules: {
                        'color-contrast': { enabled: true },
                        'frame-title': { enabled: true },
                        'image-alt': { enabled: true },
                        'label': { enabled: true },
                        'link-name': { enabled: true },
                        'list': { enabled: true },
                        'listitem': { enabled: true },
                        'skip-link': { enabled: true },
                        'valid-lang': { enabled: true }
                    }
                })
                .then(results => {
                    resolve({
                        violations: results.violations.map(violation => ({
                            id: violation.id,
                            impact: violation.impact,
                            tags: violation.tags,
                            description: violation.description,
                            help: violation.help,
                            helpUrl: violation.helpUrl,
                            nodes: violation.nodes.map(node => ({
                                html: node.html,
                                impact: node.impact,
                                target: node.target,
                                failureSummary: node.failureSummary,
                                fixes: node.any.map(fix => ({
                                    id: fix.id,
                                    message: fix.message,
                                    data: fix.data
                                }))
                            }))
                        })),
                        passes: results.passes.map(pass => ({
                            id: pass.id,
                            description: pass.description,
                            nodes: pass.nodes.length
                        })),
                        incomplete: results.incomplete.map(incomplete => ({
                            id: incomplete.id,
                            impact: incomplete.impact,
                            description: incomplete.description,
                            nodes: incomplete.nodes.length
                        })),
                        timestamp: new Date().toISOString(),
                        url: window.location.href,
                        statistics: {
                            violationsCount: results.violations.length,
                            passesCount: results.passes.length,
                            incompleteCount: results.incomplete.length,
                            impactDistribution: {
                                critical: results.violations.filter(v => v.impact === 'critical').length,
                                serious: results.violations.filter(v => v.impact === 'serious').length,
                                moderate: results.violations.filter(v => v.impact === 'moderate').length,
                                minor: results.violations.filter(v => v.impact === 'minor').length
                            }
                        }
                    });
                })
                .catch(reject);
            });
        });

        console.log('Accessibility analysis completed successfully');
        return results;

    } catch (error) {
        console.error('Error in scanPage:', error);
        throw new Error(`Failed to analyze page: ${error.message}`);
    } finally {
        if (page) await page.close().catch(console.error);
        if (browser) await browser.close().catch(console.error);
    }
};