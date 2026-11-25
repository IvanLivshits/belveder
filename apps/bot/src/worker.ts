/** The same bot as a Cloudflare Worker (`bunx wrangler deploy` from apps/bot).
 *  WEBAPP_URL and SUPPORT_CONTACT are vars in wrangler.toml; BOT_TOKEN and WEBHOOK_SECRET are secrets (`wrangler secret put`). */
import { webhookCallback, type Bot } from "grammy";
import { createBot, createTipLink, tipInvoiceResponse } from "./bot";

interface Env {
  BOT_TOKEN: string;
  WEBAPP_URL: string;
  SUPPORT_CONTACT: string;
  WEBHOOK_SECRET: string;
}

// Workers forbid network calls at module scope, so the bot is built on the first request.
let bot: Bot | undefined;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    const isInvoice = req.method === "GET" && url.pathname === "/invoice";
    if (!isInvoice && (req.method !== "POST" || url.pathname !== "/webhook")) return new Response("not found", { status: 404 });
    bot ??= createBot(env.BOT_TOKEN, env.WEBAPP_URL, env.SUPPORT_CONTACT);
    const b = bot;
    if (isInvoice) return tipInvoiceResponse(url, (amount) => createTipLink(b, amount));
    return webhookCallback(b, "cloudflare-mod", { secretToken: env.WEBHOOK_SECRET })(req);
  },
};
