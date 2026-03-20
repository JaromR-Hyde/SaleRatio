/* === GLOBAL STATE === */
let allSales = []; 
let currentFilteredData = []; 

async function initDashboard() {
    try {
        const sessionReq = await fetch('session.json');
        const session = await sessionReq.json();
        const dataReq = await fetch('output.json');
        allSales = await dataReq.json();
        currentFilteredData = [...allSales];

        document.getElementById('userContext').textContent = 
            `User: ${session.username} | County: ${session.county} | Jurisdiction: ${session.jurisdiction}`;

        addFilterRow();
        renderTable(allSales);

        document.getElementById('addFilterBtn').addEventListener('click', addFilterRow);
        document.getElementById('applyFiltersBtn').addEventListener('click', applyAllFilters);
        document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            document.getElementById('filter-rows-container').innerHTML = "";
            addFilterRow();
            currentFilteredData = [...allSales];
            renderTable(allSales);
        });
    } catch (err) { console.error(err); }
}

function addFilterRow() {
    const container = document.getElementById('filter-rows-container');
    if (allSales.length === 0) return;
    const keys = Object.keys(allSales[0]);
    const rowDiv = document.createElement('div');
    rowDiv.className = "filter-row";
    rowDiv.style = "display: flex; gap: 10px; margin-bottom: 10px; align-items: center; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ddd;";
    const fieldSelect = document.createElement('select');
    fieldSelect.className = "form-input filter-field";
    fieldSelect.innerHTML = keys.map(k => `<option value="${k}">${k.replace(/_/g, ' ')}</option>`).join('');
    const opSelect = document.createElement('select');
    opSelect.className = "form-input filter-operator";
    opSelect.innerHTML = `<option value="equals">equals</option><option value="contains">contains</option><option value="greater"> > </option><option value="less"> < </option>`;
    const valSelect = document.createElement('select');
    valSelect.className = "form-input filter-value";
    valSelect.style.flexGrow = "1";
    const delBtn = document.createElement('button');
    delBtn.innerHTML = "✕";
    delBtn.style = "background: none; border: none; color: #b30000; cursor: pointer; font-weight: bold;";
    delBtn.onclick = () => rowDiv.remove();
    rowDiv.appendChild(fieldSelect);
    rowDiv.appendChild(opSelect);
    rowDiv.appendChild(valSelect);
    rowDiv.appendChild(delBtn);
    container.appendChild(rowDiv);
    updateValueOptions(fieldSelect, valSelect);
    fieldSelect.addEventListener('change', () => updateValueOptions(fieldSelect, valSelect));
}

function updateValueOptions(fieldElem, valueElem) {
    const selectedField = fieldElem.value;
    const uniqueValues = [...new Set(allSales.map(item => item[selectedField]))].filter(v => v).sort();
    valueElem.innerHTML = `<option value="">-- Select Value --</option>` + uniqueValues.map(v => `<option value="${v}">${v}</option>`).join('');
}

function applyAllFilters() {
    const filterRows = document.querySelectorAll('.filter-row');
    let filteredData = [...allSales];
    filterRows.forEach(row => {
        const field = row.querySelector('.filter-field').value;
        const operator = row.querySelector('.filter-operator').value;
        const value = row.querySelector('.filter-value').value.toLowerCase().trim();
        if (value === "") return;
        filteredData = filteredData.filter(item => {
            const itemStr = (item[field] || "").toString().toLowerCase();
            const itemNum = parseFloat(item[field]);
            const inputNum = parseFloat(value);
            switch (operator) {
                case "equals": return itemStr === value;
                case "contains": return itemStr.includes(value);
                case "greater": return itemNum > inputNum;
                case "less": return itemNum < inputNum;
                default: return true;
            }
        });
    });
    currentFilteredData = filteredData;
    renderTable(filteredData);
}

function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(currentFilteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `Export_${new Date().getTime()}.xlsx`);
}

function renderTable(data) {
    const container = document.getElementById('tableBody');
    container.innerHTML = ""; 
    document.getElementById('totalSales').textContent = allSales.length;
    document.getElementById('filteredCount').textContent = data.length;
    data.forEach(row => {
        const tr = document.createElement('tr');
        const ratio = row.RATIO ? (row.RATIO * 100).toFixed(2) + '%' : 'N/A';
        tr.innerHTML = `
            <td>${row.JURISDICTION || ''}</td>
            <td>${row.NBHD_REGION || row.REGION || 'N/A'}</td>
            <td>${row.PARCEL_NUMBER || row.PARCEL_ID || 'N/A'}</td>
            <td>${row.SALE_DATE || 'N/A'}</td>
            <td>$${parseFloat(row.ADUSTED_SALES_PRICE || 0).toLocaleString()}</td>
            <td>$${parseFloat(row.LAND_VALUE || 0).toLocaleString()}</td>
            <td>$${parseFloat(row.IMP_VALUE || 0).toLocaleString()}</td>
            <td>$${parseFloat(row.TOTAL_VALUE || 0).toLocaleString()}</td>
            <td>${ratio}</td>`;
        container.appendChild(tr);
    });
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm("Close application?")) {
        try { await fetch('/shutdown', { method: 'POST' }); } catch (e) {}
        window.close();
    }
});

window.onload = initDashboard;