// OpenAttendance JavaScript code for Setup
// License: 
// This is a setup file for the project
// Note that the page root is on setup directory, and the port should be different
// Than the runtime to avoid conflicts and stupidity of the end user

const express = require('express');
const path = require('path');
const sequelize = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const PORT = 3999; // Our setup port
const crypto = require('crypto');
const mkdirp = require('mkdirp');
let debugMode = false;
let logFilePath;
let argenv = process.argv.slice(2);

// DebugWriteToFile function
// From @MizProject/Mitra setup.js
// Check if being run by nodemon
if (argenv.includes('--debug')) {
    console.log("Setup is being run with --debug flag.");
    console.log("Which means, its being run in development mode.");
    console.log("Enabling extreme debug logging for development.");
    debugMode = true; // This was a const, changed to let.
    // Now, create the logfile
    const __dayToday = new Date();
    const __timeToday = __dayToday.toLocaleTimeString().replace(/:/g, '-');
    const __dateToday = __dayToday.toLocaleDateString().replace(/\//g, '-');
    // Variable for logfile name should be exposed at runtime so no new file
    // is created every time a log is written to.
    const logFileName = `debug-openattendance-runtime-log-${__dateToday}_${__timeToday}.log`;
    const logDir = path.join(__dirname, 'data', 'logs');
    mkdirp.sync(logDir); // Ensure the directory exists
    logFilePath = path.join(logDir, logFileName); // Assign to the higher-scoped variable
    fs.writeFileSync(logFilePath, `Debug Log Created on ${__dateToday} at ${__timeToday}\n\n`);
    debugLogWriteToFile(`Debug logging started. Log file: ${logFilePath}`);
}

function debugLogWriteToFile(message) {
    if (debugMode === false) return;
    // Fetch timedate for stamping
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry); // logFilePath is now in scope
}

// Override console.log to also write to log file in debug mode
console.error = function(message) {
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] ERROR: ${message}\n`;
    if (debugMode) {
        fs.appendFileSync(logFilePath, logEntry);
        process.stdout.write(logEntry);
    } else {
        // In non-debug mode, spit it out to the console only
        process.stdout.write(logEntry);
    }
};

// Also pass the warn to log
console.warn = function(message) {
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] WARNING: ${message}\n`;
    if (debugMode) {
        fs.appendFileSync(logFilePath, logEntry);
        process.stdout.write(logEntry);
    } else {
        process.stdout.write(logEntry);
    }
};

// Capture process terminations while on debug
process.on('exit', (code) => {
    debugLogWriteToFile(`Setup process exiting with code: ${code}`);
})

process.on('SIGINT', () => {
    debugLogWriteToFile("Setup process interrupted (SIGINT). Exiting...");
    process.exit(0);
})

process.on('uncaughtException', (err) => {
    debugLogWriteToFile(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

function brkln(type) {
    /** 
    * Prints break lines for readability
    * @param {string} type The type of break line: `nl` for new line and `dl` for dashed line and `el` for equal line
    * @returns {void} Prints the break line to console
    */
    switch (type) {
        case 'nl':
            return console.log('\n');
        case 'dl':
            return console.log('----------------------------------------');
        case 'el':
            return console.log('========================================');
        default:
            return console.log(`\n`);
    }

}

// Use static links
app.use('/node', express.static(path.join(__dirname, 'node_modules')));
app.use('/shared', express.static(path.join(__dirname, 'runtime', 'shared')));
app.use('/admin/assets', express.static(path.join(__dirname, 'runtime', 'admin', 'assets')));
app.use('/client/assets', express.static(path.join(__dirname, 'runtime', 'client', 'assets')));


// Server start, notify on which port
app.listen(PORT, () => {
    brkln('el');
    console.log(`OpenAttendance Runtime is running on http://localhost:${PORT}`);
    brkln('nl');
    console.log(`OpenAttendance Runtime Admin is running on http://localhost:${PORT}/admin`);
    brkln('el');
});


// Forbidden page
app.get('/forbidden', (req, res) => {
    // First, check if the device is mobile or desktop
    const userAgent = req.headers['user-agent'];
    const isMobile = /mobile/i.test(userAgent);

    if (isMobile) {
        // Serve the Framework7 version
        return res.sendFile(path.join(__dirname, 'runtime/shared/html/mobile/forbidden.html'));
    } else {
        // Serve the Bulma version
        return res.sendFile(path.join(__dirname, 'runtime/shared/html/desktop/forbidden.html'));
    }
})

// Redirect any direct access to /api path to the forbidden page
app.get('/api', (req, res) => {
    const error = {
        code: 403,
        title: 'Forbidden',
        message: 'API endpoints cannot and SHOULD NOT be accessed directly in a browser.'
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

