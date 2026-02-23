/*************************************************
 FLEET SERVICE – Operational Status Engine
*************************************************/

function getBus(busId) {
    const db = getDB();
    return db.fleet.find(bus => bus.id === busId);
}

function updateBusStatus(busId, newStatus) {

    const db = getDB();
    const bus = db.fleet.find(b => b.id === busId);

    if (!bus) return;

    bus.status = newStatus;
    saveDB(db);
}

function registerIncident(busId) {

    const db = getDB();
    const bus = db.fleet.find(b => b.id === busId);
    if (!bus) return;

    bus.incidents++;

    if (bus.incidents === 1) {
        bus.status = "INCIDENT";
    }

    if (bus.incidents >= 2) {
        bus.status = "DELAYED";
    }

    if (bus.incidents >= 3) {
        bus.status = "MAINTENANCE";
    }

    saveDB(db);
}
