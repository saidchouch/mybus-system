/*************************************************
 SMART BUS PROFESSIONAL NOTIFICATION SYSTEM
*************************************************/

function createNotificationContainer() {

    if (document.getElementById("notificationContainer")) return;

    const container = document.createElement("div");
    container.id = "notificationContainer";
    container.className = "notification-container";
    document.body.appendChild(container);
}

function showNotification(message, type = "info") {

    createNotificationContainer();

    const container = document.getElementById("notificationContainer");

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerText = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("fade-out");
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}
