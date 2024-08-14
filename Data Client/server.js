const express = require("express");
const cors = require("cors");
const path = require("path");
const { WebflowClient } = require("webflow-api");
const axios = require("axios");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express(); // Create an Express application
const db = require("./database.js"); // Load DB Logic
const jwt = require("./jwt.js");

var corsOptions = { origin: ["http://localhost:1337"] };

// Middleware
app.use(cors(corsOptions)); // Enable CORS with the specified options
app.use(express.json()); // Parse JSON-formatted incoming requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded incoming requests with extended syntax

// Redirect user to Webflow Authorization screen
app.get("/authorize", (req, res) => {
  const authorizeUrl = WebflowClient.authorizeURL({
    scope: ["sites:read", "authorized_user:read"],
    clientId: process.env.WEBFLOW_CLIENT_ID,
  });
  res.redirect(authorizeUrl);
});

// Optional: Redirect root to Webflow Authorization screen
app.get("/", (req, res) => {
  res.redirect("/authorize");
});

// Exchange the authorization code for an access token and save to DB
app.get("/callback", async (req, res) => {
  const { code } = req.query;

  // Get Access Token
  const accessToken = await WebflowClient.getAccessToken({
    clientId: process.env.WEBFLOW_CLIENT_ID,
    clientSecret: process.env.WEBFLOW_CLIENT_SECRET,
    code: code,
  });

  // Instantiate the Webflow Client
  const webflow = new WebflowClient({ accessToken });

  // Get site ID to pair with the authorization access token
  const sites = await webflow.sites.list();
  const siteToStore = sites.sites[0].id;

  // Save User Details to DB
  db.insertSiteAuthorization(siteToStore, accessToken);
  res.send("<p>Now open the Designer Extension!</p>");
});

// Authenticate Designer Extension User via ID Token
app.post("/token", jwt.retrieveAccessToken, async (req, res) => {
  const token = req.body.idToken; // Get token from request

  // Resolve Session token by makeing a Request to Webflow API
  let sessionToken;
  try {
    const options = {
      method: "POST",
      url: "https://api.webflow.com/beta/token/resolve",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.accessToken}`,
      },
      data: {
        idToken: token,
      },
    };
    const request = await axios.request(options);
    const user = request.data;

    // Generate a Session Token
    sessionToken = jwt.createSessionToken(user);
    db.insertUserAuthorization(user.id, req.accessToken);
    // Respond to user with sesion token
    res.json({ sessionToken });
  } catch (e) {
    console.error(
      "Unauthorized; user is not associated with authorization for this site",
      e
    );
    res.status(401).json({
      error: "Error: User is not associated with authorization for this site",
    });
  }
});

// Make authenticated request with user's session token
app.get("/sites", jwt.authenticateSessionToken, async (req, res) => {
  try {
    // Initialize Webflow Client and make request to sites endpoint
    const accessToken = req.accessToken;
    const webflow = new WebflowClient({ accessToken });
    const data = await webflow.sites.list();
    // Send the retrieved data back to the client
    res.json({ data });
  } catch (error) {
    console.error("Error handling authenticated request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
