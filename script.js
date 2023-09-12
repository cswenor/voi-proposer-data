let lastSortedColumn = null;
let isAscending = true;
let NFDs = [];

function updateSenderCell(senderKey, replacementValue) {
    const table = document.getElementById("dataTable");
    const rows = Array.from(table.rows).slice(1); // Skip the header row

    rows.forEach(row => {
        const senderCell = row.cells[0]; // Assuming "Sender" is the first column
        if (senderCell.textContent === senderKey) {
            senderCell.innerHTML = `<a href="https://app.dappflow.org/explorer/account/${senderKey}/transactions" class="replacement">${replacementValue}</a> 
                                    <span class="hidden-address">${senderKey}</span>`;
        }
    });
}
function getNFD(data) {
    let addressChunks = [];
    let chunkSize = 20;

  
    for (let i = 0; i < data.length; i += chunkSize) {
      addressChunks.push(data.slice(i, i + chunkSize));
    }
  
    addressChunks.forEach((addressChunk, index) => {
      let url = "https://api.nf.domains/nfd/lookup?";
      let params = new URLSearchParams();
  
      addressChunk.forEach(address => {
        params.append("address", address[0]); // Assuming the first element is the address
      });
  
      params.append("view", "tiny");
      params.append("allowUnverified", "true");
      
      url += params.toString();
  
      fetch(url)
        .then(response => response.json())
        .then(additionalData => {
            Object.entries(additionalData).forEach(([key, value]) => {
                const replacementValue = value.name;  // Assuming you get the name from the value
                updateSenderCell(key, replacementValue);
                NFDs.push(value.name);
            });
            // ... Your existing code ...
        })
        .catch(error => console.error("Error fetching additional data:", error));
    });
  }
  
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

function randomItemFromArry(items) {
    return items[Math.floor(Math.random()*items.length)];
};

// Function to fetch data from API and populate table
async function fetchData() {
    let nodeAPI;
    if (hour24) {
        nodeAPI = "https://analytics.testnet.voi.nodly.io/v0/consensus/accounts/24";
    } else {
        nodeAPI = "https://analytics.testnet.voi.nodly.io/v0/consensus/accounts/all";
    }
  
    try {
        const response = await fetch(nodeAPI);
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
            dataRow.forEach((cellData, index) => {
                const td = document.createElement("td");
                if (index === 0) { // Assuming "Sender" is the first column
                    td.innerHTML = `<a href="https://app.dappflow.org/explorer/account/${cellData}/transactions">${cellData}</a>`;
                } else {
                    td.textContent = cellData;
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        getNFD(data.data);

        document.getElementById('proposer-count').textContent = data.data.length;

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// Invoke fetchData when the page loads
window.addEventListener("DOMContentLoaded", fetchData);
