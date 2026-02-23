/*************************************************
 SMART BUS LOGGING SYSTEM
*************************************************/

function logSystemAction(type, title, description, actor, level = "INFO") {

    const db = getDB();

    const log = {
        id: Date.now(),
        type,
        title,
        description,
        actor,
        level,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };

    db.logs.push(log);
    saveDB(db);
}
