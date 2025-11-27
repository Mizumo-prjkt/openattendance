document.addEventListener('DOMContentLoaded', async () => {
    const osInfoSpan = document.getElementById('os-info');
    const nodeVersionSpan = document.getElementById('node-version');
    const cpuInfoSpan = document.getElementById('cpu-info');
    const memoryInfoSpan = document.getElementById('memory-info');
    const storageInfoSpan = document.getElementById('storage-info');

    try {
        const response = await fetch('/api/admin/system-info');
        if (!response.ok) {
            throw new Error('Failed to fetch system information.');
        }
        const info = await response.json();

        osInfoSpan.textContent = info.os;
        nodeVersionSpan.textContent = info.nodeVersion;
        cpuInfoSpan.textContent = info.cpu;
        memoryInfoSpan.textContent = `${info.memory.free} free of ${info.memory.total}`;
        storageInfoSpan.textContent = `${info.storage.free} free of ${info.storage.total}`;

    } catch (error) {
        console.error('Error loading system info:', error);
        const errorMessage = 'Could not load data';
        [osInfoSpan, nodeVersionSpan, cpuInfoSpan, memoryInfoSpan, storageInfoSpan].forEach(span => {
            if (span) span.textContent = errorMessage;
        });
    }
});