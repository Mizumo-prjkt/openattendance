// This area is meant for the desktop version of the setup UI
// License:

// Dynamic UI interactivity and configuration for the system

// Prefab
// This is where the rest of the setup UI logic will go in a function() format
// Though the display logic will be handled by the DOMContentLoaded event
function pageUIDisplayPage(targetHTML, pageID) {
    switch (pageID) {
        case 2:
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
            
        case 3:
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
            <div class="dynamic-message" id="admin-message"></div>
            <hr/>
            
            `
            nextBtn.disabled = true; // Disable next button until valid input
            // Add event listeners to input fields to validate
            const adminUsername = document.getElementById('admin-username');
            const adminPassword = document.getElementById('admin-password');
            const adminConfirmPassword = document.getElementById('admin-confirm-password');
            const adminMessage = document.getElementById('admin-message');

            
            break;
    }
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

    // Listen for clicks inside the dynamic area and react to the benchmark start button
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
    });

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

