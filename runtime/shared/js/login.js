document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const messageDiv = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            messageDiv.innerHTML = '';
            loginBtn.classList.add('is-loading');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    messageDiv.innerHTML = `<p class="has-text-success">${data.message}</p>`;
                    loginUser(); // Set the login flag from auth.js
                    // Redirect to the homepage after a short delay to show the success message
                    setTimeout(() => { window.location.href = '/'; }, 1000);
                } else {
                    throw new Error(data.error || 'An unknown error occurred.');
                }
            } catch (err) {
                messageDiv.innerHTML = `<p class="has-text-danger">Error: ${err.message}</p>`;
            } finally {
                loginBtn.classList.remove('is-loading');
            }
        });
    }
});
