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

// Serve the files required for setup
app.use('/modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/assets', express.static(path.join(__dirname, 'setup/assets')));


