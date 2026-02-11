/*************************************************
 SMART BUS ADMIN DASHBOARD – FULL REBUILD
*************************************************/

const BUS_COUNT = 10;
let map;
let buses = [];

/* ================================
   INITIALIZATION
================================ */
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  createFleet();
  simulateMovement();
  updateKPIs();
  loadComplaints();
  updateFleetStatus();
});

/* ================================
   MAP INIT
================================ */
function initMap() {
  map = L.map("map").setView([33.88, -5.55], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);
}

/* ================================
   CREATE FLEET
================================ */
function createFleet() {
  for (let i = 0; i < BUS_COUNT; i++) {

    const lat = 33.88 + (Math.random() - 0.5) * 0.05;
    const lng = -5.55 + (Math.random() - 0.5) * 0.05;

    const route = generateRoute(lat, lng);
    const color = getColor(i);

    const polyline = L.polyline(route, {
      color: color,
      weight: 6,
      opacity: 0.9
    }).addTo(map);

    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "bus-icon",
        html: `🚌<div style="font-size:10px;">L${i+1}</div>`,
        iconSize: [40, 40]
      })
    })
    .addTo(map)
    .bindPopup(`
      <strong>Bus Serial:</strong> BUS-${1000+i}<br>
      <strong>Line:</strong> L${i+1}<br>
      <strong>Status:</strong> On Time
    `);

    buses.push({
      marker,
      route,
      polyline,
      index: 0
    });
  }
}

/* ================================
   ROUTE GENERATION
================================ */
function generateRoute(lat, lng) {
  let path = [];
  for (let i = 0; i < 60; i++) {
    lat += (Math.random() - 0.5) * 0.002;
    lng += (Math.random() - 0.5) * 0.002;
    path.push([lat, lng]);
  }
  return path;
}

/* ================================
   BUS MOVEMENT
================================ */
function simulateMovement() {
  setInterval(() => {
    buses.forEach(bus => {
      bus.index++;

      if (bus.index >= bus.route.length) {
        bus.route = generateRoute(
          bus.route[bus.route.length-1][0],
          bus.route[bus.route.length-1][1]
        );
        bus.polyline.setLatLngs(bus.route);
        bus.index = 0;
      }

      bus.marker.setLatLng(bus.route[bus.index]);
    });
  }, 2000);
}

/* ================================
   KPI SIMULATION
================================ */
function updateKPIs() {
  setInterval(() => {
    document.getElementById("passengerCount").innerText =
      1000 + Math.floor(Math.random() * 500);

    document.getElementById("revenue").innerText =
      (15000 + Math.floor(Math.random() * 5000)) + " MAD";

    document.getElementById("punctuality").innerText =
      (85 + Math.floor(Math.random() * 10)) + "%";
  }, 5000);
}

/* ================================
   FLEET STATUS
================================ */
function updateFleetStatus() {
  const panel = document.getElementById("fleetStatus");

  setInterval(() => {
    panel.innerHTML = "";

    buses.forEach((bus, i) => {
      const status = Math.random() > 0.2 ? "On Time" : "Delayed";

      panel.innerHTML += `
        <div>
          Bus L${i+1} – 
          <strong style="color:${status==="On Time"?"green":"red"}">
            ${status}
          </strong>
        </div>
      `;
    });
  }, 5000);
}

/* ================================
   COMPLAINTS
================================ */
function loadComplaints() {
  const complaints = [
    "Bus L3 delayed",
    "Ticket payment issue",
    "Driver behavior complaint"
  ];

  const list = document.getElementById("complaintsList");
  complaints.forEach(c => {
    list.innerHTML += `<li>${c}</li>`;
  });
}

/* ================================
   MANAGEMENT ACTIONS
================================ */
function assignDriver() {
  alert("Driver Assigned Successfully");
}

function scheduleMaintenance() {
  alert("Maintenance Scheduled");
}

/* ================================
   EXPORT
================================ */
function exportCSV() {
  const csv = "Fleet,Passengers,Revenue\n10,1200,15000";
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.csv";
  link.click();
}

function exportPDF() {
  alert("PDF Report Generated");
}

/* ================================
   COMMUNICATION
================================ */
function sendBroadcast() {
  const msg = document.getElementById("broadcastInput").value;
  alert("Broadcast sent to all drivers: " + msg);
}

/* ================================
   COLOR HELPER
================================ */
function getColor(i) {
  const colors = [
    "#e74c3c","#3498db","#2ecc71","#f39c12",
    "#9b59b6","#1abc9c","#e84393","#fdcb6e",
    "#6c5ce7","#00b894"
  ];
  return colors[i % colors.length];
}
