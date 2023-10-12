const indexerToken = "";
const indexerServer = "https://testnet-idx.voi.nodly.io/";
const indexerPort = "";

const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

async function getBlacklistFromApi() {
    const response = await fetch('https://analytics.testnet.voi.nodly.io/v0/consensus/ballast');
    const data = await response.json();
    
    // Extract account addresses from 'bparts' and 'bots'
    const bpartsAddresses = Object.keys(data.bparts);
    const botsAddresses = Object.keys(data.bots);

    // Combine and return the addresses
    return [...bpartsAddresses, ...botsAddresses];
}


async function getBlacklistFromJson() {
    const response = await fetch('blacklist.json');
    const data = await response.json();

    return data; // directly return the array of addresses
}

async function getCombinedBlacklist() {
    const apiBlacklist = await getBlacklistFromApi();
    const jsonBlacklist = await getBlacklistFromJson();
    return [...new Set([...apiBlacklist, ...jsonBlacklist])]; // Combine and deduplicate
}

async function getAllAccounts() {
    let accounts = [];
    let nextToken = '';
    const minBalance = 1000 * 1e6; // Minimum balance in micro units

    while (nextToken !== undefined) {
        // Fetch a page of results
        const response = await indexerClient.searchAccounts()
            .currencyGreaterThan(minBalance)
            .nextToken(nextToken)
            .do();

        // Concatenate this set of results
        accounts = accounts.concat(response.accounts);

        // Get the token for the next set of results
        nextToken = response['next-token'];
    }

    return accounts;
}
    
async function displayAccounts() {

    try {

        const allAccounts = await getAllAccounts();
        const blacklist = await getCombinedBlacklist();

        const filteredAccounts = allAccounts.filter(account => !blacklist.includes(account.address));

        filteredAccounts.sort((a, b) => b.amount - a.amount);

        // Assign ranks
        filteredAccounts.forEach((account, index) => {
            account.rank = index + 1; // +1 because indices are zero-based
        });

        const accountsTableBody = document.getElementById('accountsTable').getElementsByTagName('tbody')[0];
        const playerCountElement = document.getElementById('playerCount');

        // Updated to handle the flat array of accounts
        if (filteredAccounts && filteredAccounts.length > 0) {
            playerCountElement.innerText = `Number of Players: ${filteredAccounts.length}`;

            filteredAccounts.forEach(account => {
                const scoreInTokens = account.amount / 1e6; // convert from micro-units

                let newRow = accountsTableBody.insertRow();
                let rankCell = newRow.insertCell(0);
                let addressCell = newRow.insertCell(1);
                let scoreCell = newRow.insertCell(2);
                
                rankCell.appendChild(document.createTextNode(account.rank));
                addressCell.appendChild(document.createTextNode(account.address));
                scoreCell.appendChild(document.createTextNode(scoreInTokens));
            });
        }
    } catch (e) {
        console.error(e);
        // Handle error
    }
}

function initializeDataTable() {
    $(document).ready(function() {
        const dataTable = $('#accountsTable').DataTable({
            "paging": true,
            "searching": true,
            "order": [[ 2, "desc" ]], // default sort by the 'Score' column, descending
            "pageLength": 100, // set default number of rows to display
        });

        $('#searchBar').on('keyup', function() {
            dataTable.search(this.value).draw();
        });
    });
}




displayAccounts().then(() => {
    initializeDataTable();
});


