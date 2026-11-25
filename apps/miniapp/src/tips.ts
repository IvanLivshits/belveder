/** Voluntary tips in Telegram Stars: the bot issues an invoice link, Telegram shows the payment sheet. */
import { openInvoice } from "./telegram";

const BOT_URL = (import.meta.env["VITE_BOT_URL"] as string | undefined) ?? "https://belvedere-bot.belvedere-miniapp.workers.dev";

/** Amounts in Stars; the labels are the game's, the bot only sees the number. */
export const TIPS = [
  { id: "coffee", label: "Кофе", amount: 50 },
  { id: "cigarettes", label: "Пачка сигарет", amount: 150 },
  { id: "bourbon", label: "Бутылка бурбона", amount: 500 },
];

/** True when the tip was paid. A closed sheet, a failed payment or a network error are all just "no". */
export async function payTip(amount: number): Promise<boolean> {
  try {
    const res = await fetch(`${BOT_URL.replace(/\/$/, "")}/invoice?amount=${amount}`);
    if (!res.ok) return false;
    const { url } = (await res.json()) as { url?: string };
    return typeof url === "string" && (await openInvoice(url)) === "paid";
  } catch {
    return false;
  }
}
