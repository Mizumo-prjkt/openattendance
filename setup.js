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
const mkdirp = require('mkdirp');

// Create a directory for logo uploads if it doesn't exist
const logoUploadDir = path.join(__dirname, 'setup/assets/images/logos');
if (!fs.existsSync(logoUploadDir)) {
    fs.mkdirSync(logoUploadDir, { recursive: true });
}

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
    const logFileName = `debug-openattendance-log-setup-${__dateToday}_${__timeToday}.log`;
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
const dbDir = path.dirname(dbPath);

// Ensure the database directory exists before we do anything else.
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`Error opening database ${dbPath}: ${err.message}`);
        debugLogWriteToFile(`Error opening database ${dbPath}: ${err.message}`);
        return; // Stop if we can't open the DB
    }

    if (!dbExists) {
        console.log('Database not found. Creating new database from schema...');
        debugLogWriteToFile('Database not found. Creating new database from schema...');
        const schemaPath = path.join(__dirname, 'database_schem.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schemaSql, (execErr) => {
            if (execErr) {
                console.error(`Error executing schema script: ${execErr.message}`);
                debugLogWriteToFile(`Error executing schema script: ${execErr.message}`);
            } else {
                console.log('Database created and initialized successfully.');
                debugLogWriteToFile('Database created and initialized successfully from database_schem.sql.');
            }
        });
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);
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
        // return res.sendFile(path.join(__dirname, 'setup/assets/html/mobile/setup.html'));
        // For now, redirect mobile users to desktop setup until framework7's issue is fixed
        return res.sendFile(path.join(__dirname, 'setup/assets/html/desktop/setup.html'));
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

app.post('/api/setup/create-admin', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        debugLogWriteToFile('Admin creation failed: Username or password not provided.');
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Check if an admin account already exists to prevent creating more than one during setup.
    db.get('SELECT COUNT(*) as count FROM admin_login', (err, row) => {
        if (err) {
            debugLogWriteToFile(`Error checking for existing admin: ${err.message}`);
            return res.status(500).json({ error: 'Database error while checking for existing admin.' });
        }

        if (row.count > 0) {
            debugLogWriteToFile('Admin creation blocked: An admin account already exists.');
            return res.status(409).json({ error: 'An admin account already exists.' });
        }

        // Hash the password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                debugLogWriteToFile(`Bcrypt error: ${hashErr.message}`);
                return res.status(500).json({ error: 'Failed to hash password.' });
            }

            const insert = 'INSERT INTO admin_login (username, password) VALUES (?, ?)';
            db.run(insert, [username, hashedPassword], function(dbErr) {
                if (dbErr) {
                    debugLogWriteToFile(`DB Error on admin creation: ${dbErr.message}`);
                    return res.status(500).json({ error: dbErr.message });
                }
                debugLogWriteToFile(`Admin account created successfully with ID: ${this.lastID}`);
                res.json({ message: 'Admin account created successfully.', id: this.lastID });
            });
        });
    });
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

app.post('/api/setup/validate-admin', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        debugLogWriteToFile('Admin validation failed: Username or password not provided.');
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const query = 'SELECT * FROM admin_login WHERE username = ?';
    db.get(query, [username], (err, admin) => {
        if (err) {
            debugLogWriteToFile(`DB Error on admin validation: ${err.message}`);
            return res.status(500).json({ error: 'Database error during validation.' });
        }

        if (!admin) {
            debugLogWriteToFile(`Admin validation failed: User '${username}' not found.`);
            return res.status(404).json({ error: 'Admin user not found.' });
        }

        bcrypt.compare(password, admin.password, (compareErr, isMatch) => {
            if (compareErr) {
                debugLogWriteToFile(`Bcrypt compare error: ${compareErr.message}`);
                return res.status(500).json({ error: 'Error during password comparison.' });
            }

            if (isMatch) {
                res.json({ success: true, message: 'Admin credentials are valid.' });
            } else {
                res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }
        });
    });
});

// Multer configuration for logo uploads
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, logoUploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: logoStorage,
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('logo_file'); // 'logo_file' is the name of the input field in the form

app.post('/api/setup/configure', upload, (req, res) => {
    // By placing `upload` here, multer has already processed the request.
    // req.body is populated with text fields, and req.file has the file.

    const { school_name, school_type, address, organization_hotline, country_code } = req.body;
    const logo_directory = req.file ? `/assets/images/logos/${req.file.filename}` : null;

    if (!school_name || !country_code) {
        debugLogWriteToFile('Configuration save failed: School name or country code not provided.');
        return res.status(400).json({ error: 'School Name and Country Code are required.' });
    }

    // Check if a configuration already exists.
    db.get('SELECT COUNT(*) as count FROM configurations', (dbErr, row) => {
        if (dbErr) {
            debugLogWriteToFile(`Error checking for existing configuration: ${dbErr.message}`);
            return res.status(500).json({ error: 'Database error while checking for existing configuration.' });
        }

        if (row.count > 0) {
            debugLogWriteToFile('Configuration blocked: A configuration entry already exists.');
            return res.status(409).json({ error: 'A configuration entry already exists. You cannot create another one.' });
        }

        const insert = `
            INSERT INTO configurations (
                school_name, school_type, address, logo_directory, organization_hotline, country_code
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [school_name, school_type || null, address || null, logo_directory, organization_hotline || null, country_code];

        db.run(insert, params, function(insertErr) {
            if (insertErr) {
                debugLogWriteToFile(`DB Error on configuration creation: ${insertErr.message}`);
                return res.status(500).json({ error: insertErr.message });
            }
            debugLogWriteToFile(`Configuration saved successfully with ID: ${this.lastID}`);
            res.json({ message: 'Configuration saved successfully.', id: this.lastID });
        });
    });
});

app.get('/api/setup/verify-schema', async (req, res) => {
    debugLogWriteToFile('Starting database schema creation and verification...');
    try {
        // 1. Read the entire schema file
        const schemaPath = path.join(__dirname, 'database_schem.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // 2. Execute the entire script at once. 
        // `CREATE TABLE IF NOT EXISTS` is idempotent, so this is safe to run even if tables exist.
        await new Promise((resolve, reject) => {
            db.exec(schemaSql, (err) => {
                if (err) {
                    debugLogWriteToFile(`Schema execution failed: ${err.message}`);
                    return reject(err);
                }
                debugLogWriteToFile('Schema script executed successfully.');
                resolve();
            });
        });

        // 3. Verify that all tables now exist
        const expectedTableNames = (schemaSql.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/gi) || [])
            .map(s => s.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i)[1]);

        const getTables = () => new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
                if (err) return reject(err);
                resolve(tables.map(t => t.name));
            });
        });

        const actualTables = await getTables();
        
        const actions = expectedTableNames.map(table => ({
            table: table,
            status: actualTables.includes(table) ? 'exists' : 'missing'
        }));

        const allTablesExist = actions.every(a => a.status === 'exists');

        debugLogWriteToFile('Schema verification process complete.');
        res.json({ success: allTablesExist, actions: actions });

    } catch (error) {
        debugLogWriteToFile(`Schema verification failed: ${error.message}`);
        res.status(500).json({ error: 'Failed to verify database schema.', details: error.message });
    }
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