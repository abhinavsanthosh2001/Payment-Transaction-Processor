// const express = require('express');
// const multer = require('multer');
// const csvParser = require('csv-parser');
// const fs = require('fs');
// const dotenv = require('dotenv');
// const cors = require('cors'); // Import the cors middleware

// dotenv.config(); // Load environment variables from .env file

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json());
// // Setup multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// // In-memory data structures
// const transactions = [];
// const cards = [];
// const badTransactions = [];

// // Function to process transaction
// function processTransaction(row) {
//     const { accountName, cardNumber, transactionAmount, transactionType, description, targetCardNumber } = row;

//     // Check for missing required fields
//     if (!accountName || !cardNumber || !transactionAmount || !transactionType) {
//         console.error('Bad transaction (missing fields):', row);
//         badTransactions.push(row); // Store bad transactions in memory
//         return; // Skip bad transactions
//     }

//     // Check for valid transaction types
//     const validTransactionTypes = ['Credit', 'Debit', 'Transfer'];
//     if (!validTransactionTypes.includes(transactionType)) {
//         console.error('Bad transaction (invalid transaction type):', row);
//         badTransactions.push(row); // Store bad transactions in memory
//         return; // Skip bad transactions
//     }

//     // Check for valid card number (16 digits)
//     const cardNumberRegex = /^\d{16}$/;
//     if (!cardNumberRegex.test(cardNumber)) {
//         console.error('Bad transaction (invalid card number):', row);
//         badTransactions.push(row); // Store bad transactions in memory
//         return; // Skip bad transactions
//     }

//     // Check for target card number if transaction type is Transfer
//     if (transactionType === 'Transfer' && (!targetCardNumber || !cardNumberRegex.test(targetCardNumber))) {
//         console.error('Bad transaction (missing or invalid target card number for transfer):', row);
//         badTransactions.push(row); // Store bad transactions in memory
//         return; // Skip bad transactions
//     }

//     // Validate and sanitize transactionAmount
//     const amount = parseFloat(transactionAmount);
//     if (isNaN(amount)) {
//         console.error('Bad transaction (invalid transaction amount):', row);
//         badTransactions.push(row); // Store bad transactions in memory
//         return; // Skip bad transactions
//     }

//     // Save the transaction to in-memory data structure
//     transactions.push({ ...row, transactionAmount: amount });

//     // Update or create the card data
//     let card = cards.find(c => c.cardNumber === cardNumber);
//     if (!card) {
//         card = { cardNumber, balance: 0, accounts: [] };
//         cards.push(card);
//     }

//     if (transactionType === 'Debit') {
//         card.balance -= amount;
//         if (!card.accounts.includes(accountName)) {
//             card.accounts.push(accountName);
//         }
//     } else if (transactionType === 'Credit') {
//         card.balance += amount;
//         if (!card.accounts.includes(accountName)) {
//             card.accounts.push(accountName);
//         }
//     } else if (transactionType === 'Transfer') {
//         card.balance -= amount;
//         if (!card.accounts.includes(accountName)) {
//             card.accounts.push(accountName);
//         }

//         // Handle target card for transfer
//         let targetCard = cards.find(c => c.cardNumber === targetCardNumber);
//         if (!targetCard) {
//             targetCard = { cardNumber: targetCardNumber, balance: 0, accounts: [] };
//             cards.push(targetCard);
//         }
//         targetCard.balance += amount;
//     }
// }

// // Route to upload and process transactions
// app.post('/upload', upload.single('file'), (req, res) => {
//     console.log('Received file:', req.file);

//     fs.createReadStream(req.file.path)
//         .pipe(csvParser({
//             headers: ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']
//         }))
//         .on('data', (data) => {
//             try {
//                 processTransaction(data); // Process each row immediately
//             } catch (err) {
//                 console.error('Error processing row:', data, err);
//             }
//         })
//         .on('end', () => {
//             res.status(201).send({
//                 message: 'CSV data successfully uploaded and processed.',
//                 badTransactions: badTransactions // Include bad transactions in the response
//             });
//             fs.unlinkSync(req.file.path); // Remove the uploaded file
//             console.log('Uploaded file removed'); // Log file removal
//         })
//         .on('error', (err) => {
//             console.error('Error processing CSV file:', err);
//             res.status(500).send('Error processing CSV file.');
//         });
// });

// // Route to get all cards
// app.get('/cards', (req, res) => {
//     res.json(cards);
// });

// // Route to get accounts with cards having balance less than 0
// app.get('/accounts-with-negative-balances', (req, res) => {
//     const accountsWithNegativeBalances = cards.filter(card => card.balance < 0);
//     res.json(accountsWithNegativeBalances);
// });

// // Route to get all transactions
// app.get('/transactions', (req, res) => {
//     res.json(transactions);
// });

// // Route to get all bad transactions
// app.get('/bad-transactions', (req, res) => {
//     res.json(badTransactions);
// });

// // Route to reset the system
// app.post('/reset', (req, res) => {
//     // Clear in-memory data structures
//     transactions.length = 0;
//     cards.length = 0;
//     badTransactions.length = 0;
//     console.log('System reset successfully.');
//     res.status(200).send('System reset successfully.');
// });

// // Route to get account names with card numbers having a balance of less than 0
// app.get('/collections', (req, res) => {
//     const negativeBalanceAccounts = cards
//         .filter(card => card.balance < 0)
//         .flatMap(card => card.accounts.map(account => ({
//             accountName: account,
//             cardNumber: card.cardNumber,
//             balance: card.balance
//         })));
//     res.json(negativeBalanceAccounts);
// });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });


// /// WITH IN-MEMORY Data Structures

const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

const transactions = [];
const cards = [];
const badTransactions = [];

function processTransaction(row) {
    const { accountName, cardNumber, transactionAmount, transactionType, description, targetCardNumber } = row;

    if (!accountName || !cardNumber || !transactionAmount || !transactionType) {
        console.error('Bad transaction (missing fields):', row);
        badTransactions.push(row);
        return;
    }

    const validTransactionTypes = ['Credit', 'Debit', 'Transfer'];
    if (!validTransactionTypes.includes(transactionType)) {
        console.error('Bad transaction (invalid transaction type):', row);
        badTransactions.push(row);
        return;
    }

    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(cardNumber)) {
        console.error('Bad transaction (invalid card number):', row);
        badTransactions.push(row);
        return;
    }

    if (transactionType === 'Transfer' && (!targetCardNumber || !cardNumberRegex.test(targetCardNumber))) {
        console.error('Bad transaction (missing or invalid target card number for transfer):', row);
        badTransactions.push(row);
        return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount)) {
        console.error('Bad transaction (invalid transaction amount):', row);
        badTransactions.push(row);
        return;
    }

    transactions.push({ ...row, transactionAmount: amount });

    let card = cards.find(c => c.cardNumber === cardNumber);
    if (!card) {
        card = { cardNumber, balance: 0, accounts: [] };
        cards.push(card);
    }

    if (transactionType === 'Debit') {
        card.balance -= amount;
        if (!card.accounts.includes(accountName)) {
            card.accounts.push(accountName);
        }
    } else if (transactionType === 'Credit') {
        card.balance += amount;
        if (!card.accounts.includes(accountName)) {
            card.accounts.push(accountName);
        }
    } else if (transactionType === 'Transfer') {
        card.balance -= amount;
        if (!card.accounts.includes(accountName)) {
            card.accounts.push(accountName);
        }

        let targetCard = cards.find(c => c.cardNumber === targetCardNumber);
        if (!targetCard) {
            targetCard = { cardNumber: targetCardNumber, balance: 0, accounts: [] };
            cards.push(targetCard);
        }
        targetCard.balance += amount;
    }
}

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Received file:', req.file);
    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            headers: ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']
        }))
        .on('data', (data) => {
            try {
                processTransaction(data);
            } catch (err) {
                console.error('Error processing row:', data, err);
            }
        })
        .on('end', () => {
            res.status(201).send({
                message: 'CSV data successfully uploaded and processed.',
                badTransactions: badTransactions
            });
            fs.unlinkSync(req.file.path);
            console.log('Uploaded file removed');
        })
        .on('error', (err) => {
            console.error('Error processing CSV file:', err);
            res.status(500).send('Error processing CSV file.');
        });
});

// Pagination parameters: page (default 1) and limit (default 5)
app.get('/cards', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 5; // Default limit

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedCards = cards.slice(startIndex, endIndex);
    res.json(paginatedCards);
});

app.get('/accounts-with-negative-balances', (req, res) => {
    const accountsWithNegativeBalances = cards.filter(card => card.balance < 0);
    res.json(accountsWithNegativeBalances);
});

app.get('/transactions', (req, res) => {
    res.json(transactions);
});

app.get('/bad-transactions', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 5; // Default limit

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedBadTransactions = badTransactions.slice(startIndex, endIndex);
    res.json(paginatedBadTransactions);
});

app.post('/reset', (req, res) => {
    transactions.length = 0;
    cards.length = 0;
    badTransactions.length = 0;
    console.log('System reset successfully.');
    res.status(200).send('System reset successfully.');
});

app.get('/collections', (req, res) => {
    const negativeBalanceAccounts = cards
        .filter(card => card.balance < 0)
        .flatMap(card => card.accounts.map(account => ({
            accountName: account,
            cardNumber: card.cardNumber,
            balance: card.balance
        })));

    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 5; // Default limit

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedCollections = negativeBalanceAccounts.slice(startIndex, endIndex);
    res.json(paginatedCollections);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
