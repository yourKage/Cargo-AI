// background.js

// URL for your local Flask server
const FLASK_URL = 'http://127.0.0.1:5000/receive-data'; 

// Listener for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendData') {
        const dataToSend = request.payload;
        
        fetch(FLASK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(result => {
            let feedback = { action: 'feedback', status: 'error', message: 'Unknown error', loads_found: 0 };
            
            if (result.status === 200) {
                feedback = { 
                    action: 'feedback', 
                    status: 'success', 
                    message: 'Data sent', 
                    loads_found: result.body.loads_found || 0 
                };
            } else {
                feedback = { 
                    action: 'feedback', 
                    status: 'error', 
                    message: `Server Error: ${result.body.message || 'Check Flask console.'}` 
                };
            }
            
            // Send feedback back to the popup.js
            chrome.runtime.sendMessage(sender.tab.id, feedback);
        })
        .catch(error => {
            console.error('Error connecting to Flask server:', error);
            const feedback = { action: 'feedback', status: 'error', message: 'Network error' };
            chrome.runtime.sendMessage(sender.tab.id, feedback);
        });

        // Return true for asynchronous response
        return true; 
    }
});