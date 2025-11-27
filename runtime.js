// OpenAttendance JavaScript code for Setup
// License: 
// This is a setup file for the project
// Note that the page root is on setup directory, and the port should be different
// Than the runtime to avoid conflicts and stupidity of the end user

const express = require('express');
const NTP = require('ntp-time').Client;
const path = require('path');
const sequelize = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
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
    debugMode = true; 
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

// Set the SQLite DB
const dbPath = path.join(__dirname, 'database', 'main.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`Error opening database ${dbPath}: ${err.message}`);
        debugLogWriteToFile(`Error opening database ${dbPath}: ${err.message}`);
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
    secret: crypto.randomBytes(64).toString('hex'), // A strong, random secret for signing the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: false, // Set to true if you're using HTTPS
        httpOnly: true // Prevents client-side JS from reading the cookie
    }
}));

// Use static links - This should be high up to be checked first
app.use('/node', express.static(path.join(__dirname, 'node_modules')));
app.use('/shared', express.static(path.join(__dirname, 'runtime', 'shared')));
app.use('/admin/assets', express.static(path.join(__dirname, 'runtime', 'admin', 'assets')));
app.use('/client/assets', express.static(path.join(__dirname, 'runtime', 'client', 'assets')));
app.use('/client', express.static(path.join(__dirname, 'runtime', 'client'))); // Serve client-side JS



// Server start, notify on which port
app.listen(PORT, () => {
    brkln('el');
    console.log(`OpenAttendance Runtime is running on http://localhost:${PORT}`);
    brkln('nl');
    console.log(`OpenAttendance Runtime Admin is running on http://localhost:${PORT}/admin`);
    brkln('el');
});

// Serve pages

app.get('/', (req, res) => {
    // Assuming the user is visiting the client first lol
    // Maybe i overengineered this one lol
    if (argenv.includes('--debug')) {
        const userAgent =  req.headers['user-agent'];
        const isMobile = /mobile/i.test(userAgent);
        let browser;
        function getDeviceType() {
            return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
        }
        function idBrowser() {
            if (userAgent.indexOf("Firefox") > -1) {
                browser = "Firefox"
            } else if (userAgent.indexOf("Chrome") > -1) {
                browser = "Chrome"
            } else {
                browser = "Native or unknown"
            }
        }
        if (getDeviceType()) {
            debugLogWriteToFile(`getDeviceType() called, raw data report: ${getDeviceType()}`);
            device = "mobile"
            debugLogWriteToFile(`getdeviceType() passed to device var: ${device}`)
        } else {
            debugLogWriteToFile(`getDeviceType() called, raw data report: ${getDeviceType()}`);
            device = "desktop"
            debugLogWriteToFile(`getdeviceType() passed to device var: ${device}`);
        }
        idBrowser();
        debugLogWriteToFile(`Some user entered on / page.`);
        debugLogWriteToFile(`Visitor identified as: ${browser}`)
        debugLogWriteToFile(`Providing the index.html at runtime/client/index.html by express...`);
        res.sendFile(path.join(__dirname, 'runtime/client/index.html'));
        debugLogWriteToFile(`express sent the page`)
    } else {
        res.sendFile(path.join(__dirname, 'runtime/client/index.html'));
    }
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/login.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.adminId) {
        res.redirect('/admin-login');
    } else {
        res.redirect('/admin-panel');
    }
});

app.get('/admin-panel', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/home.html'));
    } else {
        res.redirect('/admin-login');
    }
})

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/index.html'));
})

app.get('/admin-staff', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/staff.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin/_navbar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/_navbar.html'));
});

app.get('/admin/_sidebar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/_sidebar.html'));
});

// API is here

app.get('/api/admin/accounts', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const sql = 'SELECT admin_id, username, privilege FROM admin_login ORDER BY username ASC';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve accounts." });
        res.json(rows || []);
    });
});

app.get('/api/admin/accounts/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const { id } = req.params;
    const sql = 'SELECT admin_id, username, privilege FROM admin_login WHERE admin_id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!row) return res.status(404).json({ error: "Account not found." });
        res.json(row);
    });
});

app.post('/api/admin/accounts', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { username, password, privilege } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO admin_login (username, password, privilege) VALUES (?, ?, ?)';
        db.run(sql, [username, hashedPassword, privilege || 'admin'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'This username is already taken.' });
                }
                return res.status(500).json({ error: "Database error creating account." });
            }
            res.status(201).json({ message: "Admin account created successfully.", adminId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to process password." });
    }
});

app.put('/api/admin/accounts/:id', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    const { username, password, privilege } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required." });
    }

    let sql, params;
    if (password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql = 'UPDATE admin_login SET username = ?, password = ?, privilege = ? WHERE admin_id = ?';
            params = [username, hashedPassword, privilege, id];
        } catch (error) {
            return res.status(500).json({ error: "Failed to process new password." });
        }
    } else {
        sql = 'UPDATE admin_login SET username = ?, privilege = ? WHERE admin_id = ?';
        params = [username, privilege, id];
    }

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'This username is already taken.' });
            }
            return res.status(500).json({ error: "Database error updating account." });
        }
        res.json({ message: "Admin account updated successfully." });
    });
});

app.delete('/api/admin/accounts/:id', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    if (parseInt(id, 10) === req.session.adminId) {
        return res.status(403).json({ error: "You cannot delete your own account." });
    }

    db.run('DELETE FROM admin_login WHERE admin_id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: "Database error deleting account." });
        if (this.changes === 0) return res.status(404).json({ error: "Account not found." });
        res.json({ message: "Admin account deleted successfully." });
    });
});

app.post('/api/ntp', async (req, res) => {
    debugLogWriteToFile("NTP API called");
    // This config is temporary until we figure out how to pull ntp configuration out from the database...
    // For now, we are pulling PAGASA's NTP server, which is on GMT+8:00PM
    const ntpServer = "ntp.pagasa.dost.gov.ph";
    const client = new NTP(ntpServer, 123, {timeout: 5000});

    try {
        debugLogWriteToFile(`Syncing time with NTP server: ${ntpServer}`);
        // The syncTime() method returns the time object upon successful sync.
        const fetchedTime = await client.syncTime();
        
        // Now, fetchedTime is the actual time object.
        debugLogWriteToFile(`NTP time fetched successfully: ${fetchedTime.time}`);
        
        // Send the fetched time back to the client as JSON
        res.status(200).json({ success: true, time: fetchedTime.time });
    } catch (err) {
        debugLogWriteToFile(`Failed to fetch time from ${ntpServer}. Error: ${err.message}`);
        res.status(500).json({ success: false, error: 'Failed to sync with NTP server.', details: err.message });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        debugLogWriteToFile('Login failed: Username or password not provided.');
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const query = 'SELECT * FROM admin_login WHERE username = ?';
    db.get(query, [username], (err, admin) => {
        if (err) {
            debugLogWriteToFile(`DB Error on login: ${err.message}`);
            return res.status(500).json({ error: 'Database error during login.' });
        }

        if (!admin) {
            debugLogWriteToFile(`Login failed: User '${username}' not found.`);
            return res.status(404).json({ error: 'User not found.' });
        }

        bcrypt.compare(password, admin.password, (compareErr, isMatch) => {
            if (compareErr) {
                debugLogWriteToFile(`Bcrypt compare error: ${compareErr.message}`);
                return res.status(500).json({ error: 'Error during password comparison.' });
            }

            if (isMatch) {
                res.json({ success: true, message: 'Login successful.' });
            } else {
                res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }
        });
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        debugLogWriteToFile('Admin login failed: Username or password not provided.');
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const query = 'SELECT admin_id, username, password FROM admin_login WHERE username = ?';
    db.get(query, [username], (err, admin) => {
        if (err) {
            debugLogWriteToFile(`DB Error on admin login: ${err.message}`);
            return res.status(500).json({ error: 'Database error during login.' });
        }

        if (!admin) {
            debugLogWriteToFile(`Admin login failed for user '${username}': Not found.`);
            return res.status(401).json({ error: 'Invalid credentials.' }); // Use a generic error for security
        }

        bcrypt.compare(password, admin.password, (compareErr, isMatch) => {
            if (compareErr) {
                debugLogWriteToFile(`Bcrypt compare error: ${compareErr.message}`);
                return res.status(500).json({ error: 'Error during password comparison.' });
            }

            if (isMatch) {
                req.session.adminId = admin.admin_id; // Create the session
                debugLogWriteToFile(`Admin '${username}' logged in successfully. Session created.`);
                res.json({ success: true, message: 'Login successful. Redirecting...' });
            } else {
                res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }
        });
    });
});

app.get('/api/admin/auth-status', (req, res) => {
    if (req.session && req.session.adminId) {
        // User has a valid session
        res.status(200).json({ authenticated: true });
    } else {
        // No valid session
        res.status(401).json({ authenticated: false });
    }
});

app.post('/api/admin/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                debugLogWriteToFile('Admin logout failed during session destruction.');
                return res.status(500).json({ error: 'Could not log out.' });
            }
            debugLogWriteToFile('Admin session destroyed successfully.');
            res.clearCookie('connect.sid'); // Clean up the cookie on the client
            return res.json({ message: 'Logout successful.' });
        });
    } else {
        res.json({ message: 'No active session to log out from.' });
    }
});

app.get('/api/admin/dashboard-stats', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const queries = {
        totalStudents: 'SELECT COUNT(id) as count FROM students',
        totalStaff: 'SELECT COUNT(id) as count FROM staff_accounts',
        todaysAttendance: "SELECT COUNT(DISTINCT student_id) as count FROM present WHERE date(time_in, 'localtime') = date('now', 'localtime')",
        todaysAbsences: "SELECT COUNT(DISTINCT student_id) as count FROM absent WHERE date(absent_datetime, 'localtime') = date('now', 'localtime')",
        todaysExcused: "SELECT COUNT(DISTINCT student_id) as count FROM excused WHERE result = 'excused' AND date(request_datetime, 'localtime') = date('now', 'localtime')",
        weeklyTrend: `
            SELECT 
                strftime('%w', time_in, 'localtime') as day_of_week, 
                COUNT(DISTINCT student_id) as count 
            FROM present 
            WHERE date(time_in, 'localtime') >= date('now', '-6 days', 'localtime') 
            GROUP BY day_of_week`,
        monthlyOverview: `
            SELECT 
                strftime('%Y-%W', date, 'localtime') as week,
                SUM(CASE WHEN type = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN type = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN type = 'excused' THEN 1 ELSE 0 END) as excused_count
            FROM (
                SELECT time_in as date, 'present' as type, student_id FROM present
                UNION ALL
                SELECT absent_datetime as date, 'absent' as type, student_id FROM absent
                UNION ALL
                SELECT request_datetime as date, 'excused' as type, student_id FROM excused WHERE result = 'excused'
            )
            WHERE date(date, 'localtime') >= date('now', 'start of month', 'localtime')
            GROUP BY week
            ORDER BY week`
    };

    const promises = Object.entries(queries).map(([key, sql]) => {
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) return reject(err);
                // For single-count queries, simplify the result
                if (key.startsWith('total') || key.startsWith('todays')) {
                    resolve({ [key]: rows[0]?.count || 0 });
                } else {
                    resolve({ [key]: rows });
                }
            });
        });
    });

    Promise.all(promises)
        .then(results => {
            const combinedResults = results.reduce((acc, current) => ({ ...acc, ...current }), {});
            res.json(combinedResults);
        })
        .catch(err => res.status(500).json({ error: "Database error fetching dashboard stats.", details: err.message }));
});

// --- System Logs API ---

// GET /api/admin/logs - Retrieve logs with filtering and pagination
app.get('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { page = 1, limit = 25, level, source } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (level) {
        whereClauses.push('level = ?');
        params.push(level);
    }
    if (source) {
        whereClauses.push('source = ?');
        params.push(source);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM system_logs ${whereSql}`;
    const dataSql = `SELECT * FROM system_logs ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;

    db.get(countSql, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error counting logs.", details: err.message });
        }

        const totalLogs = row.count;
        const totalPages = Math.ceil(totalLogs / limit);

        db.all(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Database error retrieving logs.", details: err.message });
            }
            res.json({
                logs: rows,
                pagination: {
                    currentPage: parseInt(page, 10),
                    totalPages: totalPages,
                    totalLogs: totalLogs,
                    limit: parseInt(limit, 10)
                }
            });
        });
    });
});

// POST /api/admin/logs - Create a new log entry
app.post('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { level = 'INFO', message, source, details } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Log 'message' is required." });
    }

    const sql = 'INSERT INTO system_logs (level, message, source, details) VALUES (?, ?, ?, ?)';
    db.run(sql, [level, message, source, details], function(err) {
        if (err) return res.status(500).json({ error: "Database error creating log.", details: err.message });
        res.status(201).json({ message: "Log entry created successfully.", logId: this.lastID });
    });
});

// DELETE /api/admin/logs - Clear all logs
app.delete('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    db.run('DELETE FROM system_logs', function(err) {
        if (err) return res.status(500).json({ error: "Database error clearing logs.", details: err.message });
        // Also reset the autoincrement counter for a clean slate
        db.run("DELETE FROM sqlite_sequence WHERE name='system_logs'", () => {
            res.json({ message: `All system logs cleared successfully. ${this.changes} logs were deleted.` });
        });
    });
});

// Error relations here at the very bottom
// See MizProject Private Ticket issue: #2
// Forbidden page
app.get('/forbidden', (req, res) => {
    debugLogWriteToFile(`Someone is trying to access the forbidden page...`)
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

// Catch-all for 404 Not Found errors
// This should be the last route handler to catch any unmatched requests.
app.use((req, res, next) => {
    debugLogWriteToFile(`someone is tring to access ${req.originalUrl} /ip: ${req.ip} /ips: ${req.ips} /host: ${req.host}`)
    const error = {
        code: 404,
        title: 'Page Not Found',
        message: `The page you requested at '${req.originalUrl}' could not be found.`
    };
    // Redirect to the forbidden page with 404 error details
    debugLogWriteToFile(`redirect to forbidden with error code embedded in the URL`);
    res.redirect(`/forbidden?code=${error.code}&title=${encodeURIComponent(error.title)}&message=${encodeURIComponent(error.message)}`);
});
