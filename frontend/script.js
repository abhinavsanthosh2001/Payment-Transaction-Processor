document.getElementById('uploadBtn').addEventListener('click', uploadFile);
document.getElementById('resetBtn').addEventListener('click', resetSystem);
document.getElementById('accountsBtn').addEventListener('click', () => fetchAccounts(1));
document.getElementById('collectionsBtn').addEventListener('click', () => fetchCollections(1));
document.getElementById('badTransactionsBtn').addEventListener('click', () => fetchBadTransactions(1));
document.getElementById('prevPageBtn').addEventListener('click', () => changePage(-1));
document.getElementById('nextPageBtn').addEventListener('click', () => changePage(1));

let currentPage = 1;
let totalPages = 1;
let currentFetchFunction = fetchAccounts; // Default fetch function for pagination

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
        const result = await response.json();
        console.log(result.message);
        if (result.badTransactions.length > 0) {
            console.error('Bad Transactions:', result.badTransactions);
        }
        alert('File uploaded successfully.');
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

async function resetSystem() {
    try {
        const response = await fetch('http://localhost:3001/reset', { method: 'POST' });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        alert('System reset successfully.');
    } catch (error) {
        console.error('Error resetting system:', error);
    }
}

// Fetch accounts with cards and balances
async function fetchAccounts(page) {
    try {
        const response = await fetch(`http://localhost:3001/cards?page=${page}&limit=10`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('accountsTable', data.items, ['accountName', 'cardNumber', 'balance']);
        updatePagination(data.page, data.totalPages);
        currentFetchFunction = fetchAccounts; // Set the fetch function for pagination
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

// Fetch accounts with negative balances
async function fetchCollections(page) {
    try {
        const response = await fetch(`http://localhost:3001/collections?page=${page}&limit=10`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('collectionsTable', data.items, ['accountName', 'cardNumber', 'balance']);
        updatePagination(data.page, data.totalPages);
        currentFetchFunction = fetchCollections; // Set the fetch function for pagination
    } catch (error) {
        console.error('Error fetching collections:', error);
    }
}

// Fetch bad transactions
async function fetchBadTransactions(page) {
    try {
        const response = await fetch(`http://localhost:3001/bad-transactions?page=${page}&limit=10`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('badTransactionsTable', data.items, ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']);
        updatePagination(data.page, data.totalPages);
        currentFetchFunction = fetchBadTransactions; // Set the fetch function for pagination
    } catch (error) {
        console.error('Error fetching bad transactions:', error);
    }
}

function populateTable(tableId, data, columns) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = ''; // Clear existing data

    if (!Array.isArray(data)) {
        console.error('Data is not an array:', data);
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        columns.forEach(column => {
            const cell = document.createElement('td');
            cell.textContent = item[column];
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}

function updatePagination(page, pages) {
    currentPage = page;
    totalPages = pages;
    document.getElementById('pageInfo').textContent = `Page ${page} of ${pages}`;
    document.getElementById('prevPageBtn').disabled = page <= 1;
    document.getElementById('nextPageBtn').disabled = page >= pages;
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage > 0 && newPage <= totalPages) {
        currentFetchFunction(newPage); // Use the currently active fetch function
    }
}