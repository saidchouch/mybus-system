/****************************************************
 * DRIVER APPLICATION – FULL PROFESSIONAL VERSION
 ****************************************************/

let map;
let driverMarker;
let paused = false;
let currentRoute = null;
let routePolyline = null;
let tripHistory = JSON.parse(localStorage.getItem("tripHistory")) || [];
let driverSession = null;
/* ============================
   INITIALIZATION
============================ */

document.addEventListener("DOMContentLoaded", () => {

  const sessionData = localStorage.getItem("driverSession");

  if (!sessionData) {
      window.location.href = "driver-login.html";
      return;
  }

  driverSession = JSON.parse(sessionData);

  initMap();
  loadSchedule();
  loadHistory();
  simulateIncomingAssignment();
});


/* ============================
   MAP + GPS TRACKING
============================ */
function initMap() {

  map = L.map("map").setView([33.88, -5.55], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);

  if (navigator.geolocation) {

      navigator.geolocation.watchPosition(
    position => {

      if (paused) return;

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!driverMarker) {
        driverMarker = L.marker([lat, lng]).addTo(map)
          .bindPopup("Bus Serial: BUS-1001");
      } else {
        driverMarker.setLatLng([lat, lng]);
      }

      map.setView([lat, lng]);
      document.getElementById("driverStatus").innerText = "Online";
    },
    error => {
      console.warn("GPS permission denied");
      document.getElementById("driverStatus").innerText = "GPS Off";
    }
    );
  }
}

/* ============================
   ROUTE ASSIGNMENT
============================ */
function simulateIncomingAssignment() {

  setTimeout(() => {

    currentRoute = {
      line: "Line 5",
      start: "Station A",
      end: "University",
      startCoords: [-5.55, 33.89],
      endCoords: [-5.54, 33.88]
    };

    document.getElementById("routeInfo").innerText =
      `${currentRoute.line} – ${currentRoute.start} → ${currentRoute.end}`;

    showNotification("New Route Assigned!","info");

    drawNavigationRoute();

  }, 4000);
}

/* ============================
   DRAW NAVIGATION ROUTE
============================ */
function drawNavigationRoute() {

  if (!currentRoute) return;

  const url =
    `https://router.project-osrm.org/route/v1/driving/${currentRoute.startCoords[0]},${currentRoute.startCoords[1]};${currentRoute.endCoords[0]},${currentRoute.endCoords[1]}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {

      if (!data.routes || !data.routes.length) {
        console.error("Route not found");
        return;
      }

      const coords = data.routes[0].geometry.coordinates;
      const latLngs = coords.map(c => [c[1], c[0]]);

      if (routePolyline) map.removeLayer(routePolyline);

      routePolyline = L.polyline(latLngs, {
        color: "green",
        weight: 6
      }).addTo(map);
    })
    .catch(err => {
      console.error("OSRM error:", err);
    });
}

function acceptRoute() {

    logSystemAction(
        "ROUTE",
        "Route Accepted",
        "Driver accepted assigned route",
        "Driver",
        "INFO"
    );

    showNotification("Route accepted","success");
}

function completeRoute() {

    logSystemAction(
        "ROUTE",
        "Route Completed",
        "Driver completed route",
        "Driver",
        "INFO"
    );

    showNotification("Route completed","success");
}

function validateBoarding() {

    logSystemAction(
        "VALIDATION",
        "Passenger Boarding",
        "Driver validated boarding",
        "Driver",
        "INFO"
    );

    showNotification("Boarding validated","info");
}

function validateExit() {

    logSystemAction(
        "VALIDATION",
        "Passenger Exit",
        "Driver validated exit",
        "Driver",
        "INFO"
    );

    showNotification("Exit validated","info");
}

function reportIncident(type) {

    logSystemAction(
        "INCIDENT",
        type,
        "Driver reported: " + type,
        "Driver",
        "CRITICAL"
    );

    showNotification("Incident reported","warning");
}




/* ============================
   MESSAGING
============================ */
function sendMessage() {

  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "driver");

  input.value = "";

  simulateControlResponse(text);
}

function addMessage(text, sender) {

  const chat = document.getElementById("chatBox");

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");

  if (sender === "driver") {
    msgDiv.classList.add("driver-msg");
  } else {
    msgDiv.classList.add("control-msg");
  }

  msgDiv.innerText = text;

  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
}

/* Simulated Control Center Response */
function simulateControlResponse(driverText) {

  setTimeout(() => {

    let response = "Message received.";

    if (driverText.toLowerCase().includes("incident")) {
      response = "Control Center: Please provide more details about the incident.";
    }
    else if (driverText.toLowerCase().includes("delay")) {
      response = "Control Center: Delay acknowledged. Continue safely.";
    }
    else if (driverText.toLowerCase().includes("route")) {
      response = "Control Center: Route confirmed. Continue as assigned.";
    }
    else {
      response = "Control Center: Thank you for the update.";
    }

    addMessage(response, "control");

  }, 1500);
}

/* ============================
   SCHEDULE
============================ */
function loadSchedule() {

  const schedule = [
    "08:00 – Line 3",
    "11:00 – Line 5",
    "15:00 – Line 2"
  ];

  const list = document.getElementById("scheduleList");

  schedule.forEach(item => {
    list.innerHTML += `<li>${item}</li>`;
  });
}

/* ============================
   HISTORY
============================ */
function loadHistory() {

  const list = document.getElementById("historyList");
  list.innerHTML = "";

  tripHistory.forEach(item => {
    list.innerHTML += `<li>${item.line} – ${item.date}</li>`;
  });
}

/* ============================
   PAUSE & END SERVICE
============================ */
function togglePause() {

  paused = !paused;
  showNotification(paused ? "Service Paused" : "Service Resumed","warning");
}

function endService() {

  document.getElementById("driverStatus").innerText = "Offline";
  showNotification("Service Ended","info");
}
