import ngrok from "@ngrok/ngrok";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ngrokUrlFilePath = path.join(__dirname, "ngrok-url.txt");
let publicUrl; // Variable to store the current active ngrok URL
let shuttingDown = false; // Flag to ensure single execution of signal handlers

export const startNgrok = async (port) => {
  // Load cached URL if it exists
  if (fs.existsSync(ngrokUrlFilePath)) {
    publicUrl = fs.readFileSync(ngrokUrlFilePath, "utf-8");
    console.log(`Using existing ngrok URL: ${publicUrl}`);
    return publicUrl;
  }

  try {
    // Start a new ngrok tunnel to the specified port
    const listener = await ngrok.forward({
      addr: port,
      authtoken: process.env.NGROK_AUTH_TOKEN,
    });
    publicUrl = listener.url();

    // Save the URL to a cache file
    fs.writeFileSync(ngrokUrlFilePath, publicUrl);
    console.log(`New ngrok URL generated: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("Error starting ngrok:", error);
    throw new Error("Failed to initialize ngrok");
  }
};

export const disconnectNgrok = async () => {
  if (publicUrl) {
    try {
      console.log("Disconnecting ngrok...");
      await ngrok.disconnect(publicUrl);
      await ngrok.kill();
      fs.unlinkSync(ngrokUrlFilePath); // Remove cached URL
      console.log("Ngrok Tunnel disconnected");
    } catch (error) {
      console.error("Failed to disconnect ngrok:", error);
    } finally {
      publicUrl = null;
    }
  }
};

const handleShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  if (signal === "SIGUSR2") {
    console.log(`Received ${signal}, ignoring shutdown for nodemon restart...`);
    shuttingDown = false; // Reset the flag for next use
    return; // Don't disconnect ngrok, just return
  }

  console.log(`Received ${signal}, shutting down gracefully...`);
  await disconnectNgrok();
  process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGUSR2", () => handleShutdown("SIGUSR2"));
