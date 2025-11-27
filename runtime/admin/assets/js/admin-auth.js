/**
 * Checks if an admin is authenticated by checking for a server-side session.
 * If the admin is not authenticated, it redirects them to the login page.
 * This function should be called at the top of any protected admin page script.
 */
async function requireAdminAuth() {
    try {
        // This endpoint needs to be created. It will return 200 if session is valid, 401 otherwise.
        const response = await fetch('/api/admin/auth-status');
        if (!response.ok) window.location.href = '/admin-login';
    } catch (error) {
        window.location.href = '/admin-login';
    }
}
