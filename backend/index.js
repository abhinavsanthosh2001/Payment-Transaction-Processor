const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the cors middleware

dotenv.config();  // Load environment variables from .env file

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// MongoDB connection
mongoose.connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    accountName: String,
    cardNumber: String,
    transactionAmount: Number,
    transactionType: String,
    description: String,
    targetCardNumber: String
});

// Card Schema
const cardSchema = new mongoose.Schema({
    cardNumber: { type: String, required: true },
    balance: { type: Number, required: true },
    accounts: [{ type: String }]
});


// Create Transaction model
const Transaction = mongoose.model('Transaction', transactionSchema);
// Create Card model
const Card = mongoose.model('Card', cardSchema);

// In-memory data structure to store bad transactions
const badTransactions = [];

// Function to get accounts with cards and balances
async function processTransaction(row) {
    const { accountName, cardNumber, transactionAmount, transactionType, description, targetCardNumber } = row;

    // Check for missing required fields
    if (!accountName || !cardNumber || !transactionAmount || !transactionType) {
        console.error('Bad transaction (missing fields):', row);
        badTransactions.push(row);  // Store bad transactions in memory
        return;  // Skip bad transactions
    }

    // Check for valid transaction types
    const validTransactionTypes = ['Credit', 'Debit', 'Transfer'];
    if (!validTransactionTypes.includes(transactionType)) {
        console.error('Bad transaction (invalid transaction type):', row);
        badTransactions.push(row);  // Store bad transactions in memory
        return;  // Skip bad transactions
    }

    // Check for valid card number (16 digits)
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(cardNumber)) {
        console.error('Bad transaction (invalid card number):', row);
        badTransactions.push(row);  // Store bad transactions in memory
        return;  // Skip bad transactions
    }

    // Check for target card number if transaction type is Transfer
    if (transactionType === 'Transfer' && (!targetCardNumber || !cardNumberRegex.test(targetCardNumber))) {
        console.error('Bad transaction (missing or invalid target card number for transfer):', row);
        badTransactions.push(row);  // Store bad transactions in memory
        return;  // Skip bad transactions
    }

    // Validate and sanitize transactionAmount
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount)) {
        console.error('Bad transaction (invalid transaction amount):', row);
        badTransactions.push(row);  // Store bad transactions in memory
        return;  // Skip bad transactions
    }

    // Save the transaction
    const transaction = new Transaction({ ...row, transactionAmount: amount });
    await transaction.save();  // Use await here to handle the async operation

    // Update or create the card data using findOneAndUpdate
    let cardUpdate;
    if (transactionType === 'Debit') {
        cardUpdate = { $inc: { balance: -amount }, $addToSet: { accounts: accountName } };
    } else if (transactionType === 'Credit') {
        cardUpdate = { $inc: { balance: amount }, $addToSet: { accounts: accountName } };
    } else if (transactionType === 'Transfer') {
        cardUpdate = { $inc: { balance: -amount }, $addToSet: { accounts: accountName } };

        // Handle target card for transfer
        if (targetCardNumber) {
            await Card.findOneAndUpdate(
                { cardNumber: targetCardNumber },
                { $inc: { balance: amount }, $addToSet: { accounts: [] } },
                { upsert: true, new: true }  // Create target card if not found
            );
        }
    }

    // Update or insert the source card
    await Card.findOneAndUpdate(
        { cardNumber },  // Query condition to find the card
        cardUpdate,      // Update balance and accounts
        { upsert: true, new: true }  // Create a new card if not found
    );
}


async function getAccountsWithCardsAndBalances() {
    try {
        const aggregationPipeline = [
            { $unwind: "$accounts" }, // Unwind the accounts array
            {
                $group: {
                    _id: "$accounts", // Group by account name
                    cards: {
                        $push: {
                            cardNumber: "$cardNumber",
                            balance: "$balance"
                        }
                    }
                }
            },
            {
                $project: {
                    accountName: "$_id",
                    cards: 1,
                    _id: 0
                }
            }
        ];

        const accountsWithCardsAndBalances = await Card.aggregate(aggregationPipeline);
        //console.log(accountsWithCardsAndBalances);
        return accountsWithCardsAndBalances;
    } catch (err) {
        console.error('Error fetching accounts with cards and balances:', err);
    }
}

// Function to get accounts with cards having balance less than 0
async function getAccountsWithNegativeBalances() {
    try {
        const aggregationPipeline = [
            { $match: { balance: { $lt: 0 } } }, // Filter cards with balance less than 0
            { $unwind: "$accounts" }, // Unwind the accounts array
            {
                $group: {
                    _id: "$accounts", // Group by account name
                    cards: {
                        $push: {
                            cardNumber: "$cardNumber",
                            balance: "$balance"
                        }
                    }
                }
            },
            {
                $project: {
                    accountName: "$_id",
                    cards: 1,
                    _id: 0
                }
            }
        ];

        const accountsWithNegativeBalances = await Card.aggregate(aggregationPipeline);
        //console.log(accountsWithNegativeBalances);
        return accountsWithNegativeBalances;
    } catch (err) {
        console.error('Error fetching accounts with negative balances:', err);
    }
}

// Route to upload and strictly populate the Transaction schema
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Received file:', req.file);

    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            headers: ['accountName', 'cardNumber', 'transactionAmount', 'transactionType', 'description', 'targetCardNumber']
        }))
        .on('data', async (data) => {
            try {
                //console.log(data);
                //console.log("HI");
                 processTransaction(data); // Process each row immediately
            } catch (err) {
                console.error('Error processing row:', data, err);
            }
        })
        .on('end', () => {
            res.status(201).send({
                message: 'CSV data successfully uploaded and processed.',
                badTransactions: badTransactions // Include bad transactions in the response
            });
            fs.unlinkSync(req.file.path); // Remove the uploaded file
            console.log('Uploaded file removed'); // Log file removal
        })
        .on('error', (err) => {
            console.error('Error processing CSV file:', err);
            res.status(500).send('Error processing CSV file.');
        });
});

// Route to get all cards
app.get('/cards', async (req, res) => {
    try {
        const cards = await Card.find();
        res.json(cards);
    } catch (err) {
        console.error('Error fetching cards:', err);
        res.status(500).send('Error fetching cards.');
    }
});

// Route to get accounts with cards having balance less than 0
app.get('/accounts-with-negative-balances', async (req, res) => {
    try {
        const accountsWithNegativeBalances = await getAccountsWithNegativeBalances();
        res.json(accountsWithNegativeBalances);
    } catch (err) {
        console.error('Error fetching accounts with negative balances:', err);
        res.status(500).send('Error fetching accounts with negative balances.');
    }
});

// Route to get all transactions
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).send('Error fetching transactions.');
    }
});

// Route to get all bad transactions
app.get('/bad-transactions', (req, res) => {
    res.json(badTransactions);
});

// Route to reset the system
app.post('/reset', async (req, res) => {
    try {
        // Clear all collections
        await Transaction.deleteMany({});
        await Card.deleteMany({});

        // Clear the in-memory bad transactions array
        badTransactions.length = 0;
        console.log('System reset successfully.');
        res.status(200).send('System reset successfully.');
    } catch (err) {
        console.error('Error resetting the system:', err);
        res.status(500).send('Error resetting the system.');
    }
});


// Route to get account names, card numbers, and balances
app.get('/cards-info', async (req, res) => {
    try {
        const cardsInfo = await Card.aggregate([
            { $unwind: "$accounts" },
            {
                $project: {
                    _id: 0,
                    accountName: "$accounts",
                    cardNumber: 1,
                    balance: 1
                }
            }
        ]);
        res.json(cardsInfo);
    } catch (err) {
        console.error('Error fetching cards info:', err);
        res.status(500).send('Error fetching cards info.');
    }
});

// Route to get account names with card numbers having a balance of less than 0
app.get('/collections', async (req, res) => {
    try {
        const negativeBalanceAccounts = await Card.aggregate([
            { $match: { balance: { $lt: 0 } } },
            { $unwind: "$accounts" },
            {
                $project: {
                    _id: 0,
                    accountName: "$accounts",
                    cardNumber: 1,
                    balance: 1
                }
            }
        ]);
        res.json(negativeBalanceAccounts);
    } catch (err) {
        console.error('Error fetching accounts with negative balance:', err);
        res.status(500).send('Error fetching accounts with negative balance.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});