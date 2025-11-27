/**
 * Displays a loading state on the login form.
 * @param {HTMLElement} loginBtn The login button element.
 * @param {HTMLElement} messageDiv The element where messages are displayed.
 */
function showLoginLoading(loginBtn, messageDiv) {
    if (messageDiv) messageDiv.innerHTML = '';
    if (loginBtn) loginBtn.classList.add('is-loading');
}

/**
 * Hides the loading state on the login form.
 * @param {HTMLElement} loginBtn The login button element.
 */
function hideLoginLoading(loginBtn) {
    if (loginBtn) loginBtn.classList.remove('is-loading');
}

/**
 * Displays a success message on the login form.
 * @param {HTMLElement} messageDiv The element where messages are displayed.
 * @param {string} message The success message to display.
 */
function showLoginSuccess(messageDiv, message) {
    if (messageDiv) messageDiv.innerHTML = `<p class="has-text-success">${message}</p>`;
}

/**
 * Displays an error message on the login form.
 * @param {HTMLElement} messageDiv The element where messages are displayed.
 * @param {string} message The error message to display.
 */
function showLoginError(messageDiv, message) {
    if (messageDiv) messageDiv.innerHTML = `<p class="has-text-danger">Error: ${message}</p>`;
}
