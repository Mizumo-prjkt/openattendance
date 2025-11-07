// OpenAttendance JavaScript code for Setup
// License: 
// This is a setup file for the project
// Note that the page root is on setup directory, and the port should be different
// Than the runtime to avoid conflicts and stupidity of the end user

// Note that node_modules domain should be set as /modules for better styling

const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080; // Our setup port

// Server start, notify on which port
app.listen(PORT, () => {
    console.log(`OpenAttendance Setup is running on http://localhost:${PORT}`);
});

// Serve the files required for setup
app.use('/modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/assets', express.static(path.join(__dirname, 'setup/assets')));

// Serve the Setup HTML First with index.html
// To process the device type
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'setup/index.html'));
})

// Rest of HTML files
// 
// 1. Forbidden Page - tells/redirects users to not access the page if unauthorized or non-existent
app.get('/forbidden', (req, res) => {
    // First, check if the device is mobile or desktop
    const userAgent = req.headers['user-agent'];
    const isMobile = /mobile/i.test(userAgent);

    if (isMobile) {
        // Serve the Framework7 version
        return res.sendFile(path.join(__dirname, 'setup/assets/html/mobile/forbidden.html'));
    } else {
        // Serve the Bulma version
        return res.sendFile(path.join(__dirname, 'setup/assets/html/desktop/forbidden.html'));
    }
})

// Redirect any direct access to /api path to the forbidden page
app.get('/api', (req, res) => {
    const error = {
        code: 403,
        title: 'Forbidden',
        message: 'API endpoints cannot be accessed directly in a browser.'
    };
    // Redirect to the forbidden page with error details as query parameters
    res.redirect(`/forbidden?code=${error.code}&title=${encodeURIComponent(error.title)}&message=${encodeURIComponent(error.message)}`);
});

// Catch-all for 404 Not Found errors
// This should be the last route handler to catch any unmatched requests.
app.use((req, res, next) => {
    const error = {
        code: 404,
        title: 'Page Not Found',
        message: `The page you requested at '${req.originalUrl}' could not be found.`
    };
    // Redirect to the forbidden page with 404 error details
    res.redirect(`/forbidden?code=${error.code}&title=${encodeURIComponent(error.title)}&message=${encodeURIComponent(error.message)}`);
});


// Assortments of API calls
// 
