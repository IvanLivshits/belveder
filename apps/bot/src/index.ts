/** grammY bot on a webhook. /start replies with a button that opens the Mini App. */
import { Bot, InlineKeyboard, webhookCallback } from "grammy";

const token = process.env["BOT_TOKEN"];
const webAppUrl = process.env["WEBAPP_URL"];
const secret = process.env["WEBHOOK_SECRET"];
const port = Number(process.env["PORT"] ?? 8787);
if (!token || !webAppUrl || !secret) {
  console.error("BOT_TOKEN, WEBAPP_URL and WEBHOOK_SECRET are required (see .env.example)");
  process.exit(1);
}

export const bot = new Bot(token);

bot.command("start", (ctx) =>
  ctx.reply("Белведер. Двенадцать этажей, если верить вывеске.\nНочь длится шестнадцать ходов.", {
    reply_markup: new InlineKeyboard().webApp("Войти в башню", webAppUrl),
  }),
);

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
