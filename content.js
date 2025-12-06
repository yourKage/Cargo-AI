// content.js



// Function to capture the entire HTML content of the page body

function captureLoadData() {

    // Get the HTML content of the <body> tag as a string

    const htmlContent = document.body.outerHTML;



    const data = {

        url: window.location.href, // For context

        // The key data you want to send

        html_payload: htmlContent

    };

    return data;

}



// Function to inject the button (same as before)

function injectSendButton() {

    const button = document.createElement('button');

    button.textContent = 'Send Page HTML to Flask';

    button.style.cssText = `

        position: fixed;

        bottom: 10px;

        right: 10px;

        padding: 10px;

        background-color: #337ab7;

        color: white;

        border: none;

        border-radius: 5px;

        z-index: 10000;

        cursor: pointer;

    `;



    button.addEventListener('click', () => {

        const loadData = captureLoadData();

        console.log('HTML Data captured. Size:', loadData.html_payload.length, 'characters');



        // Send a message to the background script

        chrome.runtime.sendMessage({ action: 'sendData', payload: loadData }, (response) => {

            if (chrome.runtime.lastError) {

                console.error("Error sending message:", chrome.runtime.lastError.message);

            }

            if (response && response.status === 'success') {

                alert('HTML successfully sent to Flask server!');

            } else {

                alert('Failed to send HTML to Flask server.');

            }

        });

    });



    document.body.appendChild(button);

}



injectSendButton();



