// const puppeteer = require("puppeteer");
import puppeteer from "puppeteer";
import colors from "colors";
// import puppeteer from "puppeteer-core";

import connectDB from "./config/mongoConfig.js";
connectDB();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://www.linkedin.com/login"); // Change to your target URL

  // Get inner HTML of the body
  const bodyInnerHTML = await page.evaluate(() => document.body.innerHTML);
  console.log("Body Inner HTML:", bodyInnerHTML);

  // Get all CSS stylesheets
  const styles = await page.evaluate(() => {
    const styleSheets = Array.from(document.styleSheets);
    return styleSheets.map((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules);
        return {
          href: sheet.href,
          rules: rules.map((rule) => rule.cssText),
        };
      } catch (e) {
        // Handle cross-origin stylesheets
        return { href: sheet.href, rules: [] };
      }
    });
  });
  console.log("CSS Styles:", styles);

  await browser.close();
})();
