// DB Test JS
// This script only responds at JSON Format to be
// interpreted by the setup-ui.js
// Source from: MizProject/Mitra

/**
 * Runs a database benchmark test for 10 seconds on each operation.
 * @returns {Promise<object>} A promise that resolves with the benchmark results.
 */
async function runDBBenchmark() {
    console.log("Starting DB Benchmark...");

    const DURATION = 10000; // 10 seconds
    const results = {
        sequentialWrites: 0,
        sequentialWriteTimes: [],
        bulkWrites: 0,
        bulkWriteTimes: [],
        bulkSize: 100,
        sequentialReadTimes: [],
        allIdsLength: 0,
        sequentialReads: 0,
        totalTime: 0
    };

    const overallStartTime = performance.now();

    // --- 1. Sequential Write Test ---
    console.log("Starting sequential write test...");
    let seqWriteEndTime = performance.now() + DURATION;
    while (performance.now() < seqWriteEndTime) {
        let startTime = performance.now();
        try {
            const response = await fetch('/api/benchmark/sequential-write', { method: 'POST' });
            if (response.ok) {
                results.sequentialWrites++;
                let endTime = performance.now();
                let timeTaken = endTime - startTime;
                results.sequentialWriteTimes.push(timeTaken);
            } else {
                console.error('Sequential write failed:', await response.text());
                break; // Stop test on error
            }
        } catch (error) {
            console.error('Error during sequential write test:', error);
            break;
        }
    }
    console.log(`Sequential write test finished: ${results.sequentialWrites} writes.`);

    // --- 2. Bulk Write Test ---
    console.log("Starting bulk write test...");
    let bulkWriteEndTime = performance.now() + DURATION;
    const bulkSize = 100; // Insert 100 records per bulk request
    while (performance.now() < bulkWriteEndTime) {
        let startTime = performance.now();
        try {
            const records = [];
            for (let i = 0; i < bulkSize; i++) {
                records.push({
                    col_text1: "bulk_write",
                    col_text2: `random_text_${Math.random()}`,
                    col_int1: Math.floor(Math.random() * 1000)
                });
            }
            const response = await fetch('/api/benchmark/bulk-write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records })
            });
            if (response.ok) {
                results.bulkWrites += bulkSize;
                let endTime = performance.now();
                let timeTaken = endTime - startTime;
                results.bulkWriteTimes.push(timeTaken);
            } else {
                console.error('Bulk write failed:', await response.text());
                break; // Stop test on error
            }
        } catch (error) {
            console.error('Error during bulk write test:', error);
            break;
        }
    }
    console.log(`Bulk write test finished: ${results.bulkWrites} writes.`);

    // --- 3. Sequential Read Test ---
    console.log("Starting sequential read test...");
    let allIds = [];
    let startTime = performance.now();
    try {
        const response = await fetch('/api/benchmark/read-all');
        if (response.ok) {
            const { data } = await response.json();
            allIds = data.map(row => row.id);
            results.allIdsLength = allIds.length;
            let endTime = performance.now();
            let timeTaken = endTime - startTime;
            results.sequentialReadTimes.push(timeTaken);
            results.sequentialReads = allIds.length;
        } else {
            console.error('Failed to fetch IDs for read test:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching IDs for read test:', error);
    }
    console.log(`Read test finished: ${results.sequentialReads} reads.`);


    // --- 4. Cleanup ---
    console.log("Cleaning up benchmark table...");
    try {
        const response = await fetch('/api/benchmark/cleanup', { method: 'POST' });
        if (response.ok) {
            console.log("Cleanup successful.");
        } else {
            console.error('Cleanup failed:', await response.text());
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }

    const overallEndTime = performance.now();
    results.totalTime = (overallEndTime - overallStartTime) / 1000; // in seconds

    console.log("Benchmark finished. Results:", results);

    return results;
}