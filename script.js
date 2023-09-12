let lastSortedColumn = null;
let isAscending = true;

// Function to sort the table
function sortTable(columnIndex, dataType) {
  const table = document.getElementById("dataTable");
  const rows = Array.from(table.rows).slice(1); // Skip the header row
  
  // Determine the sorting direction
  if (lastSortedColumn === columnIndex) {
    isAscending = !isAscending;
  } else {
    isAscending = true;
  }
  lastSortedColumn = columnIndex;

  const sortedRows = rows.sort((a, b) => {
    let cellA = a.cells[columnIndex].textContent;
    let cellB = b.cells[columnIndex].textContent;

    // Convert to the appropriate data type for comparison
    if (dataType === 'UInt64' || dataType === 'Nullable(Float64)') {
      cellA = parseFloat(cellA);
      cellB = parseFloat(cellB);
    } else if (dataType.includes("DateTime64")) {
      cellA = new Date(cellA);
      cellB = new Date(cellB);
    }

    let comparison = cellA < cellB ? -1 : cellA > cellB ? 1 : 0;
    return isAscending ? comparison : -comparison;
  });

  // Remove existing rows and append sorted rows
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  sortedRows.forEach(row => table.appendChild(row));

  // Update arrows in table headers
  const headerCells = table.tHead.rows[0].cells;
  Array.from(headerCells).forEach((cell, index) => {
    cell.innerHTML = cell.innerHTML.replace(/ (↑|↓)$/, ''); // Remove existing arrow
    if (index === columnIndex) {
      cell.innerHTML += isAscending ? ' ↑' : ' ↓';
    }
  });
}

// Function to fetch data from API and populate table
async function fetchData() {
  try {
    const response = await fetch("https://analytics.testnet.voi.nodly.io/v0/consensus/accounts/all");
    const data = await response.json();

    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");

    // Create table headers
    const headerRow = document.createElement("tr");
    data.meta.forEach((metaItem, index) => {
      const th = document.createElement("th");
      th.textContent = metaItem.name;
      th.addEventListener("click", () => sortTable(index, metaItem.type));
      headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // Create table rows
    data.data.forEach((dataRow) => {
      const tr = document.createElement("tr");
      dataRow.forEach((cellData) => {
        const td = document.createElement("td");
        td.textContent = cellData;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    document.getElementById('proposer-count').textContent = data.data.length;

  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Invoke fetchData when the page loads
window.addEventListener("DOMContentLoaded", fetchData);
