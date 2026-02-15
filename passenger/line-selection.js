const cityLines = {
  Meknes: ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5", "Line 6", "Line 7","Line 8"],
  Rabat: ["R1", "R2", "R3","R4", "R5", "R6"],
  Casablanca: ["C10", "C20", "C30","C15", "C25", "C35"]
};

document.addEventListener("DOMContentLoaded", updateLines);

function updateLines() {

  const city = document.getElementById("citySelect").value;
  const lineSelect = document.getElementById("lineSelect");

  lineSelect.innerHTML = "";

  cityLines[city].forEach(line => {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line;
    lineSelect.appendChild(option);
  });
}

function startTracking() {

  const city = document.getElementById("citySelect").value;
  const line = document.getElementById("lineSelect").value;
  const alertDistance =
    document.getElementById("alertDistance").value;

  localStorage.setItem("selectedCity", city);
  localStorage.setItem("selectedLine", line);
  localStorage.setItem("alertDistance", alertDistance);

  window.location.href = "passenger.html";
}
