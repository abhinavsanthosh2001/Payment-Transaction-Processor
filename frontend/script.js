document.getElementById('uploadBtn').addEventListener('click', uploadFile);
document.getElementById('resetBtn').addEventListener('click', resetSystem);
document.getElementById('accountsBtn').addEventListener('click', () => fetchAccounts(1));
document.getElementById('collectionsBtn').addEventListener('click', () => fetchCollections(1));
document.getElementById('badTransactionsBtn').addEventListener('click', () => fetchBadTransactions(1));
document.getElementById('prevAccountsPageBtn').addEventListener('click', () => changePage('accounts', -1));
document.getElementById('nextAccountsPageBtn').addEventListener('click', () => changePage('accounts', 1));
document.getElementById('prevCollectionsPageBtn').addEventListener('click', () => changePage('collections', -1));
document.getElementById('nextCollectionsPageBtn').addEventListener('click', () => changePage('collections', 1));
document.getElementById('prevBadTransactionsPageBtn').addEventListener('click', () => changePage('badTransactions', -1));
document.getElementById('nextBadTransactionsPageBtn').addEventListener('click', () => changePage('badTransactions', 1));

const API_SECRET_TOKEN = '9f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b'; 

let currentPage = {
    accounts: 1,
    collections: 1,
    badTransactions: 1
};
let totalPages = {
    accounts: 1,
    collections: 1,
    badTransactions: 1
};

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
            headers: {
                'Authorization': `Bearer ${API_SECRET_TOKEN}`
            },
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
        const response = await fetch('http://localhost:3001/reset', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_SECRET_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        alert('System reset successfully.');
        clearDisplay(); // Clear the display after resetting the system
    } catch (error) {
        console.error('Error resetting system:', error);
    }
}

async function fetchAccounts(page) {
    currentPage.accounts = page;
    try {
        const response = await fetch(`http://localhost:3001/cards?page=${page}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${API_SECRET_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Accounts Data:', data); // Debugging: Log the fetched data
        populateTable('accountsTable', data.items, ['accountName', 'cardNumber', 'balance']);
        updatePagination('accounts', data.page, data.totalPages);
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

async function fetchCollections(page) {
    currentPage.collections = page;
    try {
        const response = await fetch(`http://localhost:3001/collections?page=${page}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${API_SECRET_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('collectionsTable', data.items, ['accountName', 'cardNumber', 'balance']);
        updatePagination('collections', data.page, data.totalPages);
    } catch (error) {
        console.error('Error fetching collections:', error);
    }
}

async function fetchBadTransactions(page) {
    currentPage.badTransactions = page;
    try {
        const response = await fetch(`http://localhost:3001/bad-transactions?page=${page}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${API_SECRET_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable('badTransactionsTable', data.items, ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']);
        updatePagination('badTransactions', data.page, data.totalPages);
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
        columns.forEach(col => {
            const cell = document.createElement('td');
            cell.textContent = item[col] || 'N/A'; // Fallback for missing properties
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}

function updatePagination(type, current, total) {
    totalPages[type] = total;
    document.getElementById(`${type}PageInfo`).textContent = `Page ${current} of ${total}`;
    document.getElementById(`prev${capitalize(type)}PageBtn`).disabled = current === 1;
    document.getElementById(`next${capitalize(type)}PageBtn`).disabled = current === total;
}

function clearDisplay() {
    // Clear the tables
    document.getElementById('accountsTable').querySelector('tbody').innerHTML = '';
    document.getElementById('collectionsTable').querySelector('tbody').innerHTML = '';
    document.getElementById('badTransactionsTable').querySelector('tbody').innerHTML = '';
}

function changePage(type, direction) {
    const newPage = currentPage[type] + direction;
    if (newPage > 0 && newPage <= totalPages[type]) {
        if (type === 'accounts') fetchAccounts(newPage);
        else if (type === 'collections') fetchCollections(newPage);
        else if (type === 'badTransactions') fetchBadTransactions(newPage);
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initial fetch to populate the first page of each section
fetchAccounts(1);
fetchCollections(1);
fetchBadTransactions(1);