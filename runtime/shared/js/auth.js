/**
 * Checks if the user is currently logged in by looking for a flag in sessionStorage.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
function checkAuthStatus() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Logs the user in by setting a flag in sessionStorage.
 */
function loginUser() {
    sessionStorage.setItem('isLoggedIn', 'true');
}

/**
 * Logs the user out by removing the flag from sessionStorage.
 */
function logoutUser() {
    sessionStorage.removeItem('isLoggedIn');
}
