/*************************************************
 SMART BUS STATISTICS ENGINE
*************************************************/

function calculateStats() {

    const db = getDB();

    const stats = {
        totalLogs: db.logs.length,
        incidents: 0,
        payments: 0,
        complaints: 0,
        critical: 0,
        revenue: 0
    };

    db.logs.forEach(log => {

        if (log.type === "INCIDENT") stats.incidents++;
        if (log.type === "PAYMENT") stats.payments++;
        if (log.type === "RECLAMATION") stats.complaints++;
        if (log.level === "CRITICAL") stats.critical++;
    });

    stats.revenue = stats.payments * 5; // 5 MAD per ticket

    return stats;
}
