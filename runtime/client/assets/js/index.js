
document.addEventListener('DOMContentLoaded', async() => {
    const logInOrOutBtn = document.getElementById('logoutorin');

    if (logInOrOutBtn) {
        if (checkAuthStatus === true) {
            logInOrOutBtn.innerText = `Log Out`;

        } else {
            logInOrOutBtn.innerText = `Log In`;
            logInOrOutBtn.href = "/login"
        }

        if (logInOrOutBtn.onclick) {
            if (checkAuthStatus === true) {
                logoutUser();
            }
        }
    }
})