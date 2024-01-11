// Configure Algorand client (replace with your actual configuration)
const algodClient = new algosdk.Algodv2('Your-Algod-Token', 'https://testnet-api.voi.nodly.io', 'Your-Algod-Port');

// Define variables
let tableData = [];

// Fetch data from Nodly API and balances
async function fetchData() {
    const nodlyEndpoint = 'https://analytics.testnet.voi.nodly.io/v0/network/nodes/hour';
    try {
        const response = await fetch(nodlyEndpoint);
        const data = await response.json();
        tableData = data.data;

        // Filter out rows with version '3.21.0'
        tableData = data.data.filter(row => {
            // Assuming version is in the last column
            const versionIndex = data.meta.findIndex(m => m.name === "ver");
            const version = row[versionIndex];
            return version !== "3.21.0" && version !== "";
        });

        tableHeaders = data.meta.map(m => m.name); // Extract headers from meta data
        tableHeaders.push('Total Balance'); // Add the new "Total Balance" column header
        await fetchBalances();

        // Sort tableData by balance in descending order
        // Assuming the balance is in the last column
        tableData.sort((a, b) => parseFloat(b[b.length - 1]) - parseFloat(a[a.length - 1]));

        // Calculate the total balance
    let totalBalance = tableData.reduce((sum, row) => {
        // Assuming the balance is in the last column
        return sum + parseFloat(row[row.length - 1]);
    }, 0);

    // Update the total balance on the page
    document.getElementById('total-balance').textContent = `Total Balance: ${totalBalance.toFixed(6)} Algos`;

        updateTable();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


// Fetch balances for each address
async function fetchBalances() {
    for (let row of tableData) {
        // Assuming the address is in the 12th column (index 11)
        const addresses = row[11];
        let totalBalance = 0;
        for (const address of addresses) {
            const balance = await fetchBalance(address);
            totalBalance += balance;
        }
        row.push(totalBalance); // Add total balance to the row
    }
}

// Fetch balance for a single address
async function fetchBalance(address) {
    try {
        const accountInfo = await algodClient.accountInformation(address).do();
         // Convert microAlgos to Algos and format to 6 decimal places
         return accountInfo.amount / 1000000;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 0; // Return 0 or any default value in case of an error
    }
}

// Update the HTML table
function updateTable() {
    const headerRow = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');

    // Clear existing table data
    headerRow.innerHTML = '';
    tableBody.innerHTML = '';

    // Add headers dynamically
    tableHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Add rows
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            if (index === 11 && Array.isArray(cell)) { // Special handling for the addresses array
                td.innerHTML = cell.join(', ');
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Call fetchData on load
window.addEventListener('load', fetchData);
