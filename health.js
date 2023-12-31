let currentEndpoint = null;
let lastSortedColumn = -1;
let isAscending = true;
let tableData = [];
let isLoading = false;
let NFDs = [];
let aggregatedNFDs = [];


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



async function getNFD(data) {
  let addressChunks = [];
  let chunkSize = 20;

  for (let i = 0; i < data.length; i += chunkSize) {
    addressChunks.push(data.slice(i, i + chunkSize));
  }

  const allFetches = addressChunks.map((addressChunk, index) => {
    let url = "https://api.nf.domains/nfd/lookup?";
    let params = new URLSearchParams();

    addressChunk.forEach(address => {
      params.append("address", address);
    });

    params.append("view", "tiny");
    params.append("allowUnverified", "true");

    url += params.toString();

    return fetch(url)
      .then(response => response.json())
      .then(additionalData => {
        Object.entries(additionalData).forEach(([key, value]) => {
          const replacementValue = value.name;
          aggregatedNFDs.push({ key, replacementValue });
        });
      })
      .catch(error => console.error("Error fetching additional data:", error));
  });

  await Promise.all(allFetches);
}

async function fetchData(endpoint) {
  if (isLoading) return;
  isLoading = true;
  toggleLoading(true);

  const fullEndpoint = `https://analytics.testnet.voi.nodly.io${endpoint}`;
  try {
    const response = await fetch(fullEndpoint);
    const data = await response.json();

    tableData = data.data;

    let addressesColumnIndex = null;
    for (let i = 0; i < data.meta.length; i++) {
      if (data.meta[i].name === "addresses") {
        addressesColumnIndex = i;
        break;
      }
    }

    if (addressesColumnIndex !== null) {
      const allAddresses = tableData.map(row => row[addressesColumnIndex]);
      aggregatedNFDs = [];
      await (allAddresses.every(Array.isArray) ? getNFD(allAddresses.flat()) : getNFD(allAddresses));
    }

    // Now that NFDs are fetched, update the table
    updateTable();

    document.getElementById("node-total-count").textContent = tableData.length;

    const headerRow = document.getElementById('table-header');
    headerRow.innerHTML = '';
    data.meta.forEach((col, index) => {
      const th = document.createElement('th');
      th.textContent = col.name;
      th.setAttribute('data-type', col.type);
      headerRow.appendChild(th);
    });

  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isLoading = false;
    toggleLoading(false);
  }
}

function updateTable() {

// Remove duplicates
const map = new Map();
aggregatedNFDs.forEach(item => {
  // Use the 'key' property of each object as a unique identifier
  if (!map.has(item.key)) {
    map.set(item.key, item);
  }
});
aggregatedNFDs = Array.from(map.values());

  const tableBody = document.getElementById('table-body');
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }

  tableData.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach((cell, index) => {
      const td = document.createElement('td');

      if (index === 11 && Array.isArray(cell)) {
        // Handle case where the cell is an array
        let newHTML = cell.join(', '); // convert array to string for example

        aggregatedNFDs.forEach(({ key, replacementValue }) => {
          if (newHTML.includes(key)) {
            newHTML = newHTML.replace(
              key,
              `<a href="https://voitest-explorer.k1-fi.a-wallet.net/explorer/account/${key}/transactions" class="replacement">${replacementValue}</a> <span class="hidden-address">${key}</span>`
            );
          }
        });

        td.innerHTML = newHTML;

      } else if (Array.isArray(cell)) {
        td.innerHTML = cell.map(addr => `<span>${addr}</span>`).join(', ');

        if (cell.length > 1) {
          td.classList.add('multiple-addresses');
        }
      } else {
        td.textContent = cell;
      }

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
    if (dataType.includes('Int64') || dataType.includes('Float64')) {
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

function randomItemFromArray(items) {
  return items[Math.floor(Math.random()*items.length)];
};

function pickWinner(table) {
  let goodPotential = [];
  table.forEach(row => {
    if (row[2] > 2) {
      goodPotential.push(row);
    };
  })
  return randomItemFromArray(goodPotential);
}