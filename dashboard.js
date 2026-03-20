/* === GLOBAL STATE === */
let allSales = []; 
let currentFilteredData = []; // Tracks the data currently displayed after filtering

/**
 * INIT DASHBOARD
 */
async function initDashboard() {
    try {
        const sessionReq = await fetch('session.json');
        const session = await sessionReq.json();
        
        const dataReq = await fetch('output.json');
        allSales = await dataReq.json();
        currentFilteredData = [...allSales]; // Start with full dataset

        document.getElementById('userContext').textContent = 
            `User: ${session.username} | County: ${session.county} | Jurisdiction: ${session.jurisdiction}`;

        addFilterRow();
        renderTable(allSales);

        // Event Listeners
        document.getElementById('addFilterBtn').addEventListener('click', addFilterRow);
        document.getElementById('applyFiltersBtn').addEventListener('click', applyAllFilters);
        document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            document.getElementById('filter-rows-container').innerHTML = "";
            addFilterRow();
            currentFilteredData = [...allSales];
            renderTable(allSales);
        });

    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

/**
 * ADD FILTER ROW
 */
function addFilterRow() {
    const container = document.getElementById('filter-rows-container');
    if (allSales.length === 0) return;

    const keys = Object.keys(allSales[0]);
    const rowDiv = document.createElement('div');
    rowDiv.className = "filter-row";
    rowDiv.style = "display: flex; gap: 10px; margin-bottom: 10px; align-items: center; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ddd;";

    rowDiv.innerHTML = `
        <select class="form-input filter-field" style="width: 200px;">
            ${keys.map(k => `<option value="${k}">${k.replace(/_/g, ' ')}</option>`).join('')}
        </select>
        <select class="form-input filter-operator" style="width: 120px;">
            <option value="contains">contains</option>
            <option value="equals">equals</option>
            <option value="greater"> &gt; </option>
            <option value="less"> &lt; </option>
        </select>
        <input type="text" class="form-input filter-value" placeholder="Value..." style="flex-grow: 1;">
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #b30000; cursor: pointer; font-weight: bold;">✕</button>
    `;
    container.appendChild(rowDiv);
}

/**
 * APPLY FILTERS
 */
function applyAllFilters() {
    const filterRows = document.querySelectorAll('.filter-row');
    let filteredData = [...allSales];

    filterRows.forEach(row => {
        const field = row.querySelector('.filter-field').value;
        const operator = row.querySelector('.filter-operator').value;
        const value = row.querySelector('.filter-value').value.toLowerCase().trim();

        if (value === "") return;

        filteredData = filteredData.filter(item => {
            const rawValue = item[field];
            const itemString = (rawValue || "").toString().toLowerCase();
            const itemNum = parseFloat(rawValue);
            const inputNum = parseFloat(value);

            switch (operator) {
                case "equals": return itemString === value;
                case "contains": return itemString.includes(value);
                case "greater": return !isNaN(itemNum) && itemNum > inputNum;
                case "less": return !isNaN(itemNum) && itemNum < inputNum;
                default: return true;
            }
        });
    });

    currentFilteredData = filteredData; // Sync export data with view
    renderTable(filteredData);
}

/**
 * EXPORT TO EXCEL
 */
function exportToExcel() {
    if (currentFilteredData.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(currentFilteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_Data");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    XLSX.writeFile(workbook, `Sale_Ratio_Export_${timestamp}.xlsx`);
}

/**
 * RENDER TABLE
 */
function renderTable(data) {
    const container = document.getElementById('tableBody');
    container.innerHTML = ""; 

    document.getElementById('totalSales').textContent = allSales.length;
    document.getElementById('filteredCount').textContent = data.length;

    data.forEach(row => {
        const tr = document.createElement('tr');
        const ratioValue = row.RATIO ? (row.RATIO * 100).toFixed(2) : null;
        const ratioClass = (ratioValue < 80 || ratioValue > 110) ? "red" : "green";

        tr.innerHTML = `
            <td>${row.JURISDICTION || ''}</td>
            <td>${row.NBHD_REGION || row.REGION || 'N/A'}</td>
            <td>${row.PARCEL_NUMBER || row.PARCEL_ID || 'N/A'}</td>
            <td>${row.SALE_DATE || 'N/A'}</td>
            <td class="green">$${parseFloat(row.ADUSTED_SALES_PRICE || 0).toLocaleString()}</td>
            <td>$${parseFloat(row.LAND_VALUE || 0).toLocaleString()}</td>
            <td>$${parseFloat(row.IMP_VALUE || 0).toLocaleString()}</td>
            <td>$${parseFloat(row.TOTAL_VALUE || 0).toLocaleString()}</td>
            <td class="${ratioClass}">${ratioValue ? ratioValue + '%' : 'N/A'}</td>
        `;
        container.appendChild(tr);
    });
}

/**
 * LOGOUT
 */
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm("Logout and close the console?")) {
        try {
            await fetch('/shutdown', { method: 'POST' });
        } catch (e) {
            console.log("Shutting down...");
        }
        window.close();
    }
});

window.onload = initDashboard;