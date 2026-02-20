// ===============================================================
// REGION / SUBTYPE / LAND DISTRICT LOADER + FILTER LOGGER + CSV FILTER ENGINE
// ===============================================================

let regionData = [];
let txtChildren = [];
let salesData = [];
let filterLog = [];   // <-- LOG FILE (in-memory array)


// ===============================================================
// STEP 1: LOAD REGIONS.JSON + TXT + CSV
// ===============================================================
Promise.all([
  fetch('regions.json').then(r => r.json()),
  fetch('region_landDistrict.txt').then(r => r.text()),
  fetch('../Data/sale.csv').then(r => r.text())
])
.then(([jsonData, txtText, csvText]) => {
  regionData = jsonData.regions;
  txtChildren = parseChildren(txtText);
  salesData = parseCSV(csvText);

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
// STEP 3: PARSE CSV INTO OBJECTS
// ===============================================================
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(row => {
    const cols = row.split(',');
    const obj = {};

    headers.forEach((h, i) => {
      let val = cols[i]?.trim().replace(/\r/g, "");

      // Normalize NULL or empty
      if (val === "" || val === "NULL") {
        obj[h] = null;
        return;
      }

      // Explicitly convert RATIO to number
      if (h === "RATIO") {
        obj[h] = Number(val);
        return;
      }

      // Normalize region fields as strings
      if (h === "NBHD_REGION" || h === "NBHD_CODE" || h === "LAND_DISTRICT") {
        obj[h] = val.toString();
        return;
      }

      // Convert numeric fields
      if (!isNaN(val)) {
        obj[h] = Number(val);
      } else {
        obj[h] = val;
      }
    });

    return obj;
  });
}


// ===============================================================
// STEP 4: BUILD SUBTYPES + CHILDREN DYNAMICALLY
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
// STEP 5: POPULATE MAIN REGION DROPDOWN
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
// STEP 6: POPULATE SUBTYPE DROPDOWN (OPTIONAL)
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
// STEP 7: POPULATE LAND DISTRICT DROPDOWN (OPTIONAL)
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
// STEP 8: APPLY FILTERS + LOG + COMPUTE SUMMARY
// ===============================================================
function applyFilters() {
  const region = document.getElementById('mainRegion').value || null;
  const subtype = document.getElementById('subRegion').value || null;
  const district = document.getElementById('landDistrict').value || null;

  console.log("FILTERS APPLIED:", { region, subtype, district });
  console.log("CSV LOADED:", salesData.length);

  // MUST come before debug logs
  const filtered = salesData.filter(row => {
      if (region && row.NBHD_REGION !== region) return false;
      if (subtype && row.NBHD_CODE !== subtype) return false;
      if (district && row.LAND_DISTRICT !== district) return false;
      return true;
  });

  // Debug logs AFTER filtered is created
  console.log("FILTERED ROW COUNT:", filtered.length);
  console.log("SUMMARY INPUT:", filtered);

  const summary = computeSummary(filtered);
  updateSummaryBlock(summary);
}


// ===============================================================
// STEP 9: COMPUTE SUMMARY METRICS (MATCHES YOUR SCREENSHOT)
// ===============================================================
function computeSummary(rows) {
  if (rows.length === 0) return null;

  const ratios = rows.map(r => r.RATIO).filter(x => !isNaN(x));

  const n = ratios.length;
  const mean = ratios.reduce((a,b)=>a+b,0) / n;
  const median = ratios.sort((a,b)=>a-b)[Math.floor(n/2)];

  const absDev = ratios.map(r => Math.abs(r - median));
  const COD = (absDev.reduce((a,b)=>a+b,0) / n) / median * 100;

  const variance = ratios.reduce((a,b)=>a + Math.pow(b-mean,2),0) / n;
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
// STEP 10: UPDATE SUMMARY BLOCK (YOU STYLE THIS IN HTML/CSS)
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
