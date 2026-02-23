/*************************************************
 ETA SERVICE – Smart Delay Adjustment
*************************************************/

function calculateAdjustedETA(baseMinutes, busId) {

    const db = getDB();
    const bus = db.fleet.find(b => b.id === busId);

    let delayMinutes = 0;
    let reason = "";

    if (!bus) {
        return { eta: baseMinutes, delay: 0, reason: "" };
    }

    switch (bus.status) {

        case "INCIDENT":
            delayMinutes = 3;
            reason = "Incident reported";
            break;

        case "DELAYED":
            delayMinutes = 5;
            reason = "Multiple incidents";
            break;

        case "MAINTENANCE":
            delayMinutes = 999; // effectively unavailable
            reason = "Bus under maintenance";
            break;

        default:
            delayMinutes = 0;
    }

    // Simulated traffic (small variation)
    const trafficFactor = Math.random() * 2;
    delayMinutes += trafficFactor;

    return {
        eta: baseMinutes + delayMinutes,
        delay: delayMinutes,
        reason
    };
}
