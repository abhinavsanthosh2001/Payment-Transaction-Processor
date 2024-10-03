const express = require('express');
const {
    upload,
    uploadFile,
    getCards,
    getCollections,
    getBadTransactions,
    resetSystem
} = require('../controllers/transactionController');
const checkToken = require('../middleware/checkToken');
const router = express.Router();

router.post('/upload', checkToken, upload.single('file'), uploadFile);
router.get('/cards', checkToken, getCards);
router.get('/collections', checkToken, getCollections);
router.get('/bad-transactions', checkToken, getBadTransactions);
router.post('/reset', checkToken, resetSystem);

module.exports = router;