/**
 * Sends a request to the server to save the system configuration.
 * @param {FormData} formData The configuration data, including the logo file.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response.
 */
async function saveConfiguration(formData) {
    const response = await fetch('/api/setup/configure', {
        method: 'POST',
        // Do not set the 'Content-Type' header when using FormData.
        // The browser will automatically set it to 'multipart/form-data'
        // with the correct boundary.
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}