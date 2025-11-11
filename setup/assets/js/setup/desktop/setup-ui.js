// This area is meant for the desktop version of the setup UI
// License:

// Dynamic UI interactivity and configuration for the system

// Prefab
// This is where the rest of the setup UI logic will go in a function() format
// Though the display logic will be handled by the DOMContentLoaded event
function afterAgreedtoTermsandConditions() {
    // Step 1: Database Configuration
    // Let user pick what database they want to use
    // For now, support MariaDB/MySQL and SQLite
    
}

// When the DOM is fully loaded

document.addEventListener('DOMContentLoaded', (event) => {
    // Set the dynamic body content based on detected browser info
    const dynamicBodyTarget = document.getElementById('dynamic-body-target');
    const browserName = localStorage.getItem('browserName');
    const deviceType = localStorage.getItem('deviceType');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');

    // Get the button that exists on the page when the script runs.
    const startSetupBtn = document.getElementById('start-setup-btn');

    // If user presses the start setup, we proceed to the next step, which is Terms and Conditions
    // The Terms and conditions file is a txt file
    // Though note that the formatting is basic, and we need to autofit the whole thing
    if (startSetupBtn) {
        startSetupBtn.addEventListener('click', () => {
            // Hide the start setup button
            startSetupBtn.style.display = 'none';
            // Show back and next buttons
            backBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
            // Load Terms and Conditions content
            fetch('/assets/others/terms_and_conditions/toc.txt')
                .then(response => response.text())
                .then(data => {
                    if (dynamicBodyTarget) {
                        dynamicBodyTarget.innerHTML = `
                            <h2 class="title is-4">Terms and Conditions</h2>
                            <div class="terms-content" style="height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;">
                                <pre style="white-space: pre-wrap; word-wrap: break-word;">${data}</pre>
                            </div>
                            <div class="has-text-centered" style="margin-top: 20px;">
                                <label>
                                    <input type="checkbox" id="accept-toc-checkbox">
                                    I accept the Terms and Conditions
                                </label>
                            </div>
                            <div class="card-navigation">
                                <button id="back-btn" class="button is-light">Back</button>
                                <button id="next-btn" class="button is-primary">Next</button>
                            </div>
                        `;
                        // Disable next button until checkbox is checked
                        nextBtn.disabled = true;
                        const acceptTocCheckbox = document.getElementById('accept-toc-checkbox');
                        acceptTocCheckbox.addEventListener('change', (event) => {
                            nextBtn.disabled = !event.target.checked;
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading Terms and Conditions:', error);
                });
        });
    }

})