// Credentials for Sign in, Register, and Admin Setup
// This file is a functional module tool to handle credential addition and validation

/**
 * Sends a request to the server to create a new admin account.
 * @param {string} username The admin's username.
 * @param {string} password The admin's password.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response.
 */
async function addAdminAccount(username, password) {
    const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        // If the response is not OK, parse the error JSON and throw it
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Sends a request to the server to validate existing admin credentials.
 * @param {string} username The admin's username.
 * @param {string} password The admin's password.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response.
 */
async function validateAdminCredentials(username, password) {
    const response = await fetch('/api/setup/validate-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

