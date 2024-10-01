import sqlite3 from "sqlite3";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Enable dotenv to load environment variables
dotenv.config();

// Enable verbose mode for SQLite3
const sqlite3Verbose = sqlite3.verbose();

// Open SQLite database connection
const db = new sqlite3Verbose.Database("./db/database.db");

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

  // Table to associate site ID with access token from OAuth
  db.run(`
    CREATE TABLE IF NOT EXISTS siteAuthorizations (
      siteId TEXT PRIMARY KEY,
      accessToken TEXT
    )
  `);

  // Table to associate user ID with the access token
  db.run(`
    CREATE TABLE IF NOT EXISTS userAuthorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      accessToken TEXT
    )
  `);
});

// Function to insert user into the database or return existing user
function insertAuthorization(user) {
  // Check if the user already exists
  db.get(
    "SELECT * FROM authorizations WHERE id = ?",
    [user.id],
    (err, existingUser) => {
      if (err) {
        console.error("Error checking for existing user:", err);
        return;
      }

      // If the user already exists, return the existing user
      if (existingUser) {
        console.log("User already exists:", existingUser);
      }

      // If the user doesn't exist, insert the new user
      db.run(
        "INSERT INTO authorizations (id, email, firstName, lastName, accessToken) VALUES (?, ?, ?, ?, ?)",
        [user.id, user.email, user.firstName, user.lastName, user.accessToken],
        (err) => {
          if (err) {
            console.error("Error inserting user:", err);
          } else {
            console.log("User inserted successfully.");
          }
        }
      );
    }
  );
}

// Insert a record after exchanging the OAuth code for an access token
function insertSiteAuthorization(siteId, accessToken) {
  db.get(
    "SELECT * FROM siteAuthorizations WHERE siteId = ?",
    [siteId],
    (err, existingAuth) => {
      if (err) {
        console.error("Error checking for existing site authorization:", err);
        return;
      }

      // If the user already exists, return the existing user
      if (existingAuth) {
        console.log("Site auth already exists:", existingAuth);
        return;
      }

      db.run(
        "INSERT INTO siteAuthorizations (siteId, accessToken) VALUES (?, ?)",
        [siteId, accessToken],
        (err) => {
          if (err) {
            console.error("Error inserting site authorization pairing:", err);
          } else {
            console.log("Site authorization pairing inserted successfully.");
          }
        }
      );
    }
  );
}

// Insert a record when the /resolve endpoint succeeds and can trust the user to be associated
// with the access token
function insertUserAuthorization(userId, accessToken) {
  db.get(
    "SELECT * FROM userAuthorizations WHERE userId = ?",
    [userId],
    (err, existingTokenAuth) => {
      if (err) {
        console.error("Error checking for existing user access token:", err);
        return;
      }

      // If the user already exists, return the existing user
      if (existingTokenAuth) {
        console.log("Access token pairing already exists:", existingTokenAuth);
        return;
      }

      db.run(
        "INSERT INTO userAuthorizations (userId, accessToken) VALUES (?, ?)",
        [userId, accessToken],
        (err) => {
          if (err) {
            console.error("Error inserting user access token pairing:", err);
          } else {
            console.log("User access token pairing inserted successfully.");
          }
        }
      );
    }
  );
}

function getAccessTokenFromSiteId(siteId, callback) {
  // Retrieve the access token from the database
  db.get(
    "SELECT accessToken FROM siteAuthorizations WHERE siteId = ?",
    [siteId],
    (err, row) => {
      if (err) {
        console.error("Error retrieving access token:", err);
        return callback(err, null);
      }
      // Check if site exists and has an accessToken
      if (row && row.accessToken) {
        return callback(null, row.accessToken);
      } else {
        // No user or no access token available
        return callback(
          new Error("No access token found or site does not exist"),
          null
        );
      }
    }
  );
}

function getAccessTokenFromUserId(userId, callback) {
  // Retrieve the access token from the database
  db.get(
    "SELECT accessToken FROM userAuthorizations WHERE userId = ?",
    [userId],
    (err, row) => {
      if (err) {
        console.error("Error retrieving access token:", err);
        return callback(err, null);
      }
      // Check if user exists and has an accessToken
      if (row && row.accessToken) {
        return callback(null, row.accessToken);
      } else {
        // No user or no access token available
        return callback(
          new Error("No access token found or user does not exist"),
          null
        );
      }
    }
  );
}

// Function to retrieve and decrypt the access token for a user
function getAccessToken(userId, callback) {
  // Retrieve the access token from the database
  db.get(
    "SELECT accessToken FROM authorizations WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) {
        console.error("Error retrieving user:", err);
        return callback(err, null);
      }
      // Check if user exists and has an accessToken
      if (row && row.accessToken) {
        return callback(null, row.accessToken);
      } else {
        // No user or no access token available
        return callback(
          new Error("No access token found or user does not exist"),
          null
        );
      }
    }
  );
}

function clearDatabase() {
  db.serialize(() => {
    // Clear data from authorizations table
    db.run("DELETE FROM authorizations", (err) => {
      if (err) {
        console.error("Error clearing authorizations table:", err);
      } else {
        console.log("Authorizations table cleared.");
      }
    });

    // Clear data from siteAuthorizations table
    db.run("DELETE FROM siteAuthorizations", (err) => {
      if (err) {
        console.error("Error clearing siteAuthorizations table:", err);
      } else {
        console.log("Site Authorizations table cleared.");
      }
    });

    // Clear data from userAuthorizations table
    db.run("DELETE FROM userAuthorizations", (err) => {
      if (err) {
        console.error("Error clearing userAuthorizations table:", err);
      } else {
        console.log("User Authorizations table cleared.");
      }
    });
  });
}

// Example usage
clearDatabase();

export default {
  db,
  insertAuthorization,
  insertSiteAuthorization,
  insertUserAuthorization,
  getAccessToken,
  getAccessTokenFromSiteId,
  getAccessTokenFromUserId,
  clearDatabase,
};
