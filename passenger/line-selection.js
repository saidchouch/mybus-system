/*************************************************
 ROUTE FINDER – USING MEKNES_LINES ONLY
 Sends real stop coordinates
*************************************************/

document.addEventListener("DOMContentLoaded", () => {

  if (typeof MEKNES_LINES === "undefined") {
    console.error("MEKNES_LINES not loaded");
    return;
  }

  populateStops();
});


function populateStops() {

  const fromSelect = document.getElementById("fromStop");
  const toSelect   = document.getElementById("toStop");

  const stopMap = new Map();

  MEKNES_LINES.forEach(line => {

    line.stops.forEach(stop => {

      if (!stop.stop_name) return;

      const key = stop.stop_name.trim().toLowerCase();

      if (!stopMap.has(key)) {
        stopMap.set(key, {
          name: stop.stop_name.trim(),
          lat: stop.latitude,
          lng: stop.longitude
        });
      }
    });
  });

  const sorted = Array.from(stopMap.values())
    .sort((a,b) => a.name.localeCompare(b.name));

  sorted.forEach(stop => {
    fromSelect.add(new Option(stop.name, stop.name));
    toSelect.add(new Option(stop.name, stop.name));
  });

  window.realStops = stopMap; // store globally
}


function findAvailableLines() {

  const fromName = document.getElementById("fromStop").value.trim();
  const toName   = document.getElementById("toStop").value.trim();

  const lineSelect = document.getElementById("lineSelect");
  lineSelect.innerHTML = "";

  if (fromName === toName) {
    alert("Departure and destination cannot be the same.");
    return;
  }

  MEKNES_LINES.forEach(line => {

    const stopNames = line.stops.map(s =>
      s.stop_name.trim()
    );

    if (stopNames.includes(fromName) &&
        stopNames.includes(toName)) {

      const match = line.line_name.match(/N\d+/);
      const lineCode = match ? match[0] : line.line_name;

      lineSelect.add(new Option(line.line_name, lineCode));
    }
  });

  if (!lineSelect.options.length) {
    const option = new Option("No line available", "");
    option.disabled = true;
    lineSelect.add(option);
  }
}


function startTracking() {

  const selectedLine =
    document.getElementById("lineSelect").value;

  const fromName =
    document.getElementById("fromStop").value.trim();

  const alertDistance =
    document.getElementById("alertDistance").value;

  if (!selectedLine) {
    alert("Select a valid line");
    return;
  }

  const stopData =
    window.realStops.get(fromName.toLowerCase());

  localStorage.setItem("selectedLine", selectedLine);
  localStorage.setItem("fromLat", stopData.lat);
  localStorage.setItem("fromLng", stopData.lng);
  localStorage.setItem("alertDistance", alertDistance);

  window.location.href = "passenger.html";
}