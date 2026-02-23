/*************************************************
 SMART BUS CENTRAL DATABASE (Frontend Only)
*************************************************/

const STORAGE_KEY = "smartBusDB";

function getDB() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        logs: [],
        tickets: [],
        complaints: [],
        trips: [],
        fleet: [
            { id: "BUS-1001", line: "Line 1", status: "ON_TIME", incidents: 0 },
            { id: "BUS-1002", line: "Line 2", status: "ON_TIME", incidents: 0 },
            { id: "BUS-1003", line: "Line 3", status: "ON_TIME", incidents: 0 },
            { id: "BUS-1004", line: "Line 4", status: "ON_TIME", incidents: 0 },
            { id: "BUS-1005", line: "Line 5", status: "ON_TIME", incidents: 0 }
        ]
    };
}


function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function resetSystem() {
    localStorage.removeItem(STORAGE_KEY);
}
