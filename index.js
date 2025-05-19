const puppeteer = require('puppeteer-core');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN);

const PRODUCT_URL = 'https://www.onenessboutique.com/products/fear-of-god-essentials-bonded-nylon-soccer-shorts-in-desert-sand-160ho244377f';
const ORIGINAL_PRICE = 90;

const CHROME_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
];

function findExecutablePath() {
  const fs = require('fs');
  for (const path of CHROME_PATHS) {
    if (fs.existsSync(path)) return path;
  }
  throw new Error('Chrome executable not found.');
}

async function checkDiscount() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: findExecutablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  try {
    await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[value="XL"]');
    await page.click('input[value="XL"]');

    await page.waitForSelector('button[name="add"]');
    await page.click('button[name="add"]');
    await page.waitForTimeout(2000);

    await page.goto('https://www.onenessboutique.com/checkout', { waitUntil: 'networkidle2' });

    const priceText = await page.$eval('.payment-due__price', el => el.textContent);
    const currentPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    const discount = ((ORIGINAL_PRICE - currentPrice) / ORIGINAL_PRICE) * 100;

    console.log(`현재 가격: $${currentPrice} / 할인율: ${discount.toFixed(1)}%`);

    if (discount >= 40) {
      await bot.sendMessage(process.env.CHAT_ID, `🔥 할인 발견!
Fear of God Essentials Nylon Shorts (XL)
💰 정가: $${ORIGINAL_PRICE} → 할인가: $${currentPrice} (-${discount.toFixed(1)}%)
🔗 ${PRODUCT_URL}`);
    }
  } catch (error) {
    console.error('에러 발생:', error.message);
  } finally {
    await browser.close();
  }
}

checkDiscount();
setInterval(checkDiscount, 10 * 60 * 1000);