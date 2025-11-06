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

    if (userAgent.indexOf("Firefox") > -1 ) {
        browserName = "Firefox";

    }
})