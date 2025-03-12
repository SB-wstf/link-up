import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
import {
  automateLinkedInUpdate,
  captureScreenshotsUntilClosed,
} from "./scripts/linkedinAutomation2.js";
import { browserConfig } from "./config/puppeteerConfig.js";

import { Server } from "socket.io";
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const server = app.listen(3001, () =>
  console.log("Server running on port 3001")
);

const io = new Server(server, {
  // Use Server to initialize socket.io
  cors: {
    origin: "*", // Allow requests from frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

export var keyToken = "";
export var keyTokenReceived = false;

export function resetToken() {
  keyToken = "";
  keyTokenReceived = false;
}
// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("connected to socket.io");

  // Handle the "setup" event emitted by the client
  socket.on("setup", (id) => {
    console.log("setup event received");
    console.log("IDDDD", id);
    // Join a room identified by the user's ID
    socket.join(id);
    // Emit a "connected" event back to the client
    socket.emit("connected");
  });

  // Handle the "token" event emitted by the client
  socket.on("token", (token) => {
    console.log("token event received");
    console.log("token-", token);
    keyToken = token;
    keyTokenReceived = true;
  });
});

// while (!keyTokenReceived) {
//   console.log("Waiting for keyToken...", keyToken);
//   await new Promise((resolve) => setTimeout(resolve, 5000));
// }

app.post("/start-linkedin-update", async (req, res) => {
  resetToken();
  console.log("token", keyToken);
  console.log("keyTokenReceived", keyTokenReceived);
  io.emit("status", "Starting LinkedIn automation...");
  try {
    const chrome = await chromeLauncher.launch(browserConfig);
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${chrome.port}`,
    });

    const page = await browser.newPage();

    captureScreenshotsUntilClosed(page, io);
    await automateLinkedInUpdate(page, io); // Pass io to automation function

    await page.close();
    await browser.disconnect();
    await chrome.kill();

    io.emit("status", "Automation complete.");
    res.json({ success: true });
  } catch (error) {
    io.emit("status", `Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/dummy-post", async (req, res) => {
  res.json({ success: true, message: "Dummy Post working" });
});

app.get("/", (req, res) => {
  return res.send(`<h1>You are on the Home Page of Auto Updator Server</h1>`);
});

app.post("/token", (req, res) => {
  console.log("api received token");
  console.log(req.body.keyToken);
  const { token } = req.body.keyToken;
  keyToken = token;
  keyTokenReceived = true;
  return res.status(200).json({ message: "Received Token" });
});


export default app;