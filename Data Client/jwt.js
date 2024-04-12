const jwt = require('jsonwebtoken')
const db = require('./database.js')

const createSessionToken = (user) => {
    const sessionToken = jwt.sign({ user }, process.env.WEBFLOW_CLIENT_SECRET, { expiresIn: '24h' }); // Example expiration time of 1 hour}
    return sessionToken
}
// Middleware to authenticate and validate JWT, and fetch the decrypted access token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Extract the token from 'Bearer <token>'
    if (!token) {
        return res.status(401).json({ message: 'Authentication token is missing' });
    }

    // Verify the Token
    jwt.verify(token, process.env.WEBFLOW_CLIENT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Use the user details to fetch the access token from the database
        db.getAccessToken(user.user, (error, accessToken) => {

            if (error) {
                return res.status(500).json({ error: 'Failed to retrieve access token' });
            }
            // Attach  access token in the request object so that you can make an authenticated request to Webflow
            req.accessToken = accessToken;

            next(); // Proceed to next middleware or route handler
        });
    });
};

module.exports = {
    createSessionToken,
    authenticateToken
}