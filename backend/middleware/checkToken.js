const checkToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (token && token === `Bearer ${process.env.API_SECRET_TOKEN}`) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
};

module.exports = checkToken;