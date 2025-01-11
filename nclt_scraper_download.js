const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Define the URL to scrape
const BASE_URL = 'https://nclt.gov.in';
const TARGET_URL = `${BASE_URL}/order-date-wise`;

// Define selectors
const SEARCH_BUTTON_SELECTOR = '.btn-default.btn-custom';
const TABLE_SELECTOR = '.table.table-borderd tbody';
const DISPOSED_TEXT = 'Disposed';

// Directory for saving PDFs
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// CSV Log File Path
const LOG_FILE_PATH = path.join(__dirname, 'downloaded_pdfs_log.csv');

// Initialize CSV with headers if not exists
if (!fs.existsSync(LOG_FILE_PATH)) {
    fs.writeFileSync(LOG_FILE_PATH, 'File Name,Download Date,Status\n');
}

// Function to append a row to the CSV log
function logToCSV(fileName, status) {
    const date = new Date().toISOString();
    const logEntry = `"${fileName}","${date}","${status}"\n`;
    fs.appendFileSync(LOG_FILE_PATH, logEntry);
}

// Function to download a PDF
function downloadPDF(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, response => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve(true));
                });
            } else {
                file.close();
                fs.unlinkSync(destination); // Delete incomplete file
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', err => {
            fs.unlinkSync(destination); // Delete incomplete file
            reject(err);
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Set to false to see the browser actions
        defaultViewport: null,
        args: ['--start-maximized'],
    });

    const page = await browser.newPage();

    // Navigate to the target URL
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    console.log('Navigated to NCLT Order Date-Wise page.');
    console.log('Please perform the following manually:');
    console.log('1. Select the desired option from the dropdown.');
    console.log('2. Enter the "From" and "To" dates.');
    console.log('3. Solve the captcha.');
    console.log('4. Click the "Search" button.');

    // Wait for the search results to load
    await page.waitForSelector(TABLE_SELECTOR, { visible: true });
    console.log('Search results loaded.');

    const rows = await page.$$(`${TABLE_SELECTOR} tr`);
    console.log(`Found ${rows.length} rows in the table.`);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const tds = await row.$$('td');
        if (tds.length < 6) continue;

        const statusTd = tds[5];
        const statusText = await page.evaluate(el => el.textContent.trim(), statusTd);

        if (statusText.includes(DISPOSED_TEXT)) {
            const linkElement = await statusTd.$('a');
            if (!linkElement) continue;

            let href = await page.evaluate(el => el.getAttribute('href'), linkElement);
            if (!href.startsWith('http')) href = `${BASE_URL}/${href}`;

            const newPage = await browser.newPage();
            try {
                await newPage.goto(href, { waitUntil: 'networkidle2' });
                console.log(`Opened new tab for row ${i + 1}.`);

                const cardSelector = '.accordion .card:nth-of-type(2)';
                await newPage.waitForSelector(cardSelector, { visible: true });

                const tableSelector = '.table-bordered tbody tr:nth-of-type(1) td:nth-of-type(4) a';
                await newPage.waitForSelector(tableSelector, { visible: true });

                const pdfLinkElement = await newPage.$(tableSelector);
                if (!pdfLinkElement) throw new Error('PDF link not found.');

                let pdfHref = await newPage.evaluate(el => el.getAttribute('href'), pdfLinkElement);
                if (!pdfHref.startsWith('http')) pdfHref = `${BASE_URL}/${pdfHref}`;

                console.log(`Found PDF link: ${pdfHref}`);

                // Download the PDF
                const fileName = `row_${i + 1}_pdf_${Date.now()}.pdf`;
                const destination = path.join(DOWNLOAD_DIR, fileName);

                try {
                    await downloadPDF(pdfHref, destination);
                    console.log(`Downloaded: ${fileName}`);
                    logToCSV(fileName, 'Downloaded');
                } catch (err) {
                    console.error(`Failed to download ${fileName}: ${err.message}`);
                    logToCSV(fileName, `Failed: ${err.message}`);
                }
            } catch (err) {
                console.error(`Error processing row ${i + 1}: ${err.message}`);
                logToCSV(`row_${i + 1}_error`, `Failed: ${err.message}`);
            } finally {
                await newPage.close();
            }
        } else {
            console.log(`Row ${i + 1} status is not 'Disposed'. Skipping.`);
        }
    }

    console.log('Scraping and downloading completed.');

    await browser.close();
})();
