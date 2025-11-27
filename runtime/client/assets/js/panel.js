document.addEventListener('DOMContentLoaded', async () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const teacherDashboard = document.getElementById('teacher-dashboard');
    const otherStaffDashboard = document.getElementById('other-staff-dashboard');

    try {
        const response = await fetch('/api/client/me');
        if (!response.ok) {
            // If session is invalid, the server will respond with 401, redirect to login
            if (response.status === 401) window.location.href = '/login';
            throw new Error('Failed to fetch staff information.');
        }
        const staff = await response.json();

        if (!staff.staff_id) {
            // Handle case where staff member is not found in DB for some reason
            welcomeMessage.textContent = 'Welcome! However, your profile could not be loaded.';
            return;
        }

        // Update welcome message
        welcomeMessage.textContent = `Welcome, ${staff.name}!`;

        // Show the correct dashboard based on staff type
        if (staff.staff_type === 'teacher') {
            teacherDashboard.classList.remove('is-hidden');
            populateTeacherDashboard(staff);
            // "My Class" link is visible by default, so no action needed.
        } else {
            otherStaffDashboard.classList.remove('is-hidden');
            // You can populate the 'other-staff-dashboard' here if needed

            // Hide the "My Class" link for non-teachers
            const myClassLink = document.getElementById('my-class-link');
            if (myClassLink) myClassLink.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        welcomeMessage.textContent = 'Could not load dashboard data.';
    }
});

function populateTeacherDashboard(staff) {
    document.getElementById('teacher-name').textContent = staff.name;
    document.getElementById('teacher-email').textContent = staff.email_address || 'No email provided';
    
    const profileImg = document.getElementById('teacher-profile-img');
    if (staff.profile_image_path) {
        profileImg.src = staff.profile_image_path;
    }

    const advisoryClass = document.getElementById('advisory-class-name');
    advisoryClass.textContent = staff.adviser_unit || 'Not Assigned';

    // The student count will require another API call, for now it remains a mockup.
}

// --- QR Code Scanner Logic ---
const startScanBtn = document.getElementById('start-scan-btn');
const stopScanBtn = document.getElementById('stop-scan-btn');
const qrReaderPlaceholder = document.getElementById('qr-reader-placeholder');
const scanResultContainer = document.getElementById('qr-scan-result');

// Create a single instance of the scanner
const html5QrCode = new Html5Qrcode("qr-reader");

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // Handle the successful scan here
    scanResultContainer.innerHTML = `
        <div class="notification is-success">
            <strong>Scan successful!</strong><br>
            Decoded Text: ${decodedText}
        </div>
    `;

    // Stop scanning after a successful scan
    stopScanning();
};

const config = { fps: 10, qrbox: { width: 250, height: 250 } };

function startScanning() {
    qrReaderPlaceholder.classList.add('is-hidden');
    startScanBtn.classList.add('is-hidden');
    stopScanBtn.classList.remove('is-hidden');
    scanResultContainer.innerHTML = ''; // Clear previous results

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error("Unable to start scanning.", err);
            scanResultContainer.innerHTML = `<div class="notification is-danger">Error: Could not start camera. ${err}</div>`;
            stopScanning(); // Reset UI if camera fails
        });
}

function stopScanning() {
    html5QrCode.stop().then(() => {
        qrReaderPlaceholder.classList.remove('is-hidden');
        startScanBtn.classList.remove('is-hidden');
        stopScanBtn.classList.add('is-hidden');
    }).catch(err => {
        console.error("Failed to stop scanning.", err);
    });
}

startScanBtn.addEventListener('click', startScanning);
stopScanBtn.addEventListener('click', stopScanning);
