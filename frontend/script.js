document.getElementById('uploadBtn').addEventListener('click', uploadFile);
document.getElementById('resetBtn').addEventListener('click', resetSystem);
document.getElementById('accountsBtn').addEventListener('click', fetchAccounts);
document.getElementById('collectionsBtn').addEventListener('click', fetchCollections);
document.getElementById('badTransactionsBtn').addEventListener('click', fetchBadTransactions);

// 1) Upload API
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:3001/upload', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json(); // Get the bad transactions if any
        if (result.badTransactions.length > 0) {
            alert('File uploaded with some bad transactions.');
        } else {
            alert('File uploaded successfully.');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

// 2) Reset API
async function resetSystem() {
    try {
        const response = await fetch('http://localhost:3001/reset', {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        alert('System reset successfully.');
    } catch (error) {
        console.error('Error resetting system:', error);
    }
}

// 3) Fetch account names, card numbers, and balances (API: /cards-info)
async function fetchAccounts() {
    try {
        const response = await fetch('http://localhost:3001/cards'); // Correct endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('accountsTable', data, ['accountName', 'cardNumber', 'balance']);
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

// 4) Collections (Fetch accounts with negative balances)
async function fetchCollections() {
    try {
        const response = await fetch('http://localhost:3001/collections'); // Correct endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('collectionsTable', data, ['accountName', 'cardNumber', 'balance']);
    } catch (error) {
        console.error('Error fetching collections:', error);
    }
}

// 5) Fetch bad transactions
async function fetchBadTransactions() {
    try {
        const response = await fetch('http://localhost:3001/bad-transactions'); // Correct endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('badTransactionsTable', data, ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']);
    } catch (error) {
        console.error('Error fetching bad transactions:', error);
    }
}

function populateTable(tableId, data, columns) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = ''; // Clear existing data

    data.forEach(item => {
        // Handle accounts table separately
        if (tableId === 'accountsTable') {
            // For each account associated with a card, create a new row
            item.accounts.forEach(accountName => {
                const row = document.createElement('tr');
                
                columns.forEach(column => {
                    const cell = document.createElement('td');
                    
                    // Populate the accountName column separately
                    if (column === 'accountName') {
                        cell.textContent = accountName;
                    } else {
                        // For other columns (e.g., cardNumber, balance), use the card item data
                        cell.textContent = item[column];
                    }
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            });
        } else {
            // For other tables, add data normally
            const row = document.createElement('tr');
            columns.forEach(column => {
                const cell = document.createElement('td');
                cell.textContent = item[column];
                row.appendChild(cell);
            });
            tableBody.appendChild(row);
        }
    });
}
 /// Now using in-memory data structures