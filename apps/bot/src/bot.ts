/** The bot itself, shared by the Bun server (local dev) and the Cloudflare Worker (production). */
import { Bot, InlineKeyboard } from "grammy";

export function createBot(token: string, webAppUrl: string): Bot {
  const bot = new Bot(token);
  bot.command("start", (ctx) =>
    ctx.reply("Белведер. Двенадцать этажей, если верить вывеске.\nНочь длится шестнадцать ходов.", {
      reply_markup: new InlineKeyboard().webApp("Войти в башню", webAppUrl),
    }),
  );
  return bot;
}
