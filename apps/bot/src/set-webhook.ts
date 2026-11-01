/** One-off: points Telegram at $WEBHOOK_URL/webhook with the secret token. */
import { Bot } from "grammy";

const token = process.env["BOT_TOKEN"];
const base = process.env["WEBHOOK_URL"];
const secret = process.env["WEBHOOK_SECRET"];
if (!token || !base || !secret) {
  console.error("BOT_TOKEN, WEBHOOK_URL and WEBHOOK_SECRET are required (see .env.example)");
  process.exit(1);
}
const bot = new Bot(token);
await bot.api.setWebhook(`${base.replace(/\/$/, "")}/webhook`, { secret_token: secret, drop_pending_updates: true });
console.log(await bot.api.getWebhookInfo());
