// OpenAttendance JavaScript code for Setup
// License: 
// This is a setup file for the project
// Note that the page root is on setup directory, and the port should be different
// Than the runtime to avoid conflicts and stupidity of the end user

// Note that node_modules domain should be set as /modules for better styling


const express = require('express');
const path = require('path');
const sequelize = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const PORT = 8080; // Our setup port

// Initial variables
const crypto = require('crypto');
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
    const logFileName = `debug-Mitra-log-${__dateToday}_${__timeToday}.log`;
    const logDir = path.join(__dirname, 'development', 'logs');
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




// Server start, notify on which port
app.listen(PORT, () => {
    console.log(`OpenAttendance Setup is running on http://localhost:${PORT}`);
});

// Serve the files required for setup
app.use('/modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/assets', express.static(path.join(__dirname, 'setup/assets')));
// Parse JSON bodies for API endpoints
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the SQLite DB
// The db file is located at ./database/main.db relative to the project root
// Code components came from @MizProject/Mitra with modifications
const dbPath = path.join(__dirname, 'database', 'main.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`Error opening database ${dbPath}: ${err.message}`);
        debugLogWriteToFile(`Error opening database ${dbPath}: ${err.message}`);
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);
        // Create benchmark table if it doesn't exist
        // Meant to autospawn
        db.run(`CREATE TABLE IF NOT EXISTS benchmark_test (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            col_text1 TEXT,
            col_text2 TEXT,
            col_int1 INTEGER,
            col_int2 INTEGER,
            col_real1 REAL,
            col_real2 REAL,
            col_blob1 BLOB,
            col_date1 DATE,
            col_bool1 BOOLEAN
        )`, (err) => {
            if (err) {
                console.error(`Error creating table: ${err.message}`);
                debugLogWriteToFile(`Error creating table: ${err.message}`);
            }
        });
        // Create admin_login table
        db.run(`CREATE TABLE IF NOT EXISTS admin_login (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            recovery_code TEXT,
            privilege TEXT DEFAULT 'admin'
        )`, (err) => {
            if (err) {
                console.error(`Error creating admin_login table: ${err.message}`);
                debugLogWriteToFile(`Error creating admin_login table: ${err.message}`);
            } else {
                debugLogWriteToFile(`admin_login table checked/created.`);
            }
        });

    }
});


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

// 2. Setup Page, make sure to serve the correct version based on device type
app.get('/setup', (req, res) => {
    // Check device type again
    const userAgent = req.headers['user-agent'];
    const isMobile = /mobile/i.test(userAgent);

    if (isMobile) {
        // Serve the Framework7 version
        return res.sendFile(path.join(__dirname, 'setup/assets/html/mobile/setup.html'));
    } else {
        // Serve the Bulma version
        return res.sendFile(path.join(__dirname, 'setup/assets/html/desktop/setup.html'));
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




// Assortments of API calls
// 

app.post('/api/benchmark/sequential-write', (req, res) => {
    const insert = 'INSERT INTO benchmark_test (col_text1, col_text2, col_int1) VALUES (?,?,?)';
    db.run(insert, ["seq_write", `random_text_${Math.random()}`, Math.floor(Math.random() * 1000)], function(err) {
        if (err) {
            res.status(500).json({ "error": err.message });
            return console.error(err.message);
        }
        res.json({ message: "success", id: this.lastID });
    });
});

app.post('/api/benchmark/bulk-write', (req, res) => {
    const records = req.body.records;
    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: "Invalid payload. 'records' array not found." });
    }

    const insert = db.prepare('INSERT INTO benchmark_test (col_text1, col_text2, col_int1) VALUES (?,?,?)');
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        records.forEach(record => {
            insert.run(record.col_text1, record.col_text2, record.col_int1);
        });
        db.run("COMMIT", (err) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return console.error(err.message);
            }
            res.json({ message: "success", count: records.length });
        });
    });
    insert.finalize();
});





app.post('/api/benchmark/cleanup', (req, res) => {
    db.run('DELETE FROM benchmark_test', function(err) {
        if (err) {
            res.status(500).json({ "error": err.message });
            return console.error(err.message);
        }
        // Reset autoincrement counter
        db.run("DELETE FROM sqlite_sequence WHERE name='benchmark_test'", (err) => {
            debugLogWriteToFile(`Cleanup complete for benchmark_test. ${this.changes} rows deleted.`);
            res.json({ message: "success", deleted_rows: this.changes });
        });
    });
});

app.get('/api/benchmark/read-all', (req, res) => {
    db.all("SELECT id FROM benchmark_test", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
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