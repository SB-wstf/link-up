import { uploadToCloudinary } from "../config/cloudinaryConfig.js";
import { env } from "../config/envConfig.js";

import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { keyToken, keyTokenReceived, resetToken } from "../index.js";

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the directory to store screenshots
const screenshotsDir = path.join(__dirname, "screenshots");

// Ensure the directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}
const LINKEDIN_EMAIL = env.LINKEDIN_EMAIL;
const LINKEDIN_PASSWORD = env.LINKEDIN_PASSWORD;
const LINKEDIN_PROFILE_URL = env.LINKEDIN_PROFILE_URL;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateRandomNumber() {
  return Math.floor(Math.random() * (15 - 5 + 1)) + 5;
}

async function takeScreenshot(page, io) {
  console.log("Taking screenshot...");
  // Generate a unique filename for each screenshot
  const timestamp = Date.now();
  const screenshotPath = path.join(
    screenshotsDir,
    `screenshot-${timestamp}.png`
  );

  // Capture the screenshot and save it to the file system
  await page.screenshot({ path: screenshotPath });

  // Upload the screenshot to Cloudinary
  try {
    const cloudinaryUrl = await uploadToCloudinary(screenshotPath);

    // Emit the screenshot URL to the frontend
    io.emit("screenshot", cloudinaryUrl);

    // console.log(`Screenshot uploaded to Cloudinary: ${cloudinaryUrl}`);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
  }
}

export async function captureScreenshotsUntilClosed(page, io) {
  const interval = 10000; // Interval for capturing screenshots (10 seconds)

  let counter = 0;
  const screenshotTask = setInterval(async () => {
    if (page.isClosed()) {
      clearInterval(screenshotTask); // Stop capturing if the page is closed
      return;
    }
    console.log("Taking screenshot...", ++counter);
    await takeScreenshot(page, io); // Capture and emit the screenshot
  }, interval);

  // Listen for the page close event
  page.on("close", () => {
    console.log("Closing screenshot taking...");
    clearInterval(screenshotTask); // Clear the interval if the page closes
  });
}

export async function automateLinkedInUpdate(page, io) {
  try {
    console.log("Email:", LINKEDIN_EMAIL);
    console.log("Password:", LINKEDIN_PASSWORD);
    console.log("LINKEDIN_PROFILE_URL:", LINKEDIN_PROFILE_URL);

    io.emit("status", "Navigating to LinkedIn login page...");
    console.log("Navigating to LinkedIn login page...");
    await page.goto("https://www.linkedin.com/login");
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    io.emit("status", "Entering email and password...");
    console.log("Entering email and password...");
    await page.type("#username", LINKEDIN_EMAIL);
    await page.type("#password", LINKEDIN_PASSWORD);
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    // io.emit("status", "Submitting login form...");
    // console.log("Submitting login form...");
    // await page.click(".btn__primary--large");
    // await page.waitForNavigation();
    // io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    // await takeScreenshot(page, io);

    io.emit("status", "Submitting login form...");
    console.log("Submitting login form...");
    await page.click(".btn__primary--large");

    try {
      await page.waitForNavigation();
      console.log("Navigation successful...");
    } catch (error) {
      // If an error occurs (e.g., due to 2FA), handle it here
      console.error("Navigation failed:", error.message);

      // Get the current page URL
      let currentPageUrl = await page.url();

      // Emit the status message along with the current page URL
      io.emit(
        "status",
        `Navigation failed, handling two-factor authentication... Current URL: ${currentPageUrl}`
      );
      // Check if the URL starts with the desired base
      const baseUrl = "https://www.linkedin.com/checkpoint/challenge";
      let tokenTrial = 0;
      let isRepeat = false;
      do {
        io.emit("showTokenInput", true);
        // Send a screenshot of the current page
        await takeScreenshot(page, io);

        while (
          currentPageUrl.startsWith(baseUrl) &&
          !page.isClosed() &&
          !keyTokenReceived
        ) {
          console.log("Waiting for keyToken...", keyToken);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        if (
          currentPageUrl.startsWith(baseUrl) &&
          !page.isClosed() &&
          keyTokenReceived
        ) {
          console.log(
            "KeyToken received status inside my controller:",
            keyTokenReceived
          );
          console.log("Received keyToken inside my controller:", keyToken);

          // fill the token
          await page.type("#input__email_verification_pin", keyToken);
          await takeScreenshot(page, io);

          await page.click("#email-pin-submit-button");
          await takeScreenshot(page, io);

          resetToken();

          console.log("Clearing token Data:", keyToken, keyTokenReceived);

          io.emit("showTokenInput", false);
        }

        // Wait for 5 seconds
        await delay(5000);

        // Get the current page URL
        currentPageUrl = await page.url();

        if (currentPageUrl.startsWith(baseUrl) && !page.isClosed()) {
          const errorMessage = await page.$eval("#email-pin-error", (element) =>
            element.textContent.trim()
          );

          // Check if the div has a 'hidden' class or if it's styled to be hidden
          const isHidden = await page.$eval("#email-pin-error", (element) => {
            // Check if it has a 'hidden' class
            const hasHiddenClass = element.classList.contains("hidden");

            // Optionally, you could also check for inline styles like 'display: none' or 'visibility: hidden'
            const isInlineHidden =
              window.getComputedStyle(element).display === "none" ||
              window.getComputedStyle(element).visibility === "hidden";

            return hasHiddenClass || isInlineHidden; // Return true if it's hidden
          });

          isRepeat =
            !isHidden ||
            errorMessage == "Hmm, that’s not the right code" ||
            errorMessage == "Please enter the code";
        }
      } while (
        currentPageUrl.startsWith(baseUrl) &&
        !page.isClosed() &&
        isRepeat &&
        ++tokenTrial < 5
      );

      if (
        currentPageUrl.startsWith(baseUrl) &&
        !page.isClosed() &&
        tokenTrial >= 5
      ) {
        io.emit("status", "Failed to enter token in 5 tries");
        console.log("Failed to enter token in 5 tries");
        return;
      }
      console.log("out of loop");

      // Optionally, you can handle the two-factor authentication logic here
      // e.g., waiting for user input or further actions

      // Wait for navigation, with a timeout of 10 minutes (600000 ms) to give 10 min window to accept in mobile
      await page.waitForNavigation({ timeout: 600000 });
    }

    console.log("check 1");
    
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    console.log("check 2");
    io.emit("status", "Clicking on write post");
    // // Wait for the button to appear
    // await page.waitForSelector("#ember31");

    // // Click the button
    // await page.click("#ember31");

    // Find the button with the specific inner text and click it
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const targetButton = buttons.find(
        (button) =>
          button.innerText.trim() === "Start a post, try writing with AI" || button.innerText.trim() === "Start a post"
      );
      if (targetButton) {
        targetButton.click();
      }
    });

    // Wait for 5 seconds
    await delay(5000);
    await takeScreenshot(page, io);

    // Wait for the editor to appear
    await page.waitForSelector(".ql-editor");

    const content = "This is a dummy post content!" + Date.now();
    // Type some dummy content into the editor
    await page.type(".ql-editor", content);
    await takeScreenshot(page, io);

    // Wait for the button to appear by inner text
    await page.waitForSelector("button");

    // Find the button with the specific inner text and click it
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const targetButton = buttons.find(
        (button) => button.innerText.trim() === "Post"
      );
      if (targetButton) {
        targetButton.click();
      }
    });
    io.emit("status", "Added post to LinkedIn");

    // Wait for 10 seconds
    await delay(10000);
    await takeScreenshot(page, io);

    io.emit("status", "Navigating to profile page...");
    console.log("Navigating to profile page...");
    await page.goto(LINKEDIN_PROFILE_URL, { waitUntil: "load" });
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    io.emit("status", "Opening 'Edit intro' section...");
    console.log("Opening 'Edit intro' section...");
    await page.evaluate(() => {
      const editButton = document.querySelector(
        'button[aria-label="Edit intro"]'
      );
      if (editButton) {
        editButton.click();
      } else {
        throw new Error("Edit intro button not found");
      }
    });
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    io.emit("status", "LinkedIn profile update complete.");
    console.log("Waiting for profile edit modal to appear...");
    await page.waitForSelector('button[data-view-name="profile-form-save"]', {
      timeout: 60000,
    });
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    io.emit("status", "LinkedIn profile update complete.");
    console.log("Clicking 'Save' button...");
    await page.evaluate(() => {
      const saveButton = document.querySelector(
        'button[data-view-name="profile-form-save"]'
      );
      if (saveButton) {
        saveButton.click();
      } else {
        throw new Error("Save button not found");
      }
    });
    io.emit("pageContent", await page.evaluate(() => document.body.innerHTML));
    await takeScreenshot(page, io);

    // Wait for 10 seconds
    await delay(10000);
    await takeScreenshot(page, io);

    console.log("LinkedIn profile update complete.");
    io.emit("status", "LinkedIn profile update complete.");
  } catch (error) {
    console.error("Error during LinkedIn automation:", error);
    io.emit("status", `Error: ${error.message}`);
  }
}
