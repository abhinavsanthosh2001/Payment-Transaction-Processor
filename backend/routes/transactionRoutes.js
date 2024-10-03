const express = require('express');
const {
    upload,
    uploadFile,
    getCards,
    getCollections,
    getBadTransactions,
    resetSystem
} = require('../controllers/transactionController');

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);
router.get('/cards', getCards);
router.get('/collections', getCollections);
router.get('/bad-transactions', getBadTransactions);
router.post('/reset', resetSystem);

module.exports = router;