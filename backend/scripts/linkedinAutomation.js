import { env } from "../config/envConfig.js";

const LINKEDIN_EMAIL = env.LINKEDIN_EMAIL;
const LINKEDIN_PASSWORD = env.LINKEDIN_PASSWORD;
const LINKEDIN_PROFILE_URL = env.LINKEDIN_PROFILE_URL;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateRandomNumber() {
  return Math.floor(Math.random() * (15 - 5 + 1)) + 5;
}

export async function automateLinkedInUpdate(page) {
  try {
    console.log("Email:", LINKEDIN_EMAIL);
    console.log("Password:", LINKEDIN_PASSWORD);
    console.log("LINKEDIN_PROFILE_URL:", LINKEDIN_PROFILE_URL);

    await page.goto("https://www.linkedin.com/login");
    await page.type("#username", LINKEDIN_EMAIL);
    await page.type("#password", LINKEDIN_PASSWORD);
    await page.click(".btn__primary--large");
    console.log("login successfull");

    await page.waitForNavigation();
    await page.goto(LINKEDIN_PROFILE_URL, { waitUntil: "load" });
    console.log("traversed to profile page");

    await delay(generateRandomNumber() * 1000);

    await page.evaluate(() => {
      const editButton = document.querySelector(
        'button[aria-label="Edit intro"]'
      );
      if (editButton) {
        editButton.click();
      } else {
        // console.log("Edit intro button not found!");
        throw new Error("Edit intro button not found");
      }
    });
    console.log("Clicked Edit intro button");

    await delay(generateRandomNumber() * 1000);
    await page.waitForSelector('button[data-view-name="profile-form-save"]', {
      timeout: 60000,
    });
    console.log("profile edit modal openq");

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
    console.log("Clicked save button");

    await delay(generateRandomNumber() * 1000);
  } catch (error) {
    console.error("Error during LinkedIn automation:", error);
  }
}
