//C:\Users\Jessy\Downloads\accessibility-backend-main\accessibility-backend-main\src\services\accessibilityScanner.js
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
                path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
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
        console.log('Buscando navegadores en las rutas:', paths);

        // Intentar buscar usando comandos del sistema
        try {
            const command = platform === 'win32' ? 'where chrome.exe' : 'which google-chrome';
            const browserPath = require('child_process').execSync(command).toString().trim().split('\n')[0];
            if (browserPath && fs.existsSync(browserPath)) {
                console.log(`Navegador encontrado: ${browserPath}`);
                return browserPath;
            }
        } catch (error) {
            console.log('No se pudo encontrar el navegador usando comando del sistema.');
        }

        // Buscar en rutas predefinidas
        for (const browserPath of paths) {
            if (fs.existsSync(browserPath)) {
                console.log(`Navegador encontrado en ruta predefinida: ${browserPath}`);
                return browserPath;
            }
        }

        console.warn('No se encontró un navegador preinstalado. Usando Puppeteer con Chromium.');
        return null; // Devolverá null si no se encuentra un navegador preinstalado
    }

    static async launch() {
        const browserPath = await this.findChromePath();

        return puppeteer.launch({
            headless: true,
            executablePath: browserPath || undefined, // Usar Chromium descargado si no hay navegador preinstalado
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
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
        await page.setDefaultTimeout(30000);

        // Mejorar el manejo de errores de la página
        page.on('error', err => console.error('Error en la página:', err));
        page.on('pageerror', err => console.error('Error de JavaScript en la página:', err));
        page.on('console', msg => console.log('Mensaje de la página:', msg.text()));

        await page.goto(url, {
            waitUntil: ['load', 'networkidle2'],
            timeout: 30000
        });

        await page.evaluate(axeCore.source);

        const results = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                window.axe.run(document, {
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'best-practice', 'accessibility']
                    },
                    resultTypes: ['violations', 'incomplete', 'inapplicable'],
                    elementRef: true
                })
                .then(results => {
                    const simplifiedResults = {
                        violations: results.violations.map(violation => ({
                            description: violation.description,
                            impact: violation.impact,
                            nodes: violation.nodes.length,
                            wcag_reference: violation.helpUrl || "No disponible",
                            suggested_fix: violation.help || "Sugerencia no disponible",
                            affected_nodes: violation.nodes.map(node => ({
                                html: node.html,
                                node_details: {
                                    tag: node.target[0].split(' ')[0],
                                    location: node.target[0],
                                    text_content: node.html,
                                    attributes: node.target[0]
                                }
                            }))
                        })),
                        incomplete: results.incomplete,
                        inapplicable: results.inapplicable
                    };
                    resolve(simplifiedResults);
                })
                .catch(reject);
            });
        });

        return results;
    } catch (error) {
        console.error('Error en scanPage:', error);
        throw new Error(`Error al analizar la página: ${error.message}`);
    } finally {
        if (page) await page.close().catch(console.error);
        if (browser) await browser.close().catch(console.error);
    }
};