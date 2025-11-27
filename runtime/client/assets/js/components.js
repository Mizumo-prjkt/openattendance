document.addEventListener('DOMContentLoaded', () => {
    // Function to fetch and inject HTML content
    const fetchAndInject = (url, placeholderId, callback) => {
        fetch(url).then(response => response.text()).then(data => {
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.innerHTML = data;
                if (callback) callback(); // Execute the callback after injection
            }
        }).catch(error => console.error(`Failed to load ${url}:`, error));
    };

    // Callback function to initialize navbar burger after it's loaded
    const initializeNavbar = () => {
        const burger = document.querySelector('.navbar-burger');
        if (burger) {
            burger.addEventListener('click', () => {
                const targetId = burger.dataset.target;
                const targetElement = document.getElementById(targetId);

                const sidebarId = burger.dataset.sidebarTarget;
                const sidebarElement = document.getElementById(sidebarId);

                burger.classList.toggle('is-active');
                if (targetElement) targetElement.classList.toggle('is-active');
                if (sidebarElement) sidebarElement.classList.toggle('is-active');
            });
        }
    };

    // Load navbar and then initialize it. Load sidebar normally.
    fetchAndInject('/client/_navbar.html', 'navbar-placeholder', initializeNavbar);
    fetchAndInject('/client/_sidebar.html', 'sidebar-placeholder');
});
