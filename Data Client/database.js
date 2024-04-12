const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Open SQLite database connection
const db = new sqlite3.Database('./db/database.db');

// Create authorizations table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS authorizations (
      id TEXT PRIMARY KEY,
      email TEXT,
      firstName TEXT,
      lastName TEXT,
      accessToken TEXT
    )
  `);
});

// Function to insert user into the database or return existing user
function insertAuthorization(user) {
  
  // Check if the user already exists
  db.get('SELECT * FROM authorizations WHERE id = ?', [user.id], (err, existingUser) => {
    if (err) {
      console.error('Error checking for existing user:', err);
      return;
    }

    // If the user already exists, return the existing user
    if (existingUser) {
      console.log('User already exists:', existingUser);
    }

    // If the user doesn't exist, insert the new user
    db.run(
      'INSERT INTO authorizations (id, email, firstName, lastName, accessToken) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, user.firstName, user.lastName, user.accessToken],
      (err) => {
        if (err) {
          console.error('Error inserting user:', err);
        } else {
          console.log('User inserted successfully.');
        }
      }
    );
  });
}

// Function to retrieve and decrypt the access token for a user
function getAccessToken(userId, callback) {

  // Retrieve the access token from the database
  db.get('SELECT accessToken FROM authorizations WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error retrieving user:', err);
      return callback(err, null);
    }
    // Check if user exists and has an accessToken
    if (row && row.accessToken) {
        return callback(null, row.accessToken);
    } else {
      // No user or no access token available
      return callback(new Error('No access token found or user does not exist'), null);
    }
  });
}



module.exports = {
  db,
  insertAuthorization,
  getAccessToken,
};
