/****************************************************
 * DYNAMIC BUS ROUTING WITH OSRM – EXTENDED VERSION
 * (All original functionality preserved)
 ****************************************************/

const BUS_SPEED_KMH = 60;
const UPDATE_INTERVAL = 10000;

let map;
let passengerMarker;
let busMarker;
let routePolyline;

let routeCoordinates = [];
let currentIndex = 0;

let alertTriggered = false;
let alertSound = new Audio("alert.wav");

let busSerial = "BUS-1001";
let departureTime = null;

/* ============================
   INITIALIZATION
============================ */
document.addEventListener("DOMContentLoaded", () => {

  if ("Notification" in window) {
    Notification.requestPermission();
  }

  getPassengerLocation();
});

/* ============================
   GET PASSENGER GPS
============================ */
function getPassengerLocation() {

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      initMap(userLat, userLng);

      const randomStart = generateRandomStart(userLat, userLng);

      requestRoute(randomStart, [userLng, userLat]);

    },
    () => {
      alert("Location permission denied");
    }
  );
}

/* ============================
   MAP SETUP
============================ */
function initMap(userLat, userLng) {

  map = L.map("map").setView([userLat, userLng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  passengerMarker = L.marker([userLat, userLng])
    .addTo(map)
    .bindPopup("You are here");
}

/* ============================
   GENERATE RANDOM START 5–10 KM
============================ */
function generateRandomStart(userLat, userLng) {

  const distanceKm = 5 + Math.random() * 5; // 5–10 km
  const angle = Math.random() * 2 * Math.PI;

  const deltaLat = distanceKm / 111;
  const deltaLng = distanceKm / (111 * Math.cos(userLat * Math.PI / 180));

  const newLat = userLat + deltaLat * Math.cos(angle);
  const newLng = userLng + deltaLng * Math.sin(angle);

  return [newLng, newLat];
}

/* ============================
   REQUEST ROUTE FROM OSRM
============================ */
function requestRoute(start, end) {

  const url =
    `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {

      if (!data.routes || data.routes.length === 0) {
        alert("No route found");
        return;
      }

      routeCoordinates = data.routes[0].geometry.coordinates;

      departureTime = new Date();
      displayDepartureTime();

      document.getElementById("routeLoader").style.display = "none";

      drawRoute();
      placeBus();
      startSimulation();
    })
    .catch(err => console.error("Routing error:", err));
}

/* ============================
   DRAW ROUTE
============================ */
function drawRoute() {

  const latLngs = routeCoordinates.map(coord => [coord[1], coord[0]]);

  routePolyline = L.polyline(latLngs, {
    color: "blue",
    weight: 5
  }).addTo(map);

  map.fitBounds(routePolyline.getBounds());
}

/* ============================
   PLACE BUS
============================ */
function placeBus() {

  const firstPoint = routeCoordinates[0];
  const busLineNumber = "Line 5";

  busMarker = L.marker([firstPoint[1], firstPoint[0]], {
    icon: L.divIcon({
      className: "bus-wrapper",
      html: `
        <div class="bus-label">${busLineNumber}</div>
        <div class="bus-icon">🚌</div>
      `,
      iconSize: [60, 60],
      iconAnchor: [30, 40]
    })
  }).addTo(map)
  .bindPopup(`Serial: ${busSerial}`);
}

/* ============================
   START BUS MOVEMENT
============================ */
function startSimulation() {

  updateCalculations();

  setInterval(() => {
    moveBus();
    updateCalculations();
    simulateBreakdown(); // NEW
  }, UPDATE_INTERVAL);
}

/* ============================
   MOVE BUS
============================ */
function moveBus() {

  currentIndex += 20;

  if (currentIndex >= routeCoordinates.length) {
    currentIndex = routeCoordinates.length - 1;
    return;
  }

  const point = routeCoordinates[currentIndex];
  busMarker.setLatLng([point[1], point[0]]);
}

/* ============================
   DISTANCE + ETA
============================ */
function updateCalculations() {

  if (!routeCoordinates.length) return;

  const remainingDistanceKm = calculateRemainingDistance();
  const etaMinutes = (remainingDistanceKm / BUS_SPEED_KMH) * 60;

  document.getElementById("distance").innerText =
    remainingDistanceKm.toFixed(2) + " km";

  document.getElementById("eta").innerText =
    etaMinutes.toFixed(1) + " minutes";

  displayArrivalTime(etaMinutes);

  const alertBox = document.getElementById("arrivalAlert");

  if (remainingDistanceKm < 1) {

    alertBox.style.display = "block";

    if (!alertTriggered) {

      alertTriggered = true;
      alertSound.play();

      if (Notification.permission === "granted") {
        new Notification("🚌 Bus Approaching!", {
          body: "The bus is less than 1 km away from you."
        });
      }
    }
  } else {
    alertBox.style.display = "none";
  }
}

/* ============================
   CALCULATE REMAINING DISTANCE
============================ */
function calculateRemainingDistance() {

  let total = 0;

  for (let i = currentIndex; i < routeCoordinates.length - 1; i++) {

    const a = routeCoordinates[i];
    const b = routeCoordinates[i + 1];

    total += haversine(a[1], a[0], b[1], b[0]);
  }

  return total;
}

/* ============================
   DISPLAY DEPARTURE TIME
============================ */
function displayDepartureTime() {

  document.getElementById("departureTime").innerText =
    "Departure: " + departureTime.toLocaleTimeString();
}

/* ============================
   DISPLAY ARRIVAL TIME
============================ */
function displayArrivalTime(etaMinutes) {

  const arrival = new Date(departureTime.getTime() + etaMinutes * 60000);

  document.getElementById("arrivalTime").innerText =
    "Arrival: " + arrival.toLocaleTimeString();
}

/* ============================
   ROUTE SUGGESTION
============================ */
function suggestBestRoute() {

  document.getElementById("routeSuggestion").innerText =
    "Best Line: Line 5 | Alternative: Line 7";
}

/* ============================
   PAYMENT SYSTEM
============================ */
function payTicket() {

  localStorage.setItem("lastTicket", new Date().toLocaleString());
  alert("Payment successful!");
}

/* ============================
   STUDENT CARD LINK
============================ */
function linkStudentCard() {

  localStorage.setItem("studentCard", "Linked");
  alert("Student card linked successfully!");
}

/* ============================
   COMPLAINT SYSTEM
============================ */
function submitComplaint() {

  const text = document.getElementById("complaintText").value;

  if (!text) return;

  let complaints =
    JSON.parse(localStorage.getItem("complaints")) || [];

  complaints.push({
    text: text,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("complaints", JSON.stringify(complaints));

  alert("Complaint submitted.");
}

/* ============================
   BREAKDOWN SIMULATION
============================ */
function simulateBreakdown() {

  if (Math.random() < 0.05) {

    alert("⚠ Bus breakdown detected. Alternative Line 7 available.");
  }
}

/* ============================
   HAVERSINE
============================ */
function haversine(lat1, lon1, lat2, lon2) {

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(v) {
  return (v * Math.PI) / 180;
}
