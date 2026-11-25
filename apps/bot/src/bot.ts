/** The bot itself, shared by the Bun server (local dev) and the Cloudflare Worker (production). */
import { Bot, InlineKeyboard } from "grammy";

/** Telegram Stars: the only currency Telegram allows for digital goods. */
const STARS = "XTR";
const TIP_PAYLOAD = "tip";
/** Upper bound for one tip, in Stars. The Mini App decides the actual amounts. */
export const TIP_MAX = 10000;

export function createBot(token: string, webAppUrl: string, supportContact: string): Bot {
  const bot = new Bot(token);
  bot.command("start", (ctx) =>
    ctx.reply("Белведер. Двенадцать этажей, если верить вывеске.\nНочь длится шестнадцать ходов.", {
      reply_markup: new InlineKeyboard().webApp("Войти в башню", webAppUrl),
    }),
  );
  // Tips are voluntary and unlock nothing, so there is nothing to check or deliver: every checkout is accepted.
  bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));
  // The charge id is what refundStarPayment needs; the message keeps it in the chat for both sides.
  bot.on("message:successful_payment", (ctx) =>
    ctx.reply(`Спасибо. Ник это запомнит, насколько он вообще что-то помнит.\nНомер платежа: ${ctx.message.successful_payment.telegram_payment_charge_id}`),
  );
  // Telegram requires both commands from every bot that accepts Stars.
  bot.command("paysupport", (ctx) =>
    ctx.reply(`Вопросы по платежам и возвраты: ${supportContact}. Пришлите номер платежа из сообщения бота, вернём звёзды.`),
  );
  bot.command("terms", (ctx) =>
    ctx.reply(`Игра бесплатная. Чаевые в Telegram Stars добровольные и ничего в игре не открывают. Возврат по запросу: ${supportContact}.`),
  );
  return bot;
}

/** A whole number of Stars within 1..TIP_MAX, or null. */
export function parseTipAmount(raw: string | null): number | null {
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return null;
  const amount = Number(raw);
  return amount <= TIP_MAX ? amount : null;
}

export function createTipLink(bot: Bot, amount: number): Promise<string> {
  return bot.api.createInvoiceLink(
    "Чаевые Нику",
    "Добровольная благодарность авторам «Ломбарда на последнем этаже». В игре ничего не открывает.",
    TIP_PAYLOAD,
    "", // no provider for Stars
    STARS,
    [{ label: "Чаевые", amount }],
  );
}

/**
 * `GET /invoice?amount=<stars>` for the Mini App: a fresh invoice link for WebApp.openInvoice.
 * Public and stateless: a link is only an offer to pay, so there is nothing to protect with initData.
 */
export async function tipInvoiceResponse(url: URL, createLink: (amount: number) => Promise<string>): Promise<Response> {
  const headers = { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" };
  const amount = parseTipAmount(url.searchParams.get("amount"));
  if (amount === null) return new Response(JSON.stringify({ error: "bad amount" }), { status: 400, headers });
  try {
    return new Response(JSON.stringify({ url: await createLink(amount) }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "telegram" }), { status: 502, headers });
  }
}
