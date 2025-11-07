// Detect Browser Script for OpenAttendance
// License:

// This script evaluates the user's browser
window.addEventListener('DOMContentLoaded', (event) => {
    const userAgent = navigator.userAgent;
    let browserName = null;
    let deviceType = null;
    
    // Function to determine device type
    function getDeviceType() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    }

    if (getDeviceType()) {
        deviceType = "mobile";
    } else {
        deviceType = "desktop";
    }

    // Function to determine browser name
    function getBrowser() {
        if (userAgent.indexOf("Firefox") > -1 ) {
            browserName = "Firefox";
        } else if (userAgent.indexOf("Chrome") > -1 ) {
            browserName = "Chrome";
        } else if (userAgent.indexOf("Edge") > -1 ) {
            browserName = "Edge";
        } else {
            browserName = "unknown";
        }
    }
    // Trigger browser detection
    getBrowser();

    // Store the results in localStorage for later use
    localStorage.setItem('browserName', browserName);
    localStorage.setItem('deviceType', deviceType);

    // Temporary: Set a browser error modal for test detection
    // Browser support check
    if (browserName === "unknown") {
        alert("Unsupported browser detected. Please use Chrome, Firefox, or Edge for the best experience.");
    } else if (browserName === "Firefox" || browserName === "Chrome" || browserName === "Edge") {
        console.log(`Detected browser: ${browserName} on a ${deviceType} device.`);
        alert(`Detected browser: ${browserName} on a ${deviceType} device.`);
    }
})