// Forbidden Page under Bulma Framework for desktop users
// License:

// Script to handle the UI and dynamic content
document.addEventListener('DOMContentLoaded', () => {
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Add event triggers on each
    $navbarBurgers.forEach( (el) => {
        el.addEventListener('click', () => {
            const target = el.dataset.target;
            const $target = document.getElementById(target);

            // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
        });
    });

    // Function to update page content based on URL parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const title = params.get('title');
    const message = params.get('message');

    if (code && title && message) {
        document.getElementById('error-title').textContent = title;
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-code-display').textContent = code;
    }

    // Add event listener to the back link
    document.querySelector('.back-link').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.back();
    });
});