import jwt from "jsonwebtoken";
import db from "./database.js";

// Given a site ID, retrieve associated Access Token
const retrieveAccessToken = (req, res, next) => {
  const idToken = req.body.idToken;
  const siteId = req.body.siteId;

  if (!idToken) {
    return res.status(401).json({ message: "ID Token is missing" });
  }
  if (!siteId) {
    return res.status(401).json({ message: "Site ID is missing" });
  }

  db.getAccessTokenFromSiteId(siteId, (error, accessToken) => {
    if (error) {
      return res.status(500).json({ error: "Failed to retrieve access token" });
    }
    // Attach access token in the request object so that you can make an authenticated request to Webflow
    req.accessToken = accessToken;

    next(); // Proceed to next middleware or route handler
  });
};

const createSessionToken = (user) => {
  const sessionToken = jwt.sign({ user }, process.env.WEBFLOW_CLIENT_SECRET, {
    expiresIn: "24h",
  }); // Example expiration time of 1 hour}
  const decodedToken = jwt.decode(sessionToken);
  return {
    sessionToken,
    exp: decodedToken.exp,
  };
};

// Middleware to authenticate and validate JWT, and fetch the access token given the user ID
const authenticateSessionToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader && authHeader.split(" ")[1]; // Extract the token from 'Bearer <token>'
  if (!sessionToken) {
    return res.status(401).json({ message: "Authentication token is missing" });
  }

  // Verify the Token
  jwt.verify(sessionToken, process.env.WEBFLOW_CLIENT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Use the user details to fetch the access token from the database
    db.getAccessTokenFromUserId(user.user.id, (error, accessToken) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "Failed to retrieve access token" });
      }
      // Attach access token in the request object so that you can make an authenticated request to Webflow
      req.accessToken = accessToken;

      next(); // Proceed to next middleware or route handler
    });
  });
};

export default {
  createSessionToken,
  retrieveAccessToken,
  authenticateSessionToken,
};
