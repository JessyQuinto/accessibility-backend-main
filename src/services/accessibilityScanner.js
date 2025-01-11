const puppeteer = require('puppeteer-core');
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

        // Buscar usando comandos del sistema
        try {
            const command = platform === 'win32' ? 'where chrome.exe' : 'which google-chrome';
            const browserPath = require('child_process').execSync(command).toString().trim().split('\n')[0];
            if (browserPath && fs.existsSync(browserPath)) {
                return browserPath;
            }
        } catch (error) {
            console.log('No se pudo encontrar el navegador usando comando del sistema');
        }

        // Buscar en rutas predefinidas
        for (const browserPath of paths) {
            if (fs.existsSync(browserPath)) {
                return browserPath;
            }
        }

        throw new Error(`No se pudo encontrar un navegador compatible en ${platform}`);
    }

    static async launch() {
        const browserPath = await this.findChromePath();
        console.log(`Usando navegador: ${browserPath}`);

        return puppeteer.launch({
            headless: true,
            executablePath: browserPath,
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