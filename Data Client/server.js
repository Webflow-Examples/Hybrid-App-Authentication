const express = require("express");
const cors = require("cors");
const { WebflowClient } = require("webflow-api");
const axios = require("axios");
require("dotenv").config();

const app = express(); // Create an Express application
const db = require("./database.js"); // Load DB Logic
const jwt = require("./jwt.js")

var corsOptions = { origin: ["http://localhost:1337"] };

// Middleware
app.use(cors(corsOptions)); // Enable CORS with the specified options
app.use(express.json()); // Parse JSON-formatted incoming requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded incoming requests with extended syntax

// Redirect user to Webflow Authorization screen
app.get("/authorize", (req, res) => {

    const authorizeUrl = WebflowClient.authorizeURL({
        scope: ["sites:read","authorized_user:read"],
        clientId: process.env.WEBFLOW_CLIENT_ID,
    })
    res.redirect(authorizeUrl)
})

// Optional: Redirect root to Webflow Authorization screen
app.get("/", (req,res) =>{
    res.redirect("/authorize")
})

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

  // Get Authorization Details
  const user = await webflow.token.authorizedBy();
  user.accessToken = accessToken; // add access token to user object

  // Save User Details to DB
  db.insertAuthorization(user);
});

// Authenticate Designer Extension User via ID Token
app.post("/token", async (req, res) => {
  const token = req.body.idToken; // Get token from request

  // Resolve Session token by makeing a Request to Webflow API
  const APP_TOKEN = process.env.APP_TOKEN;
  const options = {
    method: "POST",
    url: "https://api.webflow.com/beta/token/resolve",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.APP_TOKEN}`,
    },
    data: {
      idToken: token,
    },
  };
  const request = await axios.request(options);
  const user = request.data;

  // Generate a Session Token
  const sessionToken = jwt.createSessionToken(user)

  // Respond to user with sesion token
  res.json({ sessionToken });
});

// Make authenticated request with user's session token
app.get("/sites", jwt.authenticateToken ,async (req, res) => {
  
  try {
    // Initialize Webflow Client and make request to sites endpoint
    const accessToken = req.accessToken
    const webflow = new WebflowClient({ accessToken });
    const data = await webflow.sites.list();
    console.log(accessToken)
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
