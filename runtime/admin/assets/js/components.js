document.addEventListener('DOMContentLoaded', () => {
    /**
     * Fetches HTML content from a URL and injects it into a target element.
     * @param {string} targetSelector The CSS selector of the element to inject into.
     * @param {string} sourceUrl The URL of the HTML file to fetch.
     */
    const loadComponent = async (targetSelector, sourceUrl) => {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        try {
            const response = await fetch(sourceUrl);
            if (!response.ok) throw new Error(`Failed to load ${sourceUrl}`);
            const html = await response.text();
            targetElement.innerHTML = html;
        } catch (error) {
            console.error(`Error loading component for ${targetSelector}:`, error);
            targetElement.innerHTML = `<p class="has-text-danger">Error loading component.</p>`;
        }
    };

    // Load navbar and sidebar, then set up mobile menu interactivity
    Promise.all([
        loadComponent('#navbar-placeholder', '/admin/_navbar.html'),
        loadComponent('#sidebar-placeholder', '/admin/_sidebar.html')
    ]).then(() => {
        // Hamburger menu toggle for mobile
        const burger = document.querySelector('.navbar-burger');
        const sidebar = document.querySelector('#sidebar-placeholder');

        if (burger && sidebar) {
            burger.addEventListener('click', () => {
                burger.classList.toggle('is-active');
                sidebar.classList.toggle('is-hidden-touch');
            });
        }

        // Set active link in sidebar
        const sidebarLinks = document.querySelectorAll('#sidebar-placeholder a');
        const currentPath = window.location.pathname;

        sidebarLinks.forEach(link => {
            // Remove is-active from all links first
            link.classList.remove('is-active');
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('is-active');
            }
        })
    });
});
