// This area is meant for the desktop version of the setup UI
// License:

// Dynamic UI interactivity and configuration for the system

// Prefab
// This is where the rest of the setup UI logic will go in a function() format
// Though the display logic will be handled by the DOMContentLoaded event
function pageUIDisplayPage(targetHTML, pageID) {
    switch (pageID) {
        case 2: // New Page: Schema Verification
            targetHTML.innerHTML = `
            <h2 class="title is-4">Database Initialization</h2>
            <p class="subtitle is-6">This step will create missing tables and verify the database structure.</p>
            <div class="has-text-centered">
                <button class="button is-info" id="verify-schema-btn">Verify Schema</button>
            </div>
            <div class="dynamic-message" id="schema-results-message" style="margin-top: 20px;"></div>
            <hr/>
            `;
            nextBtn.disabled = true; // Disable until verification is successful
            break;

        case 3:
            // Test database
            targetHTML.innerHTML = `
            <h2 class="title is-4">Database Benchmark</h2>
            <p class="subtitle is-6">Try to test the system's connection to DB and Back, and it's IO speeds</p>
            <div class="has-text-centered">
                <button class="button is-primary" id="start-db-benchmark-btn">Start Benchmark Test</button>
            </div>
            <div class="dynamic-message" id="db-benchmark-message"></div>
            <hr/>
            `;
            break;

        case 4:
            // Admin Account Setup Page
            targetHTML.innerHTML = `
            <h2 class="title is-4">Admin Account Setup</h2>
            <p class="subtitle is-6">Create the initial administrator account for the system.</p>
            <div class="field">
                <label class="label">Username</label>
                <div class="control">
                    <input class="input" type="text" id="admin-username" placeholder="Enter admin username">
                </div>
            </div>
            <div class="field">
                <label class="label">Password</label>
                <div class="control">
                    <input class="input" type="password" id="admin-password" placeholder="Enter admin password">
                </div>
            </div>
            <div class="field">
                <label class="label">Confirm Password</label>
                <div class="control">
                    <input class="input" type="password" id="admin-confirm-password" placeholder="Confirm admin password">
                </div>
            </div>
            <hr/>
            <div class="field">
                <button class="button is-info" id="add-account-admin-btn">Add Admin Account</button>
                <button class="button is-info" id="validate-admin-btn">Validate Admin Credentials</button>
            <div class="dynamic-message" id="admin-message"></div>
            <hr/>
            
            `
            nextBtn.disabled = true; // Disable next button until validation
            // Add event listeners to input fields to validate
            const adminUsername = document.getElementById('admin-username');
            const adminPassword = document.getElementById('admin-password');
            const adminConfirmPassword = document.getElementById('admin-confirm-password');
            const adminMessage = document.getElementById('admin-message');

            
            break;

        case 5:
            // System Configuration Page
            targetHTML.innerHTML = `
            <h2 class="title is-4">System Configuration</h2>
            <p class="subtitle is-6">Configure the basic details for your school or organization.</p>
            
            <div class="field">
                <label class="label">School Name <span class="has-text-danger">*</span></label>
                <div class="control">
                    <input class="input" type="text" id="school-name" placeholder="e.g., OpenAttendance High School">
                </div>
            </div>

            <div class="columns is-multiline">
                <div class="column is-half">
                    <div class="field">
                        <label class="label">School Type</label>
                        <div class="control is-expanded">
                            <div class="select is-fullwidth">
                                <select id="school-type">
                                    <option value="">Select type</option>
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                    <option value="charter">Charter</option>
                                    <option value="international">International</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="column is-half">
                    <div class="field">
                        <label class="label">Country Code <span class="has-text-danger">*</span></label>
                        <div class="control">
                            <input class="input" type="text" id="country-code" placeholder="e.g., US, PH">
                        </div>
                        <p class="help">Use ISO 3166-1 alpha-2 codes. <a href="https://en.wikipedia.org/wiki/ISO_3166-1#Codes" rel="noopener noreferrer" target="_blank">What is ISO 3166-1 code of my own nation?</a></p>
                    </div>
                </div>
            </div>

            <div class="field">
                <label class="label">Address</label>
                <div class="control">
                    <textarea class="textarea" id="school-address" placeholder="Enter school address"></textarea>
                </div>
            </div>

            <div class="field">
                <label class="label">Organization Hotline (Optional)</label>
                <div class="control">
                    <input class="input" type="text" id="org-hotline" placeholder="e.g., +1-800-555-1234">
                </div>
            </div>

            <div class="field">
                <label class="label">School Logo (Optional)</label>
                <div class="field has-addons">
                    <div class="control is-expanded">
                        <input class="input" type="file" id="logo-file" name="logo_file" accept="image/*">
                    </div>
                </div>
            </div>

            <hr/>
            <div class="field">
                <button class="button is-info" id="save-config-btn">Save Configuration</button>
            </div>
            <div class="dynamic-message" id="config-message"></div>
            `;
            nextBtn.disabled = true; // Disable until config is saved
            break;

        case 6:
            // Final Landing
            targetHTML.innerHTML = `
            <h2 class="title is-4">Setup Complete!</h2>
            <p class="subtitle is-6">You have successfully completed the setup process.</p>
            <div class="has-text-centered">
                <p>You can now proceed to log in to the system using your admin account.</p>
                <button class="button is-primary" id="finish-setup-btn" onclick="alert("Run the runtime mode!")">Go to Login Page</button>
            </div>
            <hr/>
            `;
            const cardnavContainer = document.getElementById('cardnav-container');
            if (cardnavContainer) {
                cardnavContainer.style.display = 'none';
            }
            break;
    }

    // After rendering the HTML, attach the specific event listeners for that page.
    attachPageEventListeners(pageID);
}



    // Preparing components
    const dynamicBodyTarget = document.getElementById('dynamic-body-target');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const startSetup = document.getElementById('start-setup-btn');

    // Page ID variable holder
    let pageID = 0;

    // Start Setup Button Logic
    if (startSetup) {
        startSetup.addEventListener('click', () => {
            // Hide the start setup button
            startSetup.style.display = 'none';
            // Show back and next buttons
            backBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
            // Load Terms and Conditions content
            // initial page is greeting (0) -> TOC will be pageID 1
            pageID = 1;
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
                            `;
                        // Disable next button until checkbox is checked
                        nextBtn.disabled = true;
                        const acceptTocCheckbox = document.getElementById('accept-toc-checkbox');
                        if (acceptTocCheckbox) {
                            acceptTocCheckbox.addEventListener('change', (event) => {
                                nextBtn.disabled = !event.target.checked;
                            });
                        }
                    }
                })
                .catch(err => console.error('Failed to load TOC:', err));
        });
    }
                 
    // Next Button Logic
    // Use a single deterministic increment and guard against rapid double-clicks.
    nextBtn.addEventListener('click', (ev) => {
        // Prevent accidental double increment from rapid clicks
        if (nextBtn.disabled) return;
        nextBtn.disabled = true;
        setTimeout(() => { nextBtn.disabled = false; }, 250);

        // Advance page and display
        pageID = (typeof pageID === 'number') ? pageID + 1 : Number(pageID) + 1;
        console.log('Loading page ID:', pageID);
        pageUIDisplayPage(dynamicBodyTarget, pageID);
    });
    
    // Back Button Logic
    backBtn.addEventListener('click', () => {
        if (pageID > 1) {
            pageID -= 1;
            // Load the respective page content
            console.log("Loading page ID:", pageID);
            pageUIDisplayPage(dynamicBodyTarget, pageID);
        }
        if (pageID === 1) {
            // Dont go back to TOC!!!
            console.log("Loading page ID: ", pageID)
            return;
        }
    });

    function dbTestModal() {
        const modalHTML = `
        <div class="modal is-active" id="benchmark-modal">
            <div class="modal-background"></div>
            <div class="modal-card" > 
                <header class="modal-card-head">
                    <p class="modal-card-title">Database Benchmark Test</p>
                </header>
                    <section class="modal-card-body" id="benchmark-modal-body">
                        <p>Running some database benchmark tests. This will take a few moments. Please wait :D</p>
                        <progress class="progress is-small is-primary is-indeterminate" max="100"></progress>
                        <div id="benchmark-results-body" style="margin-top:12px;">Preparing results...</div>
                    </section>
                <footer class="modal-card-foot">
                        <button class="button is-success" id="benchmark-close-btn">Close</button>
                </footer>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('benchmark-modal');
        if (!modal) return;
        const closeModal = () => {
            if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        };

        const del = modal.querySelector('.delete');
        if (del) del.addEventListener('click', closeModal);
        const bg = modal.querySelector('.modal-background');
        if (bg) bg.addEventListener('click', closeModal);
        const closeBtn = modal.querySelector('#benchmark-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
    }

    // This listener is now only for elements that persist or are simple enough
    // for delegation. Complex page logic is moved to attachPageEventListeners.
    dynamicBodyTarget.addEventListener('click', async (event) => {
        const target = event && event.target;
        if (!target) return;
        if (target.id === 'start-db-benchmark-btn') {
            const button = target;
            button.classList.add('is-loading');
            button.disabled = true;

            // Show modal
            dbTestModal();

            // Run benchmark test (if function exists)
            if (typeof runDBBenchmark === 'function') {
                try {
                    const results = await runDBBenchmark();
                    if (typeof displayBenchmarkResults === 'function') displayBenchmarkResults(results);
                } catch (err) {
                    console.error('Benchmark failed:', err);
                }
            }
            


            button.classList.remove('is-loading');
            button.disabled = false;
        }

        if (target.id === 'verify-schema-btn') {
            const button = target;
            const messageDiv = document.getElementById('schema-results-message');
            button.classList.add('is-loading');
            button.disabled = true;
            messageDiv.innerHTML = '<p>Initializing database, please wait...</p>';

            try {
                const response = await fetch('/api/setup/verify-schema');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.details || data.error || 'An unknown server error occurred.');
                }

                let html = '';
                data.actions.forEach(action => {
                    switch(action.status) {
                        case 'created':
                            html += `<p class="has-text-success">✅ Created table: <strong>${action.table}</strong></p>`;
                            break;
                        case 'exists':
                            html += `<p class="has-text-info">🔹 Table already exists: <strong>${action.table}</strong> (Skipped)</p>`;
                            break;
                        default:
                            html += `<p class="has-text-danger">❌ Failed to create table: <strong>${action.table}</strong> - ${action.status}</p>`;
                    }
                });

                if (data.success) {
                    html = '<p class="has-text-success"><strong>Success!</strong> Database schema is valid.</p><hr/>' + html;
                    nextBtn.disabled = false;
                } else {
                    html = '<p class="has-text-danger"><strong>Initialization Failed!</strong> Could not create or verify all required tables. Check server logs for details.</p><hr/>' + html;
                }

                messageDiv.innerHTML = html;

            } catch (err) {
                messageDiv.innerHTML = `<p class="has-text-danger">An error occurred during verification: ${err.message}</p>`;
            } finally {
                button.classList.remove('is-loading');
                // Keep button disabled after running, regardless of outcome.
                button.disabled = true;
            }
        }
    });

    function attachPageEventListeners(pageID) {
        if (pageID === 3) { // Admin Account Setup
            const addBtn = document.getElementById('add-account-admin-btn');
            const validateBtn = document.getElementById('validate-admin-btn');
            const messageDiv = document.getElementById('admin-message');

            const handleAdminAction = (action) => {
                const username = document.getElementById('admin-username').value;
                const password = document.getElementById('admin-password').value;
                messageDiv.innerHTML = '';

                if (!username || !password) {
                    messageDiv.innerHTML = '<p class="has-text-danger">Username and password are required.</p>';
                    return;
                }

                if (action === 'add') {
                    const confirmPassword = document.getElementById('admin-confirm-password').value;
                    if (password !== confirmPassword) {
                        messageDiv.innerHTML = '<p class="has-text-danger">Passwords do not match.</p>';
                        return;
                    }
                    addAdminAccount(username, password)
                        .then(data => {
                            messageDiv.innerHTML = `<p class="has-text-success">${data.message}</p>`;
                            nextBtn.disabled = false;
                        })
                        .catch(err => {
                            messageDiv.innerHTML = `<p class="has-text-danger">Error: ${err.message}</p>`;
                        });
                } else if (action === 'validate') {
                    validateAdminCredentials(username, password)
                        .then(data => {
                            if (data.success) {
                                messageDiv.innerHTML = `<p class="has-text-success">${data.message}</p>`;
                                nextBtn.disabled = false;
                            }
                        })
                        .catch(err => {
                            messageDiv.innerHTML = `<p class="has-text-danger">Validation Failed: ${err.message}</p>`;
                        });
                }
            };

            if (addBtn) addBtn.addEventListener('click', () => handleAdminAction('add'));
            if (validateBtn) validateBtn.addEventListener('click', () => handleAdminAction('validate'));
        }

        if (pageID === 5) { // System Configuration
            const saveBtn = document.getElementById('save-config-btn');
            if (!saveBtn) return;

            saveBtn.addEventListener('click', () => {
                const messageDiv = document.getElementById('config-message');
                messageDiv.innerHTML = '';

                const formData = new FormData();
                formData.append('school_name', document.getElementById('school-name').value);
                formData.append('school_type', document.getElementById('school-type').value);
                formData.append('address', document.getElementById('school-address').value);
                formData.append('organization_hotline', document.getElementById('org-hotline').value);
                formData.append('country_code', document.getElementById('country-code').value);

                const logoFile = document.getElementById('logo-file').files[0];
                if (logoFile) formData.append('logo_file', logoFile);

                if (!formData.get('school_name') || !formData.get('country_code')) {
                    messageDiv.innerHTML = '<p class="has-text-danger">School Name and Country Code are required.</p>';
                    return;
                }

                saveBtn.classList.add('is-loading');

                saveConfiguration(formData)
                .then(data => {
                    messageDiv.innerHTML = `<p class="has-text-success">${data.message}</p>`;
                    nextBtn.disabled = false; // Enable next button
                    saveBtn.disabled = true; // Prevent re-saving
                })
                .catch(err => {
                    messageDiv.innerHTML = `<p class="has-text-danger">Error: ${err.message}</p>`;
                })
                .finally(() => saveBtn.classList.remove('is-loading'));
            });
        }
    }

    function displayBenchmarkResults(results) {
        // Cleaning up the loading ui
        const body_benchcard = document.getElementById('benchmark-modal-body');
        if (body_benchcard) {
            body_benchcard.innerHTML = `
            <div id="benchmark-results-body" style="margin-top:12px;">Preparing results...</div>
            `;
        }
        const resultsBody = document.getElementById('benchmark-results-body');

        const calculateStats = (times) => {
            if (times.length === 0) return { avg: 0, min: 0, max: 0 };
            const sum = times.reduce((a, b) => a + b, 0);
            const avg = sum / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);
            return {
                avg: avg.toFixed(2),
                min: min.toFixed(2),
                max: max.toFixed(2)
            };
        };

        const seqWriteStats = calculateStats(results.sequentialWriteTimes);
        const bulkWriteStats = calculateStats(results.bulkWriteTimes);
        const readStats = calculateStats(results.sequentialReadTimes);

        resultsBody.innerHTML = `
            <p>Benchmark finished in <strong>${results.totalTime.toFixed(2)} seconds</strong>.</p>
            <table class="table is-fullwidth is-striped is-hoverable">
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Operations</th>
                        <th>Avg. Time (ms)</th>
                        <th>Min. Time (ms)</th>
                        <th>Max. Time (ms)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Sequential Writes (10s)</td>
                        <td>${results.sequentialWrites.toLocaleString()}</td>
                        <td>${seqWriteStats.avg}</td>
                        <td>${seqWriteStats.min}</td>
                        <td>${seqWriteStats.max}</td>
                    </tr>
                    <tr>
                        <td>Bulk Writes (10s, ${results.bulkSize} per op)</td>
                        <td>${results.bulkWrites.toLocaleString()}</td>
                        <td>${bulkWriteStats.avg}</td>
                        <td>${bulkWriteStats.min}</td>
                        <td>${bulkWriteStats.max}</td>
                    </tr>
                    <tr>
                        <td>Read All (${results.sequentialReads.toLocaleString()} records)</td>
                        <td>1</td>
                        <td>${readStats.avg}</td>
                        <td>${readStats.min}</td>
                        <td>${readStats.max}</td>
                    </tr>
                </tbody>
            </table>
            <p class="is-size-7"><em>Note: The benchmark table has been cleaned up.</em></p>
        `;
    }
