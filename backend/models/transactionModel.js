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

function paginate(array, page, limit) {
    const totalItems = array.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    return {
        page,
        totalPages,
        totalItems,
        items: array.slice(startIndex, endIndex),
    };
}

module.exports = {
    transactions,
    cards,
    badTransactions,
    processTransaction,
    paginate
};