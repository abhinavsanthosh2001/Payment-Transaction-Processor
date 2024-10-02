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

async function fetchAccounts(page) {
    currentPage.accounts = page;
    try {
        const response = await fetch(`http://localhost:3001/cards?page=${page}&limit=10`);
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
        const response = await fetch(`http://localhost:3001/collections?page=${page}&limit=10`);
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
        const response = await fetch(`http://localhost:3001/bad-transactions?page=${page}&limit=10`);
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
        columns.forEach(column => {
            const cell = document.createElement('td');
            cell.textContent = item[column];
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}

function updatePagination(section, page, pages) {
    currentPage[section] = page;
    totalPages[section] = pages;
    document.getElementById(`${section}PageInfo`).textContent = `Page ${page} of ${pages}`;
    document.getElementById(`prev${capitalize(section)}PageBtn`).disabled = page <= 1;
    document.getElementById(`next${capitalize(section)}PageBtn`).disabled = page >= pages;
}

function changePage(section, delta) {
    const newPage = currentPage[section] + delta;
    if (newPage > 0 && newPage <= totalPages[section]) {
        if (section === 'accounts') {
            fetchAccounts(newPage);
        } else if (section === 'collections') {
            fetchCollections(newPage);
        } else if (section === 'badTransactions') {
            fetchBadTransactions(newPage);
        }
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}