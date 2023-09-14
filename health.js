let currentEndpoint = null;  
let lastSortedColumn = -1;
let isAscending = true;
let tableData = [];
let isLoading = false;

// Initialize table with default endpoint
fetchData('/v0/network/nodes/day');
document.querySelector('[data-endpoint="/v0/network/nodes/day"]').classList.add('active');

// Set up header click event listeners
const headerRow = document.getElementById('table-header');
headerRow.addEventListener('click', (e) => {
  const th = e.target.closest('th');
  if (!th) return;
  const index = Array.from(th.parentElement.children).indexOf(th);
  sortTable(index, th.getAttribute('data-type'));
});

// Event handler to switch endpoints
const endpointLinks = document.querySelectorAll('#endpoint-links a');
endpointLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    if (isLoading) return;

    const newEndpoint = e.target.getAttribute('data-endpoint');
    if (newEndpoint === currentEndpoint) return;  // Skip if already active
    currentEndpoint = newEndpoint;
    endpointLinks.forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
    fetchData(newEndpoint);
  });
});

function fetchData(endpoint) {
    if (isLoading) return; // prevent multiple simultaneous fetch operations
    isLoading = true;
    toggleLoading(true);

    const fullEndpoint = `https://analytics.testnet.voi.nodly.io${endpoint}`;
    fetch(fullEndpoint)
      .then(response => response.json())
      .then(data => {
        tableData = data.data; // Store the data in a variable
        updateTable();
        
        // Update header cells
        const headerRow = document.getElementById('table-header');
        headerRow.innerHTML = ''; // Clear existing headers
        data.meta.forEach((col, index) => {
          const th = document.createElement('th');
          th.textContent = col.name;
          th.setAttribute('data-type', col.type);
          headerRow.appendChild(th);
        });
      })
      .catch(error => console.error('Error fetching data:', error))
      .finally(() => {
        isLoading = false;
        toggleLoading(false);
      });
  }
  
  function updateTable() {
    const tableBody = document.getElementById('table-body');
    // Clear existing table data
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
    
    tableData.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function sortTable(columnIndex, dataType) {
    // Determine the sorting direction
    if (lastSortedColumn === columnIndex) {
      isAscending = !isAscending;
    } else {
      isAscending = true;
    }
    lastSortedColumn = columnIndex;
  
    // Sort `tableData`
    tableData.sort((a, b) => {
      let cellA = a[columnIndex];
      let cellB = b[columnIndex];
  
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
  
    // Update the table
    updateTable();
  
    // Update arrows in table headers
    const headerCells = document.getElementById('table-header').children;
    Array.from(headerCells).forEach((cell, index) => {
      cell.innerHTML = cell.innerHTML.replace(/ (↑|↓)$/, ''); // Remove existing arrow
      if (index === columnIndex) {
        cell.innerHTML += isAscending ? ' ↑' : ' ↓';
      }
    });
  }
  
  function toggleLoading(isLoading) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (isLoading) {
      loadingOverlay.classList.remove('hidden');
    } else {
      loadingOverlay.classList.add('hidden');
    }
  }

