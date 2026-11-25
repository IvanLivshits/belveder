/** grammY bot on a webhook, served by Bun for local development (ngrok in front). */
import { webhookCallback } from "grammy";
import { createBot, createTipLink, tipInvoiceResponse } from "./bot";

const token = process.env["BOT_TOKEN"];
const webAppUrl = process.env["WEBAPP_URL"];
const secret = process.env["WEBHOOK_SECRET"];
const support = process.env["SUPPORT_CONTACT"];
const port = Number(process.env["PORT"] ?? 8787);
if (!token || !webAppUrl || !secret || !support) {
  console.error("BOT_TOKEN, WEBAPP_URL, WEBHOOK_SECRET and SUPPORT_CONTACT are required (see .env.example)");
  process.exit(1);
}

export const bot = createBot(token, webAppUrl, support);

// Fail fast on a bad token instead of on the first update.
await bot.init();
const handle = webhookCallback(bot, "std/http", { secretToken: secret });

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/webhook") return handle(req);
    if (req.method === "GET" && url.pathname === "/invoice") return tipInvoiceResponse(url, (amount) => createTipLink(bot, amount));
    if (url.pathname === "/health") return new Response("ok");
    return new Response("not found", { status: 404 });
  },
});
console.log(`bot webhook server on :${port}/webhook`);
