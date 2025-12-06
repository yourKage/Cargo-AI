let isRunning = false;
let totalLoads = 0;
let processedLoads = 0;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusDiv = document.getElementById('status');
    const statsDiv = document.getElementById('stats');
    const progressBar = document.getElementById('progressBar');

    const updateProgress = () => {
        if (totalLoads === 0) {
            progressBar.style.width = '0%';
            return;
        }
        const percent = Math.min((processedLoads / totalLoads) * 100, 100);
        progressBar.style.width = percent + '%';
        progressBar.style.background = percent >= 100 ? '#10b981' : '#2563eb';
    };

    const setStatus = (text, isSuccess = false) => {
        statusDiv.textContent = text;
        statusDiv.style.color = isSuccess ? '#10b981' : '#4b5563';
    };

    const updateStats = () => {
        statsDiv.textContent = `Found: ${totalLoads} | Processed: ${processedLoads}/${totalLoads}`;
    };

    // START BUTTON
    startBtn.addEventListener('click', () => {
        if (isRunning) return;

        isRunning = true;
        processedLoads = 0;
        totalLoads = 0;

        startBtn.disabled = true;
        stopBtn.disabled = false;
        setStatus('Starting scraper...');
        updateStats();
        updateProgress();

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: captureAndSendHTML
            });
        });
    });

    // STOP BUTTON — NOW WORKS INSTANTLY
    stopBtn.addEventListener('click', () => {
        setStatus('STOPPING scraper now...', false);
        stopBtn.disabled = true;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'stop' })
                .catch(() => console.log("Tab might be closed or inaccessible"));
        });
    });

    // LISTEN FOR UPDATES FROM CONTENT SCRIPT
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'update') {
            totalLoads = msg.total ?? totalLoads;
            processedLoads = msg.processed ?? processedLoads;
            updateStats();
            updateProgress();
        }

        else if (msg.action === 'feedback') {
            isRunning = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            setStatus(`FINISHED! ${processedLoads} loads → Live JSON updated!`, true);
            updateProgress();
            setTimeout(() => window.close(), 6000);
        }
    });
});

// FULLY FIXED SCRAPING FUNCTION — STOP WORKS 100%
async function captureAndSendHTML() {
    console.clear();
    console.log("%cDAT ONE ULTIMATE 2025 — LIVE + TRIP + TOTAL MILES + TRUCK TYPE", "color:gold;font-size:36px;font-weight:bold");

    let shouldStop = false;

    // Listen for stop command
    const stopListener = (message) => {
        if (message?.action === 'stop') {
            shouldStop = true;
            console.log("%cSTOP COMMAND RECEIVED — ABORTING GRACEFULLY", "color:red;font-size:24px;font-weight:bold");
        }
    };
    chrome.runtime.onMessage.addListener(stopListener);

    const cleanup = () => {
        chrome.runtime.onMessage.removeListener(stopListener);
    };

    // Scroll to bottom to load all loads
    const viewport = document.querySelector('cdk-virtual-scroll-viewport, #table-viewport');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
    await new Promise(r => setTimeout(r, 4000));

    if (shouldStop) { cleanup(); return; }

    const cells = document.querySelectorAll('[data-test="load-origin-cell"]');
    const total = cells.length;
    chrome.runtime.sendMessage({ action: 'update', total });

    console.log(`Found ${total} loads — starting scrape`);

    const allLoads = [];
    const clean = (txt) => !txt || ['–','—','-',''].includes(txt?.trim()) ? 'N/A' : txt.trim();

    for (let i = 0; i < cells.length; i++) {
        if (shouldStop) {
            console.log("%cSCRAPING STOPPED BY USER", "color:red;font-size:28px");
            cleanup();
            break;
        }

        const cell = cells[i];
        const row = cell.closest('div.row-container');

        cell.scrollIntoView({ block: "center" });
        await new Promise(r => setTimeout(r, 700));
        if (shouldStop) { cleanup(); break; }

        cell.click();

        // Wait for details panel
        for (let t = 0; t < 2400; t += 200) {
            if (shouldStop) {
                cell.click(); // close panel
                cleanup();
                break;
            }
            await new Promise(r => setTimeout(r, 200));
        }
        if (shouldStop) { cleanup(); break; }

        const originCity = cell.querySelector('.truncate')?.textContent.trim() || '';
        let panel = null;
        for (const p of document.querySelectorAll('dat-load-details')) {
            if (p.textContent.includes(originCity)) {
                panel = p;
                break;
            }
        }

        if (!panel) {
            console.warn(`Load ${i+1} → no panel`);
            cell.click();
            await new Promise(r => setTimeout(r, 800));
            chrome.runtime.sendMessage({ action: 'update', processed: i + 1 });
            continue;
        }

        // EXTRACT DATA
        const tripMilesText = panel.querySelector('.trip-miles')?.textContent.replace(' mi', '').trim() || 'N/A';

        const dhoRaw = row.querySelector('[data-test="load-dho-cell"]')?.textContent.trim().replace(/\(|\)/g, '') || '';
        const dhdRaw = row.querySelector('[data-test="load-dhd-cell"]')?.textContent.trim().replace(/\(|\)/g, '') || '';
        const dho = dhoRaw ? dhoRaw : 'N/A';
        const dhd = dhdRaw ? dhdRaw : 'N/A';

        const tripNum = tripMilesText === 'N/A' ? 0 : parseInt(tripMilesText) || 0;
        const dhoNum = dho === 'N/A' ? 0 : parseInt(dho) || 0;
        const dhdNum = dhd === 'N/A' ? 0 : parseInt(dhd) || 0;
        const totalMiles = tripNum + dhoNum + dhdNum;

        const items = panel.querySelectorAll('dat-equipment .data-item');
        const truck = items.length >= 2 ? clean(items[1].textContent) : 'N/A';

        const load = {
            No: i + 1,
            Origin: originCity + ", " + (cell.querySelector('.state')?.textContent || ''),
            Destination: (row.querySelector('[data-test="load-destination-cell"] .truncate')?.textContent || '') + ", " +
                         (row.querySelector('[data-test="load-destination-cell"] .state')?.textContent || ''),
            Trip_Miles: tripMilesText,
            Total_Miles: totalMiles || 'N/A',
            Rate: row.querySelector('.offer')?.textContent.trim() || 'N/A',
            Company: row.querySelector('[data-test="load-company-cell"]')?.textContent.trim() || 'N/A',
            Phone: panel.querySelector('a[href^="tel:"]')?.textContent.trim() || 'N/A',
            Email: panel.querySelector('a[href^="mailto:"]')?.href.replace('mailto:', '') || 'N/A',
            Truck: truck,
            Commodity: items.length >= 5 ? clean(items[4].textContent) : 'N/A',
            Reference_ID: items.length ? clean(items[items.length - 1].textContent) : 'N/A',
            MC_Number: panel.querySelector('div.city-spacing')?.textContent.match(/MC#(\d+)/)?.[1] || 'N/A',
            "DH-O": dho,
            "DH-D": dhd
        };

        allLoads.push(load);

        // LIVE UPDATE TO SERVER
        if (!shouldStop) {
            fetch('http://127.0.0.1:5000/update-live-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loads: allLoads })
            }).catch(() => {});
        }

        console.log(`Load ${i+1}/${total} → ${load.Trip_Miles} mi | Total: ${load.Total_Miles} mi | ${load.Truck}`);
        console.table(load);

        cell.click(); // close
        await new Promise(r => setTimeout(r, 800));

        chrome.runtime.sendMessage({ action: 'update', processed: i + 1 });
    }

    cleanup();

    if (!shouldStop) {
        chrome.runtime.sendMessage({ action: 'feedback' });
        console.log(`\nFINISHED! ${allLoads.length} loads → Live JSON Updated!`);
    } else {
        console.log(`\nSTOPPED — ${allLoads.length} loads processed`);
    }
}