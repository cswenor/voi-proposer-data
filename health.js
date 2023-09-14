let currentEndpoint = null;  
let lastSortedColumn = -1;
let isAscending = true;

// Initialize table with default endpoint
fetchData('/v0/network/nodes/day');

// Event handler to switch endpoints
const endpointLinks = document.querySelectorAll('#endpoint-links a');
endpointLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const newEndpoint = e.target.getAttribute('data-endpoint');
    
    if (newEndpoint === currentEndpoint) return;  // Skip if already active
    currentEndpoint = newEndpoint;

    // Update 'active' class on links
    endpointLinks.forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');

    // Fetch new data and update table
    fetchData(newEndpoint);
  });
});

// When you load data, you could add the 'active' class to the default link you start with
document.querySelector('[data-endpoint="/v0/network/nodes/day"]').classList.add('active');

function fetchData(endpoint) {
  const fullEndpoint = `https://analytics.testnet.voi.nodly.io${endpoint}`;
  
  // Clear existing table data
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  // Fetch new data
  fetch(fullEndpoint)
    .then(response => response.json())
    .then(data => {
      // Populate table
      const tableBody = document.getElementById('table-body');
      data.data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
      
      // Attach sorting function to header cells
      const headerRow = document.getElementById('table-header');
      headerRow.innerHTML = ''; // Clear existing headers
      data.meta.forEach((col, index) => {
        const th = document.createElement('th');
        th.textContent = col.name;
        th.addEventListener('click', () => sortTable(index, col.type));
        headerRow.appendChild(th);
      });
    })
    .catch(error => console.error('Error fetching data:', error));
}

// Function to sort the table
function sortTable(columnIndex, dataType) {
  const table = document.getElementById("data-table");
  const rows = Array.from(table.rows).slice(1); // Skip the header row
  
  // Determine the sorting direction
  if (lastSortedColumn === columnIndex) {
    isAscending = !isAscending;
  } else {
    isAscending = true;
  }
  lastSortedColumn = columnIndex;

  // Sorting logic here (as per your existing function)
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

