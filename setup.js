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



// Assortments of API calls


