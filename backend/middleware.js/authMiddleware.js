// middlewares/authMiddleware.js
const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = process.env.JWT_SECRET;

const authMiddleware = jwt({ secret: jwtSecret, algorithms: ['HS256'] }).unless({ path: ['/login', '/register'] });

module.exports = authMiddleware;