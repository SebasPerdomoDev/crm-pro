const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");


async function generarPDF(htmlContent) {
    try {
        const browser = await puppeteer.launch({ headless: "new" }); // Iniciar navegador
        const page = await browser.newPage(); 
        await page.setContent(htmlContent, { waitUntil: "networkidle0" }); // Esperar a que la página esté completamente cargada

        const pdfBuffer = await page.pdf({ 
            format: "A4",
            preferCSSPageSize: true
        }); // Generar PDF

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        console.error("Error generando PDF:", error);
        throw error;
    }
}

function cargarPlantillaBoletin(nombreArchivo) {
    const filePath = path.join(__dirname, "../templates", nombreArchivo);
    return fs.readFileSync(filePath, "utf8");
}

module.exports = { generarPDF, cargarPlantillaBoletin  };
