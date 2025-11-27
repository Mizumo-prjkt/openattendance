document.addEventListener('DOMContentLoaded', () => {
    // Immediately check if the user is already logged in.
    // If so, redirect them away from the login page to the admin panel.
    (async function checkSessionAndRedirect() {
        try {
            const response = await fetch('/api/admin/auth-status');
            if (response.ok) {
                // If response is OK (status 200), user is already logged in.
                console.log('User already has a valid session. Redirecting to admin panel.');
                window.location.href = '/admin-panel';
            }
            // If response is not OK (e.g., 401), do nothing. The user needs to log in,
            // so we let them see the login form.
        } catch (error) {
            // If there's a network error, it's safest to just stay on the login page.
            console.error('Auth status check failed:', error);
        }
    })();

    // Set up the login form functionality for users who are not logged in.
    const loginForm = document.getElementById('admin-login-form');
    const loginBtn = document.getElementById('admin-login-btn');
    const messageDiv = document.getElementById('admin-login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;

            showLoginLoading(loginBtn, messageDiv);

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showLoginSuccess(messageDiv, data.message);
                    // On success, redirect to the main admin route, which will then
                    // route to the admin panel because a session now exists.
                    setTimeout(() => { window.location.href = '/admin'; }, 1000);
                } else {
                    // This will handle cases where the server responds with an error JSON
                    throw new Error(data.error || 'An unknown error occurred.');
                }
            } catch (err) {
                // Enhanced error logging
                console.error("Login failed. Raw error:", err);
                showLoginError(messageDiv, err.message);
            } finally {
                hideLoginLoading(loginBtn);
            }
        });
    }
});
