#!/usr/bin/env node
// Debug script: takes a screenshot and dumps page content
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = path.join(
  process.env.HOME,
  ".cache/puppeteer/chrome/linux-150.0.7871.46/chrome-linux64/chrome"
);

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
  );

  const url = "https://www.google.com/travel/flights?q=Flights+from+YYZ+to+PEK+on+2026-09-03+return+2026-09-17&curr=USD&hl=en";
  console.log("Navigating to:", url);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  // Take screenshot
  await page.screenshot({ path: path.join(__dirname, "debug_screenshot.png"), fullPage: true });
  console.log("Screenshot saved to scripts/debug_screenshot.png");

  // Get page title
  const title = await page.title();
  console.log("Page title:", title);

  // Get page text content
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(__dirname, "debug_page_text.txt"), text);
  console.log("Page text saved to scripts/debug_page_text.txt");
  console.log("First 2000 chars of text:");
  console.log(text.substring(0, 2000));

  // Check for any price-like content
  const prices = await page.evaluate(() => {
    const text = document.body.innerText;
    const matches = [...text.matchAll(/\$[\d,]+/g)];
    return matches.map(m => m[0]);
  });
  console.log("\nDollar amounts found:", prices);

  // Check for nonstop/stops content
  const stopInfo = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return {
      hasNonstop: text.includes("nonstop"),
      hasDirect: text.includes("direct"),
      hasStops: text.includes("stop"),
      hasNoResult: text.includes("no result") || text.includes("no flights"),
    };
  });
  console.log("\nStop-related content:", stopInfo);

  await browser.close();
}

main().catch(console.error);
