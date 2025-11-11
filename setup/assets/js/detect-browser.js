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
    // if (browserName === "unknown") {
    //     alert("Unsupported browser detected. Please use Chrome, Firefox, or Edge for the best experience.");
    // } else if (browserName === "Firefox" || browserName === "Chrome" || browserName === "Edge") {
    //     console.log(`Detected browser: ${browserName} on a ${deviceType} device.`);
    //     alert(`Detected browser: ${browserName} on a ${deviceType} device.`);
    // }

    // Dynamic page update
    const statusDetectionHeader = document.getElementById('status-detection-header');
    const statusDetectionBody = document.getElementById('status-detection-body');
    const extraMessage = document.getElementById('additional-texts');
    const dynamicBtn = document.getElementById('button-dynamic');

    if (browserName === "unknown") {
        document.title = "Unsupported Browser Detected";
        statusDetectionHeader.textContent = "Unsupported Browser Detected";
        statusDetectionBody.textContent = "Your browser is not supported. Please use Chrome, Firefox, or Edge for the best experience.";
        extraMessage.textContent = "Detected Browser: " + userAgent;
        dynamicBtn.textContent = "Learn More";
        dynamicBtn.href = "https://9meters.com/technology/networking/unsupported-browser-error-troubleshooting";
        dynamicBtn.classList.add('is-danger');
    } else if (browserName === "Firefox" || browserName === "Chrome" || browserName === "Edge") {
        document.title = `Supported Browser Detected, ${browserName}`;
        statusDetectionHeader.textContent = "Supported Browser Detected";
        statusDetectionBody.textContent = `Your browser (${browserName}) is supported. You can proceed with the setup.`;
        extraMessage.textContent = "Detected Device Type: " + deviceType;
        dynamicBtn.textContent = "Proceed to Setup";
        dynamicBtn.href = "/setup";
        dynamicBtn.style.display = "inline-block";
        dynamicBtn.classList.add('is-success');
    }
})