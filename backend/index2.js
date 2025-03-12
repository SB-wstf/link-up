// Import chrome-launcher and puppeteer
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
import { automateLinkedInUpdate } from "./scripts/linkedinAutomation.js";
import { browserConfig } from "./config/puppeteerConfig.js";

// Helper function to add delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  try {
    // Launch Chrome with necessary flags
    const chrome = await chromeLauncher.launch(browserConfig);

    console.log(`Chrome launched on port: ${chrome.port}`);

    // Connect Puppeteer to the launched Chrome instance
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${chrome.port}`, // Use the port from chrome-launcher
    });

    const page = await browser.newPage();
    await automateLinkedInUpdate(page);

    await browser.disconnect();
    await chrome.kill(); // Clean up
  } catch (error) {
    console.error("Error launching Chrome or Puppeteer:", error);
    process.exit(1); // Optional: exit process with failure status
  }
})();
