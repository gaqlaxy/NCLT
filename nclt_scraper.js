// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const path = require('path');
// const https = require('https');

// // Define the URL to scrape
// const BASE_URL = 'https://nclt.gov.in';
// const TARGET_URL = `${BASE_URL}/order-date-wise`;

// // Define selectors
// const SEARCH_BUTTON_SELECTOR = '.btn-default.btn-custom';
// const TABLE_SELECTOR = '.table.table-borderd tbody';
// const DISPOSED_TEXT = 'Disposed';

// // Directory for saving PDFs
// const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// // Ensure download directory exists
// if (!fs.existsSync(DOWNLOAD_DIR)) {
//     fs.mkdirSync(DOWNLOAD_DIR);
// }

// // CSV Log File Path
// const LOG_FILE_PATH = path.join(__dirname, 'downloaded_pdfs_log.csv');

// // Initialize CSV with headers if not exists
// if (!fs.existsSync(LOG_FILE_PATH)) {
//     fs.writeFileSync(LOG_FILE_PATH, 'File Name,Download Date,Status\n');
// }

// // Function to append a row to the CSV log
// function logToCSV(fileName, status) {
//     const date = new Date().toISOString();
//     const logEntry = `"${fileName}","${date}","${status}"\n`;
//     fs.appendFileSync(LOG_FILE_PATH, logEntry);
// }

// // Function to download a PDF
// function downloadPDF(url, destination) {
//     return new Promise((resolve, reject) => {
//         const file = fs.createWriteStream(destination);
//         https.get(url, response => {
//             if (response.statusCode === 200) {
//                 response.pipe(file);
//                 file.on('finish', () => {
//                     file.close(() => resolve(true));
//                 });
//             } else {
//                 file.close();
//                 fs.unlinkSync(destination); // Delete incomplete file
//                 reject(new Error(`Failed to download: ${response.statusCode}`));
//             }
//         }).on('error', err => {
//             fs.unlinkSync(destination); // Delete incomplete file
//             reject(err);
//         });
//     });
// }

// (async () => {
//     const browser = await puppeteer.launch({
//         headless: false, // Set to false to see the browser actions
//         defaultViewport: null,
//         args: ['--start-maximized'],
//     });

//     const page = await browser.newPage();

//     // Navigate to the target URL
//     await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

//     console.log('Navigated to NCLT Order Date-Wise page.');
//     console.log('Please perform the following manually:');
//     console.log('1. Select the desired option from the dropdown.');
//     console.log('2. Enter the "From" and "To" dates.');
//     console.log('3. Solve the captcha.');
//     console.log('4. Click the "Search" button.');

//     // Wait for the search results to load
//     await page.waitForSelector(TABLE_SELECTOR, { visible: true });
//     console.log('Search results loaded.');

//     // Function to scrape the current page
//     const scrapeTableData = async () => {
//         const rows = await page.$$(`${TABLE_SELECTOR} tr`);
//         console.log(`Found ${rows.length} rows in the table.`);
        
//         for (let i = 0; i < rows.length; i++) {
//             const row = rows[i];
//             const tds = await row.$$('td');
//             if (tds.length < 6) continue;

//             const statusTd = tds[5];
//             const statusText = await page.evaluate(el => el.textContent.trim(), statusTd);

//             if (statusText.includes(DISPOSED_TEXT)) {
//                 const linkElement = await statusTd.$('a');
//                 if (!linkElement) continue;

//                 let href = await page.evaluate(el => el.getAttribute('href'), linkElement);
//                 if (!href.startsWith('http')) href = `${BASE_URL}/${href}`;

//                 const newPage = await browser.newPage();
//                 try {
//                     await newPage.goto(href, { waitUntil: 'networkidle2' });
//                     console.log(`Opened new tab for row ${i + 1}.`);

//                     const cardSelector = '.accordion .card:nth-of-type(2)';
//                     await newPage.waitForSelector(cardSelector, { visible: true });

//                     const tableSelector = '.table-bordered tbody tr:nth-of-type(1) td:nth-of-type(4) a';
//                     await newPage.waitForSelector(tableSelector, { visible: true });

//                     const pdfLinkElement = await newPage.$(tableSelector);
//                     if (!pdfLinkElement) throw new Error('PDF link not found.');

//                     let pdfHref = await newPage.evaluate(el => el.getAttribute('href'), pdfLinkElement);
//                     if (!pdfHref.startsWith('http')) pdfHref = `${BASE_URL}/${pdfHref}`;

//                     console.log(`Found PDF link: ${pdfHref}`);

//                     // Download the PDF
//                     const fileName = `row_${i + 1}_pdf_${Date.now()}.pdf`;
//                     const destination = path.join(DOWNLOAD_DIR, fileName);

//                     try {
//                         await downloadPDF(pdfHref, destination);
//                         console.log(`Downloaded: ${fileName}`);
//                         logToCSV(fileName, 'Downloaded');
//                     } catch (err) {
//                         console.error(`Failed to download ${fileName}: ${err.message}`);
//                         logToCSV(fileName, `Failed: ${err.message}`);
//                     }
//                 } catch (err) {
//                     console.error(`Error processing row ${i + 1}: ${err.message}`);
//                     logToCSV(`row_${i + 1}_error`, `Failed: ${err.message}`);
//                 } finally {
//                     await newPage.close();
//                 }
//             } else {
//                 console.log(`Row ${i + 1} status is not 'Disposed'. Skipping.`);
//             }
//         }
//     }

//     // Function to click the "Next" button if it's not disabled
//     async function goToNextPage(page) {
//         const nextButtonSelector = '.page-item a.page-link';
//         const disabledButtonSelector = '.page-item.disabled a.page-link';

//         const nextButton = await page.$(nextButtonSelector);
//         const disabledButton = await page.$(disabledButtonSelector);

//         if (nextButton && !disabledButton) {
//             await nextButton.click();
//             await page.waitForNavigation({ waitUntil: 'networkidle2' });
//             return true;
//         }
//         return false;
//     }

//     // Paginate through all pages
//     let hasNextPage = true;
//     while (hasNextPage) {
//         console.log('Processing current page...');
//         // Scrape current page's rows
//         await scrapeTableData();

//         // Check and go to next page
//         hasNextPage = await goToNextPage(page);
//         if (hasNextPage) {
//             console.log('Moving to next page...');
//         } else {
//             console.log('No more pages to scrape.');
//         }
//     }

//     console.log('Scraping and downloading completed.');

//     await browser.close();
// })();


// V2
// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const path = require('path');
// const https = require('https');

// // Define the URL to scrape
// const BASE_URL = 'https://nclt.gov.in';
// const TARGET_URL = `${BASE_URL}/order-date-wise`;

// // Define selectors
// const SEARCH_BUTTON_SELECTOR = '.btn-default.btn-custom';
// const TABLE_SELECTOR = '.table.table-borderd tbody';
// const DISPOSED_TEXT = 'Disposed';

// // Directory for saving PDFs
// const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// // Ensure download directory exists
// if (!fs.existsSync(DOWNLOAD_DIR)) {
//     fs.mkdirSync(DOWNLOAD_DIR);
// }

// // CSV Log File Path
// const LOG_FILE_PATH = path.join(__dirname, 'downloaded_pdfs_log.csv');

// // Initialize CSV with headers if not exists
// if (!fs.existsSync(LOG_FILE_PATH)) {
//     fs.writeFileSync(LOG_FILE_PATH, 'File Name,Download Date,Status\n');
// }

// // Function to append a row to the CSV log
// function logToCSV(fileName, status) {
//     const date = new Date().toISOString();
//     const logEntry = `"${fileName}","${date}","${status}"\n`;
//     fs.appendFileSync(LOG_FILE_PATH, logEntry);
// }

// // Function to download a PDF
// function downloadPDF(url, destination) {
//     return new Promise((resolve, reject) => {
//         const file = fs.createWriteStream(destination);
//         https.get(url, response => {
//             if (response.statusCode === 200) {
//                 response.pipe(file);
//                 file.on('finish', () => {
//                     file.close(() => resolve(true));
//                 });
//             } else {
//                 file.close();
//                 fs.unlinkSync(destination); // Delete incomplete file
//                 reject(new Error(`Failed to download: ${response.statusCode}`));
//             }
//         }).on('error', err => {
//             fs.unlinkSync(destination); // Delete incomplete file
//             reject(err);
//         });
//     });
// }

// (async () => {
//     const browser = await puppeteer.launch({
//         headless: false, // Set to false to see the browser actions
//         defaultViewport: null,
//         args: ['--start-maximized'],
//     });

//     const page = await browser.newPage();

//     // Navigate to the target URL
//     await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

//     console.log('Navigated to NCLT Order Date-Wise page.');
//     console.log('Please perform the following manually:');
//     console.log('1. Select the desired option from the dropdown.');
//     console.log('2. Enter the "From" and "To" dates.');
//     console.log('3. Solve the captcha.');
//     console.log('4. Click the "Search" button.');

//     // Wait for the search results to load
//     await page.waitForSelector(TABLE_SELECTOR, { visible: true });
//     console.log('Search results loaded.');

//     // Function to scrape the current page
//     const scrapeTableData = async () => {
//         const rows = await page.$$(`${TABLE_SELECTOR} tr`);
//         console.log(`Found ${rows.length} rows in the table.`);
        
//         for (let i = 0; i < rows.length; i++) {
//             const row = rows[i];
//             const tds = await row.$$('td');
//             if (tds.length < 6) continue;

//             const statusTd = tds[5];
//             const statusText = await page.evaluate(el => el.textContent.trim(), statusTd);

//             if (statusText.includes(DISPOSED_TEXT)) {
//                 const linkElement = await statusTd.$('a');
//                 if (!linkElement) continue;

//                 let href = await page.evaluate(el => el.getAttribute('href'), linkElement);
//                 if (!href.startsWith('http')) href = `${BASE_URL}/${href}`;

//                 const newPage = await browser.newPage();
//                 try {
//                     await newPage.goto(href, { waitUntil: 'networkidle2' });
//                     console.log(`Opened new tab for row ${i + 1}.`);

//                     const cardSelector = '.accordion .card:nth-of-type(2)';
//                     await newPage.waitForSelector(cardSelector, { visible: true });

//                     const tableSelector = '.table-bordered tbody tr:nth-of-type(1) td:nth-of-type(4) a';
//                     await newPage.waitForSelector(tableSelector, { visible: true });

//                     const pdfLinkElement = await newPage.$(tableSelector);
//                     if (!pdfLinkElement) throw new Error('PDF link not found.');

//                     let pdfHref = await newPage.evaluate(el => el.getAttribute('href'), pdfLinkElement);
//                     if (!pdfHref.startsWith('http')) pdfHref = `${BASE_URL}/${pdfHref}`;

//                     console.log(`Found PDF link: ${pdfHref}`);

//                     // Download the PDF
//                     const fileName = `row_${i + 1}_pdf_${Date.now()}.pdf`;
//                     const destination = path.join(DOWNLOAD_DIR, fileName);

//                     try {
//                         await downloadPDF(pdfHref, destination);
//                         console.log(`Downloaded: ${fileName}`);
//                         logToCSV(fileName, 'Downloaded');
//                     } catch (err) {
//                         console.error(`Failed to download ${fileName}: ${err.message}`);
//                         logToCSV(fileName, `Failed: ${err.message}`);
//                     }
//                 } catch (err) {
//                     console.error(`Error processing row ${i + 1}: ${err.message}`);
//                     logToCSV(`row_${i + 1}_error`, `Failed: ${err.message}`);
//                 } finally {
//                     await newPage.close();
//                 }
//             } else {
//                 console.log(`Row ${i + 1} status is not 'Disposed'. Skipping.`);
//             }
//         }
//     }

//     // Function to scroll horizontally to reveal the "Next" button
//     async function scrollToNextButton(page) {
//         await page.evaluate(() => {
//             // Scroll horizontally by 1000px until the next button is visible
//             const nextButton = document.querySelector('.page-item a.page-link');
//             if (nextButton) {
//                 nextButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
//             }
//         });
//     }

//     // Function to check if the "Next" button is clickable
//     async function goToNextPage(page) {
//         const nextButtonSelector = '.page-item a.page-link';
//         const disabledButtonSelector = '.page-item.disabled a.page-link';

//         const nextButton = await page.$(nextButtonSelector);
//         const disabledButton = await page.$(disabledButtonSelector);

//         if (nextButton && !disabledButton) {
//             console.log('Clicking "Next" page button...');
//             await scrollToNextButton(page);  // Scroll before clicking
//             await nextButton.click();
//             await page.waitForNavigation({ waitUntil: 'networkidle2' });
//             return true;
//         }
//         return false;
//     }

//     // Paginate through all pages
//     let hasNextPage = true;
//     while (hasNextPage) {
//         console.log('Processing current page...');
//         // Scrape current page's rows
//         await scrapeTableData();

//         // Check and go to next page
//         hasNextPage = await goToNextPage(page);
//         if (hasNextPage) {
//             console.log('Moving to next page...');
//         } else {
//             console.log('No more pages to scrape.');
//         }
//     }

//     console.log('Scraping and downloading completed.');

//     await browser.close();
// })();


// V3  Working in single page

// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const path = require('path');
// const https = require('https');

// const BASE_URL = 'https://nclt.gov.in';
// const TARGET_URL = `${BASE_URL}/order-date-wise`;
// const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// // Ensure the downloads directory exists
// if (!fs.existsSync(DOWNLOAD_DIR)) {
//     fs.mkdirSync(DOWNLOAD_DIR);
// }

// // Function to download PDFs
// async function downloadPDF(url, destination) {
//     return new Promise((resolve, reject) => {
//         const file = fs.createWriteStream(destination);
//         https.get(url, (response) => {
//             if (response.statusCode === 200) {
//                 response.pipe(file);
//                 file.on('finish', () => {
//                     file.close(resolve);
//                 });
//             } else {
//                 reject(`Failed to download PDF: ${response.statusCode}`);
//             }
//         }).on('error', reject);
//     });
// }

// // Main Puppeteer logic
// (async () => {
//     const browser = await puppeteer.launch({
//         headless: false, // Set to false for debugging
//         defaultViewport: null,
//         args: ['--start-maximized']
//     });
//     const page = await browser.newPage();

//     // Navigate to the target URL
//     await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
//     console.log('Please perform manual inputs and hit "Search". Waiting...');

    
// try {
//     console.log('Waiting for the table to load...');
//     await page.waitForSelector('.table.table-borderd tbody', { visible: true, timeout: 60000 }); // Wait up to 60 seconds
//     console.log('Table loaded. Scraping rows...');
// } catch (error) {
//     console.error('Table did not load within the timeout period. Debugging the issue...');
//     const pageHTML = await page.content();
//     fs.writeFileSync('page_debug.html', pageHTML); // Save the page HTML for inspection
//     console.log('Saved current page content to "page_debug.html". Please inspect this file to verify the table structure.');
//     throw new Error('Failed to load the table. Please check the selector or the table loading process.');
// }


//     // Extract table rows
//     const rows = await page.$$eval('.table.table-borderd tbody tr', (rows) => {
//         return rows.map((row) => {
//             const tds = row.querySelectorAll('td');
//             const status = tds[tds.length - 1]?.innerText.trim();
//             const link = tds[tds.length - 1]?.querySelector('a')?.href;
//             return { status, link };
//         });
//     });

//     for (const [index, row] of rows.entries()) {
//         const { status, link } = row;
//         if (status === 'Disposed' && link) {
//             console.log(`Processing row ${index + 1}: ${link}`);
//             const newTab = await browser.newPage();

//             try {
//                 await newTab.goto(link, { waitUntil: 'networkidle2' });

//                 // Open accordion section
//                 const cardSelector = '.accordion .card:nth-of-type(2) [data-target="#collapseTwo"]';
//                 await newTab.waitForSelector(cardSelector, { visible: true });
//                 await newTab.click(cardSelector);

//                 // Wait for table to load
//                 const pdfLinkSelector = '#collapseTwo .table-bordered tbody tr:nth-of-type(1) td:nth-of-type(4) a';
//                 await newTab.waitForSelector(pdfLinkSelector, { visible: true });

//                 // Extract and download PDF
//                 const pdfLink = await newTab.$eval(pdfLinkSelector, (a) => a.href);
//                 console.log(`Downloading PDF: ${pdfLink}`);

//                 const fileName = `case_${index + 1}_${Date.now()}.pdf`;
//                 const filePath = path.join(DOWNLOAD_DIR, fileName);

//                 await downloadPDF(pdfLink, filePath);
//                 console.log(`PDF downloaded: ${fileName}`);
//             } catch (error) {
//                 console.error(`Error processing row ${index + 1}:`, error);
//             } finally {
//                 await newTab.close();
//             }
//         } else {
//             console.log(`Row ${index + 1} skipped: Status is "${status}"`);
//         }
//     }

//     console.log('Processing complete.');
//     await browser.close();
// })();



// V4 Pagination Checking ------------------------

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://nclt.gov.in';
const TARGET_URL = `${BASE_URL}/order-date-wise`;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Ensure the downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Function to download PDFs
async function downloadPDF(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                reject(`Failed to download PDF: ${response.statusCode}`);
            }
        }).on('error', reject);
    });
}

// Function to process a page's table rows and handle PDF downloads
async function processTableRows(page, browser) {
    const rows = await page.$$eval('.table.table-borderd tbody tr', (rows) => {
        return rows.map((row) => {
            const tds = row.querySelectorAll('td');
            const status = tds[tds.length - 1]?.innerText.trim();
            const link = tds[tds.length - 1]?.querySelector('a')?.href;
            return { status, link };
        });
    });

    for (const [index, row] of rows.entries()) {
        const { status, link } = row;
        if (status === 'Disposed' && link) {
            console.log(`Processing row ${index + 1}: ${link}`);
            const newTab = await browser.newPage();

            try {
                await newTab.goto(link, { waitUntil: 'networkidle2' });

                // Open accordion section
                const cardSelector = '.accordion .card:nth-of-type(2) [data-target="#collapseTwo"]';
                await newTab.waitForSelector(cardSelector, { visible: true });
                await newTab.click(cardSelector);

                // Wait for table to load
                const pdfLinkSelector = '#collapseTwo .table-bordered tbody tr:nth-of-type(1) td:nth-of-type(4) a';
                await newTab.waitForSelector(pdfLinkSelector, { visible: true });

                // Extract and download PDF
                const pdfLink = await newTab.$eval(pdfLinkSelector, (a) => a.href);
                console.log(`Downloading PDF: ${pdfLink}`);

                const fileName = `case_${index + 1}_${Date.now()}.pdf`;
                const filePath = path.join(DOWNLOAD_DIR, fileName);

                await downloadPDF(pdfLink, filePath);
                console.log(`PDF downloaded: ${fileName}`);
            } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error);
            } finally {
                await newTab.close();
            }
        } else {
            console.log(`Row ${index + 1} skipped: Status is "${status}"`);
        }
    }
}

// Main Puppeteer logic with pagination
(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Set to false for debugging
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    // Navigate to the target URL
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
    console.log('Please perform manual inputs and hit "Search". Waiting...');

    // Wait for user to interact and load results
    function delay(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    await delay(30000); // Adjust this as needed

    try {
        console.log('Waiting for the table to load...');
        await page.waitForSelector('.table.table-borderd tbody', { visible: true, timeout: 60000 });
        console.log('Table loaded. Starting scraping...');

        while (true) {
            // Process the current page
            await processTableRows(page, browser);

            // Check if the 'Next' button is disabled
            const nextButton = await page.$('ul.pagination li.next');
            if (!nextButton) {
                console.log('No "Next" button found. Exiting pagination.');
                console.log(`Current page URL: ${page.url()}`);

                break;
            }

            const isNextDisabled = await nextButton.evaluate((node) =>
                node.classList.contains('disabled')
            );
            console.log(`Is 'Next' button disabled: ${isNextDisabled}`);

            if (isNextDisabled) {
                console.log('Reached the last page. Exiting pagination.');
                break;
            }

            // Click the 'Next' button and wait for the next page to load
            console.log('Navigating to the next page...');
            await nextButton.click();
            await page.waitForTimeout(2000); // Adjust the timeout if necessary
            await page.waitForSelector('.table.table-borderd tbody', { visible: true });
        }

        console.log('Scraping completed.');
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }
})();
