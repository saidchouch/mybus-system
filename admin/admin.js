/*************************************************
 SMART BUS ADMIN DASHBOARD – FULL REBUILD
*************************************************/

let map;
let buses = [];
let currentLinePolyline = null;
let activeButton = null;
let routePolylines = [];
let currentSelectedLine = "ALL";

/* ================================
   INITIALIZATION
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  initMap();

  await createFleet();   // Create routes first
  createLineButtons();   // Then create buttons

  simulateMovement();
  updateDashboardStats();
  loadComplaints();
  updateFleetStatus();
  loadLogs();

  setInterval(loadLogs, 2000);
});



function createLineButtons() {

  const container = document.getElementById("lineButtons");
  container.innerHTML = "";

  const uniqueLines = [];
  const seen = new Set();

  MEKNES_LINES.forEach((line, index) => {
    const cleanName = line.line_name.trim();

    if (!seen.has(cleanName)) {
      seen.add(cleanName);
      uniqueLines.push({ name: cleanName, index });
    }
  });

  // ===== ALL BUTTON =====
  const allBtn = document.createElement("button");
  allBtn.innerText = "ALL";
  allBtn.classList.add("active");

  allBtn.onclick = () => {

  currentSelectedLine = "ALL";

  routePolylines.forEach(line => line.addTo(map));

  buses.forEach(bus => {
    bus.marker.addTo(map);
  });

  if (currentLinePolyline) {
    map.removeLayer(currentLinePolyline);
    currentLinePolyline = null;
  }

  updateFleetStatus();   // 🔥 refresh fleet list

  if (activeButton) activeButton.classList.remove("active");
  allBtn.classList.add("active");
  activeButton = allBtn;
};

  container.appendChild(allBtn);
  activeButton = allBtn;

  // ===== INDIVIDUAL BUTTONS =====
  uniqueLines.forEach(lineData => {

    const btn = document.createElement("button");
    btn.innerText = lineData.name;

    btn.onclick = () => {

      showLineOnMap(lineData.index, lineData.name);

      if (activeButton) activeButton.classList.remove("active");
      btn.classList.add("active");
      activeButton = btn;
    };

    container.appendChild(btn);
  });
}
function showLineOnMap(index, lineName) {

  currentSelectedLine = lineName.trim();

  routePolylines.forEach(line => map.removeLayer(line));

  buses.forEach(bus => {
    map.removeLayer(bus.marker);
  });

  if (currentLinePolyline) {
    map.removeLayer(currentLinePolyline);
    currentLinePolyline = null;
  }

  const selectedLine = MEKNES_LINES[index];

  if (!selectedLine || !selectedLine.stops) return;

  const coordinates = selectedLine.stops
    .filter(stop => stop.latitude && stop.longitude)
    .map(stop => [stop.latitude, stop.longitude]);

  if (coordinates.length < 2) return;

  currentLinePolyline = L.polyline(coordinates, {
    color: "#e74c3c",
    weight: 6
  }).addTo(map);

  map.fitBounds(currentLinePolyline.getBounds());

  // Show only buses of selected line
  buses.forEach(bus => {
    if (bus.lineName.trim() === currentSelectedLine) {
      bus.marker.addTo(map);
    }
  });

  updateFleetStatus();   // 🔥 refresh fleet list
}
/* ================================
   MAP INIT
================================ */
function initMap() {
  map = L.map("map").setView([33.88, -5.55], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);
}

/* ================================
   CREATE FLEET FROM STOPS JSON
================================ */
async function createFleet() {

  const linesData = MEKNES_LINES;

  const BUSES_PER_LINE = 3; // 🔥 change this number to simulate more buses

  linesData.forEach((selectedLine, lineIndex) => {

    const validStops = selectedLine.stops
      .filter(stop => stop.latitude && stop.longitude);

    if (validStops.length < 2) return;

    const route = validStops.map(stop => [
      stop.latitude,
      stop.longitude
    ]);

    // Draw polyline once per line
    const polyline = L.polyline(route, {
      color: getColor(lineIndex),
      weight: 5
    }).addTo(map);

    routePolylines.push(polyline);

    if (lineIndex === 0) {
      map.fitBounds(polyline.getBounds());
    }

    const shortName =
      selectedLine.line_name.match(/N\d+/)?.[0] ||
      selectedLine.line_name.trim();

    // 🔥 CREATE MULTIPLE BUSES FOR THIS LINE
    for (let i = 0; i < BUSES_PER_LINE; i++) {

      // Spread buses along route
      const startIndex =
        Math.floor((route.length / BUSES_PER_LINE) * i);

      const marker = L.marker(route[startIndex], {
        icon: L.divIcon({
          className: "bus-wrapper",
          html: `
            <div class="bus-label-admin">${shortName}</div>
            <div class="bus-emoji">🚌</div>
          `,
          iconSize: [70,70],
          iconAnchor: [35,50]
        })
      }).addTo(map);

      const busId =
        `BUS-${lineIndex}${i}${Date.now().toString().slice(-3)}`;

      buses.push({
        id: busId,
        lineName: selectedLine.line_name.trim(),
        stops: validStops,
        marker,
        route,
        polyline,
        index: startIndex
      });
    }
  });
}
/* ================================
   BUS MOVEMENT (REAL STOPS)
================================ */
function simulateMovement() {

  setInterval(() => {

    buses.forEach(bus => {

      bus.index++;

      if (bus.index >= bus.route.length) {
        bus.index = 0; // loop
      }

      bus.marker.setLatLng(bus.route[bus.index]);

    });

  }, 2000);
}
/* ================================
   FLEET STATUS
================================ */
function updateFleetStatus() {

  const panel = document.getElementById("fleetStatus");
  panel.innerHTML = "";

  if (!buses || buses.length === 0) {
    panel.innerHTML = "<p>No buses loaded.</p>";
    return;
  }

buses.forEach(bus => {

  if (currentSelectedLine !== "ALL" &&
      bus.lineName.trim() !== currentSelectedLine) {
    return; // skip other lines
  }

  let status = "ON_TIME";
  let color = "green";

  if (typeof getDB === "function") {
    const db = getDB();
    if (db?.fleet) {
      const dbBus = db.fleet.find(b => b.id === bus.id);
      if (dbBus) {
        status = dbBus.status;
        if (status === "DELAYED") color = "orange";
        if (status === "INCIDENT") color = "red";
        if (status === "MAINTENANCE") color = "black";
      }
    }
  }

  let currentStop = "Unknown stop";
  if (bus.stops?.length) {
    const stopIndex = bus.index % bus.stops.length;
    currentStop = bus.stops[stopIndex]?.stop_name || "Unknown stop";
  }

  panel.innerHTML += `
    <div style="
      margin-bottom:12px;
      padding:12px;
      background:white;
      border-radius:8px;
      box-shadow:0 2px 6px rgba(0,0,0,0.08);
    ">
      <div style="font-weight:bold;">
        ${bus.id}
      </div>

      <div style="font-size:13px; color:#555;">
        ${bus.lineName}
      </div>

      <div style="margin-top:6px;">
        📍 <strong>${currentStop}</strong>
      </div>

      <div style="margin-top:6px;">
        Status:
        <span style="color:${color}; font-weight:bold;">
          ${status}
        </span>
      </div>
    </div>
  `;
});
}
/* ================================
   COMPLAINTS
================================ */
function loadComplaints() {

  const complaints =
    JSON.parse(localStorage.getItem("complaints")) || [];

  const list = document.getElementById("complaintsList");
  list.innerHTML = "";

  complaints.forEach(c => {
    list.innerHTML += `<li>${c.text} – ${c.date}</li>`;
  });
}


/* ================================
   MANAGEMENT ACTIONS
================================ */
function assignDriver() {
  showNotification("Driver Assigned Successfully","success");
}

function scheduleMaintenance() {
  showNotification("Maintenance Scheduled","info");
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
  showNotification("PDF Report Generated","success");
}

/* ================================
   COMMUNICATION
================================ */
function sendBroadcast() {
  const msg = document.getElementById("broadcastInput").value;
  showNotification("Broadcast sent to all drivers: " + msg,"info");
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


let currentFilter = "ALL";

function loadLogs() {

    const db = getDB();
    let logs = db.logs;

    if (currentFilter !== "ALL") {
        logs = logs.filter(log => log.type === currentFilter);
    }

    logs.sort((a, b) => b.id - a.id);

    const tableBody = document.querySelector("#logsTable tbody");
    tableBody.innerHTML = "";

    logs.forEach((log, index) => {

        const color =
            log.level === "CRITICAL" ? "#ffdddd" :
            log.level === "WARNING" ? "#fff3cd" :
            "#e8f5e9";

        const row = `
            <tr style="background:${color}">
                <td>${index + 1}</td>
                <td>${log.type}</td>
                <td>${log.title}</td>
                <td>${log.description}</td>
                <td>${log.actor}</td>
                <td>${log.level}</td>
                <td>${log.date}</td>
                <td>${log.time}</td>
            </tr>
        `;

        tableBody.innerHTML += row;
    });
}

function filterLogs(type) {
    currentFilter = type;
    loadLogs();
}

function updateDashboardStats() {

    const stats = calculateStats();

    document.getElementById("passengerCount").innerText = stats.payments;
    document.getElementById("revenue").innerText = stats.revenue + " MAD";
    document.getElementById("punctuality").innerText =
        (100 - stats.incidents) + "%";
}

function clearLogs() {

    if(confirm("Delete all system logs?")) {
        localStorage.removeItem("systemLogs");
        loadLogs();
    }
}

