document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('config-form');
    const saveBtn = document.getElementById('save-config-btn');
    const smsForm = document.getElementById('sms-config-form');
    const saveSmsBtn = document.getElementById('save-sms-config-btn');
    const logoUploadInput = document.getElementById('school-logo-upload');
    const logoFileNameSpan = document.getElementById('logo-file-name');
    const logoPreviewImg = document.getElementById('logo-preview');

    /**
     * Tab switching logic
     */
    const tabs = document.querySelectorAll('.tabs li');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('is-active'));
            tab.classList.add('is-active');
            const target = tab.dataset.tab;
            tabPanes.forEach(pane => {
                pane.style.display = pane.id === target ? 'block' : 'none';
            });
        });
    });

    /**
     * Fetches the current configuration from the server and populates the form.
     */
    async function loadConfiguration() {
        try {
            const response = await fetch('/api/admin/configuration');
            if (!response.ok) {
                throw new Error('Failed to fetch configuration data.');
            }
            const config = await response.json();

            // Populate the form if data exists
            if (config && Object.keys(config).length > 0) {
                document.getElementById('school-name').value = config.school_name || '';
                document.getElementById('school-type').value = config.school_type || '';
                document.getElementById('school-address').value = config.address || '';
                document.getElementById('org-hotline').value = config.organization_hotline || '';
                document.getElementById('country-code').value = config.country_code || '';
                
                if (config.logo_directory) {
                    logoPreviewImg.src = config.logo_directory;
                }
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            alert('Could not load system configuration. Please check the console for details.');
        }
    }

    /**
     * Fetches the current SMS configuration and populates the form.
     */
    async function loadSmsConfiguration() {
        try {
            const response = await fetch('/api/admin/sms-configuration');
            if (!response.ok) throw new Error('Failed to fetch SMS settings.');
            const smsConfig = await response.json();

            if (smsConfig) {
                document.getElementById('sms-sender-name').value = smsConfig.sender_name || '';
                const apiKeyInput = document.getElementById('sms-api-key');
                if (smsConfig.is_api_key_set) {
                    apiKeyInput.placeholder = 'API Key is set. Leave blank to keep it.';
                } else {
                    apiKeyInput.placeholder = 'No API Key found. Please enter one.';
                }
            }
        } catch (error) {
            console.error('Error loading SMS configuration:', error);
        }
    }

    /**
     * Handles the form submission to save the configuration.
     */
    async function saveConfiguration(event) {
        event.preventDefault(); // Prevent default form submission
        saveBtn.classList.add('is-loading');

        const formData = new FormData();
        formData.append('school_name', document.getElementById('school-name').value);
        formData.append('school_type', document.getElementById('school-type').value);
        formData.append('address', document.getElementById('school-address').value);
        formData.append('organization_hotline', document.getElementById('org-hotline').value);
        formData.append('country_code', document.getElementById('country-code').value);

        const logoFile = logoUploadInput.files[0];
        if (logoFile) {
            formData.append('school_logo_upload', logoFile);
        }

        try {
            const response = await fetch('/api/admin/configuration', {
                method: 'POST',
                body: formData, // FormData handles multipart/form-data header
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'An unknown error occurred.');
            }

            alert(result.message);
            loadConfiguration(); // Reload data to show the new logo if uploaded
        } catch (error) {
            alert(`Error saving configuration: ${error.message}`);
        } finally {
            saveBtn.classList.remove('is-loading');
        }
    }

    /**
     * Handles the form submission to save the SMS configuration.
     */
    async function saveSmsConfiguration(event) {
        event.preventDefault();
        saveSmsBtn.classList.add('is-loading');

        const apiKey = document.getElementById('sms-api-key').value;
        const senderName = document.getElementById('sms-sender-name').value;

        const payload = { sender_name: senderName };
        if (apiKey) {
            payload.api_key = apiKey;
        }

        try {
            const response = await fetch('/api/admin/sms-configuration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            alert(result.message);
            loadSmsConfiguration(); // Reload to update placeholder text
        } catch (error) {
            alert(`Error saving SMS configuration: ${error.message}`);
        } finally {
            saveSmsBtn.classList.remove('is-loading');
        }
    }

    // Add event listener for the file input to update the file name and preview
    logoUploadInput.addEventListener('change', () => {
        const file = logoUploadInput.files[0];
        if (file) {
            logoFileNameSpan.textContent = file.name;
            logoPreviewImg.src = URL.createObjectURL(file); // Show a live preview
        }
    });

    // Add event listener for the save button
    form.addEventListener('submit', saveConfiguration);
    smsForm.addEventListener('submit', saveSmsConfiguration);

    // Initial load of configuration data
    loadConfiguration();
    loadSmsConfiguration();
});
