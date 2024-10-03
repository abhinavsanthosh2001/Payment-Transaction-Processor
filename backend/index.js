// const express = require('express');
// const multer = require('multer');
// const csvParser = require('csv-parser');
// const fs = require('fs');
// const dotenv = require('dotenv');
// const cors = require('cors');

// dotenv.config();

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json());
// const upload = multer({ dest: 'uploads/' });

// const transactions = [];
// const cards = [];
// const badTransactions = [];

// // Process transaction logic remains the same
// function processTransaction(row) {
//     const { accountName, cardNumber, transactionAmount, transactionType, description, targetCardNumber } = row;

//     if (!accountName || !cardNumber || !transactionAmount || !transactionType) {
//         console.error('Bad transaction (missing fields):', row);
//         badTransactions.push(row);
//         return;
//     }

//     const validTransactionTypes = ['Credit', 'Debit', 'Transfer'];
//     if (!validTransactionTypes.includes(transactionType)) {
//         console.error('Bad transaction (invalid transaction type):', row);
//         badTransactions.push(row);
//         return;
//     }

//     const cardNumberRegex = /^\d{16}$/;
//     if (!cardNumberRegex.test(cardNumber)) {
//         console.error('Bad transaction (invalid card number):', row);
//         badTransactions.push(row);
//         return;
//     }

//     if (transactionType === 'Transfer' && (!targetCardNumber || !cardNumberRegex.test(targetCardNumber))) {
//         console.error('Bad transaction (missing or invalid target card number for transfer):', row);
//         badTransactions.push(row);
//         return;
//     }

//     const amount = parseFloat(transactionAmount);
//     if (isNaN(amount)) {
//         console.error('Bad transaction (invalid transaction amount):', row);
//         badTransactions.push(row);
//         return;
//     }

//     transactions.push({ ...row, transactionAmount: amount });

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

//         let targetCard = cards.find(c => c.cardNumber === targetCardNumber);
//         if (!targetCard) {
//             targetCard = { cardNumber: targetCardNumber, balance: 0, accounts: [] };
//             cards.push(targetCard);
//         }
//         targetCard.balance += amount;
//     }
// }

// // File upload and processing
// app.post('/upload', upload.single('file'), (req, res) => {
//     console.log('Received file:', req.file);
//     fs.createReadStream(req.file.path)
//         .pipe(csvParser({
//             headers: ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']
//         }))
//         .on('data', (data) => {
//             try {
//                 processTransaction(data);
//             } catch (err) {
//                 console.error('Error processing row:', data, err);
//             }
//         })
//         .on('end', () => {
//             res.status(201).send({
//                 message: 'CSV data successfully uploaded and processed.',
//                 badTransactions: badTransactions
//             });
//             fs.unlinkSync(req.file.path);
//             console.log('Uploaded file removed');
//         })
//         .on('error', (err) => {
//             console.error('Error processing CSV file:', err);
//             res.status(500).send('Error processing CSV file.');
//         });
// });

// // Helper function for pagination
// function paginate(array, page, limit) {
//     const totalItems = array.length;
//     const totalPages = Math.ceil(totalItems / limit);
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;

//     return {
//         page,
//         totalPages,
//         totalItems,
//         items: array.slice(startIndex, endIndex),
//     };
// }

// // Paginated /cards endpoint
// app.get('/cards', (req, res) => {
//     const page = parseInt(req.query.page) || 1; // Default to page 1
//     const limit = parseInt(req.query.limit) || 5; // Default limit

//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;

//     // Prepare data with account names for each card
//     const paginatedCards = cards.slice(startIndex, endIndex).map(card => ({
//         accountName: card.accounts.join(", "), // Join multiple account names if needed
//         cardNumber: card.cardNumber,
//         balance: card.balance
//     }));

//     res.json({
//         items: paginatedCards,
//         page,
//         totalPages: Math.ceil(cards.length / limit)
//     });
// });


// // Paginated /collections endpoint
// app.get('/collections', (req, res) => {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;

//     const negativeBalanceAccounts = cards.filter(card => card.balance < 0)
//         .flatMap(card => card.accounts.map(account => ({
//             accountName: account,
//             cardNumber: card.cardNumber,
//             balance: card.balance
//         })));

//     const paginatedResult = paginate(negativeBalanceAccounts, page, limit);

//     res.json({
//         ...paginatedResult
//     });
// });

// // Paginated /bad-transactions endpoint
// app.get('/bad-transactions', (req, res) => {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;

//     const paginatedResult = paginate(badTransactions, page, limit);

//     res.json({
//         ...paginatedResult
//     });
// });

// // Reset system data
// app.post('/reset', (req, res) => {
//     transactions.length = 0;
//     cards.length = 0;
//     badTransactions.length = 0;
//     console.log('System reset successfully.');
//     res.status(200).send('System reset successfully.');
// });

// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const transactionRoutes = require('./routes/transactionRoutes');

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use(transactionRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});