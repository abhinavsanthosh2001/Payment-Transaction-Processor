const fs = require('fs');
const csvParser = require('csv-parser');
const multer = require('multer');
const {
    transactions,
    cards,
    badTransactions,
    processTransaction,
    paginate
} = require('../models/transactionModel');

const upload = multer({ dest: 'uploads/' });

const uploadFile = (req, res) => {
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
};

const getCards = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedCards = cards.slice(startIndex, endIndex).map(card => ({
        accountName: card.accounts.join(", "),
        cardNumber: card.cardNumber,
        balance: card.balance
    }));

    res.json({
        items: paginatedCards,
        page,
        totalPages: Math.ceil(cards.length / limit)
    });
};

const getCollections = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const negativeBalanceAccounts = cards.filter(card => card.balance < 0)
        .flatMap(card => card.accounts.map(account => ({
            accountName: account,
            cardNumber: card.cardNumber,
            balance: card.balance
        })));

    const paginatedResult = paginate(negativeBalanceAccounts, page, limit);

    res.json({
        ...paginatedResult
    });
};

const getBadTransactions = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const paginatedResult = paginate(badTransactions, page, limit);

    res.json({
        ...paginatedResult
    });
};

const resetSystem = (req, res) => {
    transactions.length = 0;
    cards.length = 0;
    badTransactions.length = 0;
    console.log('System reset successfully.');
    res.status(200).send('System reset successfully.');
};

module.exports = {
    upload,
    uploadFile,
    getCards,
    getCollections,
    getBadTransactions,
    resetSystem
};