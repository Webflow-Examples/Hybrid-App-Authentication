import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { WebflowClient } from "webflow-api";
import axios from "axios";
import dotenv from "dotenv";
import Table from "cli-table3";
import chalk from "chalk";
import { startNgrok } from "./utils/ngrokManager.js";
import db from "./database.js"; // Load DB Logic
import jwt from "./jwt.js";

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express(); // Create an Express application

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
  sites.sites.forEach((site) => {
    db.insertSiteAuthorization(site.id, accessToken);
  });

  // Redirect URI with first site, can improve UX later for choosing a site
  // to redirect to
  const firstSite = sites.sites?.[0];
  if (firstSite) {
    const shortName = firstSite.shortName;
    res.redirect(
      `https://${shortName}.design.webflow.com?app=${process.env.WEBFLOW_CLIENT_ID}`
    );
    return;
  }

  // Send Auth Complete Screen with Post Message
  const filePath = path.join(__dirname, "public", "authComplete.html");
  res.sendFile(filePath);
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
    const tokenPayload = jwt.createSessionToken(user);
    sessionToken = tokenPayload.sessionToken;
    const expAt = tokenPayload.exp;
    db.insertUserAuthorization(user.id, req.accessToken);
    // Respond to user with sesion token
    res.json({ sessionToken, exp: expAt });
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

// Start server with NGROK
const startServer = async () => {
  try {
    const PORT = process.env.PORT;
    // Start Ngrok
    const ngrokUrl = await startNgrok(PORT);

    // Create a table to output in the CLI
    const table = new Table({
      head: ["Location", "URL"], // Define column headers
      colWidths: [30, 60], // Define column widths
    });

    // Add URL information to the table
    table.push(
      ["Develoment URL (Frontend)", "http://localhost:1337"],
      ["Development URL (Backend)", `http://localhost:${PORT}`]
    );

    // If using an App, also add the Redirect URI to the table
    if (!process.env.SITE_TOKEN) {
      table.push(["Redirect URI", `${ngrokUrl}/callback`]);
    }

    // Console log the table
    console.log(table.toString());

    // If using an App, send a note to adjust the app's Redirect URI
    if (!process.env.SITE_TOKEN) {
      console.log(
        chalk.blue.inverse("\n\nNOTE:"),
        chalk.blue("Update your Redirect URI in your App Settings\n\n")
      );
    }

    // Start the server
    app.listen(PORT, () => {
      // console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server with ngrok:", error);
    process.exit(1);
  }
};

startServer();
