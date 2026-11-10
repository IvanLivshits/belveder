/** grammY bot on a webhook, served by Bun for local development (ngrok in front). */
import { webhookCallback } from "grammy";
import { createBot } from "./bot";

const token = process.env["BOT_TOKEN"];
const webAppUrl = process.env["WEBAPP_URL"];
const secret = process.env["WEBHOOK_SECRET"];
const port = Number(process.env["PORT"] ?? 8787);
if (!token || !webAppUrl || !secret) {
  console.error("BOT_TOKEN, WEBAPP_URL and WEBHOOK_SECRET are required (see .env.example)");
  process.exit(1);
}

export const bot = createBot(token, webAppUrl);

// Fail fast on a bad token instead of on the first update.
await bot.init();
const handle = webhookCallback(bot, "std/http", { secretToken: secret });

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/webhook") return handle(req);
    if (url.pathname === "/health") return new Response("ok");
    return new Response("not found", { status: 404 });
  },
});
console.log(`bot webhook server on :${port}/webhook`);
