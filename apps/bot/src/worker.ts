/** The same bot as a Cloudflare Worker (`bunx wrangler deploy` from apps/bot).
 *  WEBAPP_URL is a var in wrangler.toml; BOT_TOKEN and WEBHOOK_SECRET are secrets (`wrangler secret put`). */
import { webhookCallback, type Bot } from "grammy";
import { createBot } from "./bot";

interface Env {
  BOT_TOKEN: string;
  WEBAPP_URL: string;
  WEBHOOK_SECRET: string;
}

// Workers forbid network calls at module scope, so the bot is built on the first request.
let bot: Bot | undefined;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (req.method !== "POST" || url.pathname !== "/webhook") return new Response("not found", { status: 404 });
    bot ??= createBot(env.BOT_TOKEN, env.WEBAPP_URL);
    return webhookCallback(bot, "cloudflare-mod", { secretToken: env.WEBHOOK_SECRET })(req);
  },
};
