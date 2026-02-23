/****************************************************
 SMART BUS – REAL TRAJECTORY PASSENGER ENGINE
 FINAL STABLE VERSION
****************************************************/

const BUS_SPEED_KMH = 35;
const UPDATE_INTERVAL = 3000;

let map;
let busMarker;
let routePolyline;

let currentIndex = 0;
let routeCoordinates = [];
let fromStopIndex = -1;

let selectedLine;
let selectedFromStop;

let departureTime = null;
let alertTriggered = false;
let alertSound = new Audio("alert.wav");
let fromStopMarker;
let direction = 1; // 1 = forward, -1 = backward
/* ============================
   INITIALIZATION
============================ */
document.addEventListener("DOMContentLoaded", () => {

  selectedLine = localStorage.getItem("selectedLine");
  selectedFromStop = localStorage.getItem("selectedFromStop");

  if (typeof MEKNES_LINES === "undefined") {
    console.error("MEKNES_LINES not loaded. Check script order.");
    return;
  }

  if (!selectedLine) {
    alert("No line selected.");
    return;
  }

  initMap();
  loadRealLine();
  populateStops(); // keep route finder functionality
});


/* ============================
   MAP INIT
============================ */
function initMap() {

  map = L.map("map").setView([33.88, -5.55], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);
}


/* ============================
   LOAD REAL LINE TRAJECTORY
============================ */
function loadRealLine() {

  const lineData = MEKNES_LINES.find(line =>
    line.line_name.includes(selectedLine)
  );

  if (!lineData) {
    console.error("Line not found in meknes_all_bus_lines");
    return;
  }

  const validStops = lineData.stops.filter(stop =>
    stop.latitude && stop.longitude
  );

  if (!validStops.length) {
    console.error("No valid coordinates for this line.");
    return;
  }

  routeCoordinates = validStops.map(stop => [
    stop.latitude,
    stop.longitude
  ]);

  fromStopIndex = validStops.findIndex(stop =>
    stop.stop_name?.trim() === selectedFromStop?.trim()
  );

  if (fromStopIndex === -1) {
    console.warn("Selected FROM stop not found in this line.");
  }

  routePolyline = L.polyline(routeCoordinates, {
    color: "blue",
    weight: 5
  }).addTo(map);

  map.fitBounds(routePolyline.getBounds());
  showFromStopMarker();

  // Hide loader if exists
  const loader = document.getElementById("routeLoader");
  if (loader) loader.style.display = "none";

  placeBusRandomly();
}



function showFromStopMarker() {

  const fromLat = parseFloat(localStorage.getItem("fromLat"));
  const fromLng = parseFloat(localStorage.getItem("fromLng"));

  if (!fromLat || !fromLng) {
    console.warn("FROM stop coordinates not found.");
    return;
  }

fromStopMarker = L.marker([fromLat, fromLng], {
  icon: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  })
}).addTo(map);

  fromStopMarker.bindPopup("Selected Stop");
}
/* ============================
   PLACE BUS RANDOMLY
============================ */
function placeBusRandomly() {

  currentIndex = Math.floor(
    Math.random() * routeCoordinates.length
  );

  busMarker = L.marker(routeCoordinates[currentIndex], {
    icon: L.divIcon({
      className: "bus-wrapper",
      html: `
        <div class="bus-label">${selectedLine}</div>
        <div class="bus-icon">🚌</div>
      `,
      iconSize: [60,60],
      iconAnchor: [30,40]
    })
  }).addTo(map);

  departureTime = new Date();
  displayDepartureTime();

  startSimulation();
}


/* ============================
   START SIMULATION
============================ */
function startSimulation() {

  updateCalculations();

  setInterval(() => {

    moveBus();
    updateCalculations();
    /*simulateBreakdown();*/

  }, UPDATE_INTERVAL);
}


/* ============================
   MOVE BUS
============================ */
function moveBus() {

  currentIndex += direction;

  // If reached end → reverse
  if (currentIndex >= routeCoordinates.length - 1) {
    direction = -1;
  }

  // If reached start → reverse
  if (currentIndex <= 0) {
    direction = 1;
  }

  busMarker.setLatLng(routeCoordinates[currentIndex]);
}


/* ============================
   UPDATE ETA TO FROM STOP
============================ */
function updateCalculations() {

  const fromLat = parseFloat(localStorage.getItem("fromLat"));
  const fromLng = parseFloat(localStorage.getItem("fromLng"));

  if (!fromLat || !fromLng) return;

  const busPos = busMarker.getLatLng();

  const distanceKm = haversine(
    busPos.lat,
    busPos.lng,
    fromLat,
    fromLng
  );

  const etaMinutes =
    (distanceKm / BUS_SPEED_KMH) * 60;

  document.getElementById("distance").innerText =
    distanceKm.toFixed(2) + " km";

  document.getElementById("eta").innerText =
    etaMinutes.toFixed(1) + " min";

  displayArrivalTime(etaMinutes);

  checkArrivalAlert(distanceKm);
}

/* ============================
   ALERT SYSTEM
============================ */
function checkArrivalAlert(distance) {

  const alertBox = document.getElementById("arrivalAlert");
  const userAlertDistance =
    parseFloat(localStorage.getItem("alertDistance")) || 1;

  if (distance < userAlertDistance) {

    if (alertBox) alertBox.style.display = "block";

    if (!alertTriggered) {
      alertTriggered = true;
      alertSound.play();
    }

  } else {
    if (alertBox) alertBox.style.display = "none";
  }
}


/* ============================
   DISPLAY TIMES
============================ */
function displayDepartureTime() {

  document.getElementById("departureTime").innerText =
    departureTime.toLocaleTimeString();
}

function displayArrivalTime(etaMinutes) {

  const arrival =
    new Date(departureTime.getTime() + etaMinutes * 60000);

  document.getElementById("arrivalTime").innerText =
    arrival.toLocaleTimeString();
}


/* ============================
   ROUTE FINDER (UNCHANGED)
============================ */
function populateStops() {

  const fromSelect = document.getElementById("fromStop");
  const toSelect = document.getElementById("toStop");

  if (!fromSelect || !toSelect) return;

  const stops = new Set();

  BUS_LINES.forEach(line => {
    line.stops.forEach(stop => {
      if (stop) stops.add(stop.trim());
    });
  });

  const sorted = Array.from(stops).sort();

  sorted.forEach(stop => {
    fromSelect.add(new Option(stop, stop));
    toSelect.add(new Option(stop, stop));
  });
}


/* ============================
   PAYMENT
============================ */
function payTicket() {
  localStorage.setItem("lastTicket", new Date().toLocaleString());
  alert("Payment successful!");
}

function linkStudentCard() {
  localStorage.setItem("studentCard", "Linked");
  alert("Student card linked successfully!");
}


/* ============================
   COMPLAINT
============================ */
function submitComplaint() {

  const text =
    document.getElementById("complaintText").value;

  if (!text) return;

  let complaints =
    JSON.parse(localStorage.getItem("complaints")) || [];

  complaints.push({
    text,
    date: new Date().toLocaleString()
  });

  localStorage.setItem(
    "complaints",
    JSON.stringify(complaints)
  );

  alert("Complaint submitted.");
}


/* ============================
   BREAKDOWN SIMULATION
============================ */
function simulateBreakdown() {

  if (Math.random() < 0.05) {
    alert("⚠ Bus breakdown detected.");
  }
}


/* ============================
   HAVERSINE
============================ */
function haversine(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;

  return R * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}