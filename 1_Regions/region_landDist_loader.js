// ===============================================================
// REGION / SUBTYPE / LAND DISTRICT LOADER + FILTER LOGGER + JSON FILTER ENGINE
// ===============================================================

let regionData = [];
let txtChildren = [];
let salesData = [];
let filterLog = [];   // <-- LOG FILE (in-memory array)


// ===============================================================
// STEP 1: LOAD REGIONS.JSON + TXT + SALES.JSON
// ===============================================================
Promise.all([
  fetch('regions.json').then(r => r.json()),
  fetch('region_landDistrict.txt').then(r => r.text()),
  fetch('../output.json').then(r => r.json())
])
.then(([jsonData, txtText, jsonSales]) => {
  regionData = jsonData.regions;
  txtChildren = parseChildren(txtText);

  // Convert RATIO to number
  salesData = jsonSales.map(r => ({
    ...r,
    RATIO: Number(r.RATIO)
  }));

  mergeChildren();
  populateMainDropdown();
})
.catch(err => console.error("ERROR:", err));


// ===============================================================
// STEP 2: PARSE TXT FILE
// FORMAT: RegionCode | SubtypeName | ChildName
// ===============================================================
function parseChildren(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [regionCode, subtype, child] = line.split('|');
      return { regionCode, subtype, child };
    });
}


// ===============================================================
// STEP 3: MERGE TXT CHILDREN INTO REGION STRUCTURE
// ===============================================================
function mergeChildren() {
  regionData.forEach(region => {
    const rows = txtChildren.filter(r => r.regionCode === region.code);

    const subtypeMap = {};

    rows.forEach(row => {
      if (!subtypeMap[row.subtype]) {
        subtypeMap[row.subtype] = [];
      }
      subtypeMap[row.subtype].push(row.child);
    });

    region.subtypes = Object.keys(subtypeMap).map(name => ({
      name,
      children: subtypeMap[name]
    }));
  });
}


// ===============================================================
// STEP 4: POPULATE MAIN REGION DROPDOWN
// ===============================================================
function populateMainDropdown() {
  const mainSelect = document.getElementById('mainRegion');
  mainSelect.innerHTML = `<option value="">Select Region</option>`;

  regionData.forEach(region => {
    const option = document.createElement('option');
    option.value = region.code;
    option.textContent = `${region.code} - ${region.label}`;
    mainSelect.appendChild(option);
  });

  mainSelect.addEventListener('change', () => {
    updateSubDropdown();
    applyFilters();
  });
}


// ===============================================================
// STEP 5: POPULATE SUBTYPE DROPDOWN
// ===============================================================
function updateSubDropdown() {
  const mainSelect = document.getElementById('mainRegion');
  const subSelect = document.getElementById('subRegion');
  const childSelect = document.getElementById('landDistrict');

  subSelect.innerHTML = "";
  childSelect.innerHTML = "";
  childSelect.disabled = true;

  const selectedCode = mainSelect.value;

  if (!selectedCode) {
    subSelect.disabled = true;
    applyFilters();
    return;
  }

  const region = regionData.find(r => r.code === selectedCode);

  if (!region.subtypes || region.subtypes.length === 0) {
    subSelect.disabled = true;
    applyFilters();
    return;
  }

  subSelect.disabled = false;
  subSelect.innerHTML = `<option value="">All Sub Regions</option>`;

  region.subtypes.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.name;
    option.textContent = sub.name;
    subSelect.appendChild(option);
  });

  subSelect.addEventListener('change', () => {
    updateChildDropdown();
    applyFilters();
  });

  applyFilters();
}


// ===============================================================
// STEP 6: POPULATE LAND DISTRICT DROPDOWN
// ===============================================================
function updateChildDropdown() {
  const mainSelect = document.getElementById('mainRegion');
  const subSelect = document.getElementById('subRegion');
  const childSelect = document.getElementById('landDistrict');

  childSelect.innerHTML = "";

  const selectedCode = mainSelect.value;
  const selectedSubtype = subSelect.value;

  if (!selectedSubtype) {
    childSelect.disabled = true;
    applyFilters();
    return;
  }

  const region = regionData.find(r => r.code === selectedCode);
  const subtypeObj = region.subtypes.find(s => s.name === selectedSubtype);

  if (!subtypeObj || !subtypeObj.children.length) {
    childSelect.disabled = true;
    applyFilters();
    return;
  }

  childSelect.disabled = false;
  childSelect.innerHTML = `<option value="">All Land Districts</option>`;

  subtypeObj.children.forEach(child => {
    const option = document.createElement('option');
    option.value = child;
    option.textContent = child;
    childSelect.appendChild(option);
  });

  childSelect.addEventListener('change', applyFilters);

  applyFilters();
}


// ===============================================================
// STEP 7: APPLY FILTERS + LOG + COMPUTE SUMMARY
// ===============================================================
function applyFilters() {
  const region = document.getElementById('mainRegion').value || null;
  const subtype = document.getElementById('subRegion').value || null;
  const district = document.getElementById('landDistrict').value || null;

  console.log("FILTERS APPLIED:", { region, subtype, district });
  console.log("JSON LOADED:", salesData.length);

  const filtered = salesData.filter(row => {
    if (region && row.NBHD_REGION !== region) return false;
    if (subtype && row.NBHD_CODE !== subtype) return false;
    if (district && row.LAND_DISTRICT !== district) return false;
    return true;
  });

  console.log("FILTERED ROW COUNT:", filtered.length);
  console.log("SUMMARY INPUT:", filtered);

  const summary = computeSummary(filtered);
  updateSummaryBlock(summary);
}


// ===============================================================
// STEP 8: COMPUTE SUMMARY METRICS
// ===============================================================
function computeSummary(rows) {
  if (rows.length === 0) return null;

  const ratios = rows
    .map(r => r.RATIO)
    .filter(x => typeof x === "number" && !isNaN(x));

  if (ratios.length === 0) return null;

  const n = ratios.length;
  const mean = ratios.reduce((a, b) => a + b, 0) / n;

  const sorted = [...ratios].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];

  const absDev = ratios.map(r => Math.abs(r - median));
  const COD = (absDev.reduce((a, b) => a + b, 0) / n) / median * 100;

  const variance = ratios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const COV = Math.sqrt(variance) / mean * 100;

  const PRD = mean / median;
  const DWM = median / mean;

  const se = Math.sqrt(variance / n);
  const meanUpper = mean + 1.96 * se;
  const meanLower = mean - 1.96 * se;

  const medUpper = median * 1.016;
  const medLower = median * 0.98;

  return {
    count: n,
    mean,
    median,
    COD,
    COV,
    PRD,
    DWM,
    meanUpper,
    meanLower,
    medUpper,
    medLower,
    normal: COV < 20 ? "Yes" : "No"
  };
}


// ===============================================================
// STEP 9: UPDATE SUMMARY BLOCK
// ===============================================================
function safe(value, digits = 4) {
  return (typeof value === "number" && !isNaN(value))
    ? value.toFixed(digits)
    : "—";
}

function updateSummaryBlock(summary) {
  if (!summary) {
    document.getElementById("summaryBlock").innerHTML = "No sales match filters.";
    return;
  }

  document.getElementById("summaryBlock").innerHTML = `
    <div class="summary-grid">
      <div>No Sales: ${summary.count}</div>
      <div>PRD: ${safe(summary.PRD, 2)}</div>
      <div>DWM: ${safe(summary.DWM)}</div>
      <div>Median: ${safe(summary.median)}</div>
      <div>Med Upper: ${safe(summary.medUpper)}</div>
      <div>Med Lower: ${safe(summary.medLower)}</div>
      <div>Mean: ${safe(summary.mean)}</div>
      <div>Mean Upper: ${safe(summary.meanUpper)}</div>
      <div>Mean Lower: ${safe(summary.meanLower)}</div>
      <div>COD: ${safe(summary.COD, 2)}</div>
      <div>COV: ${safe(summary.COV, 2)}</div>
      <div>Normal Distribution: ${summary.normal || "—"}</div>
    </div>
  `;
}
