import { expect, test } from "bun:test";
import { parseTipAmount, TIP_MAX, tipInvoiceResponse } from "../src/bot";

const at = (query: string) => new URL(`https://bot.example/invoice${query}`);

test("tip amount is a whole number of Stars within the limit", () => {
  expect(parseTipAmount("50")).toBe(50);
  expect(parseTipAmount(String(TIP_MAX))).toBe(TIP_MAX);
  for (const bad of [null, "", "0", "-5", "1.5", "050", "1e3", "abc", String(TIP_MAX + 1)]) expect(parseTipAmount(bad)).toBeNull();
});

test("invoice endpoint returns a link the Mini App may read from another origin", async () => {
  const res = await tipInvoiceResponse(at("?amount=150"), async (amount) => `https://t.me/$invoice-${amount}`);
  expect(res.status).toBe(200);
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
  expect(await res.json()).toEqual({ url: "https://t.me/$invoice-150" });
});

test("invoice endpoint refuses a bad amount without asking Telegram", async () => {
  let asked = false;
  const res = await tipInvoiceResponse(at("?amount=0"), async () => { asked = true; return ""; });
  expect(res.status).toBe(400);
  expect(asked).toBe(false);
});

test("invoice endpoint reports a Telegram failure as 502", async () => {
  const res = await tipInvoiceResponse(at("?amount=50"), async () => { throw new Error("down"); });
  expect(res.status).toBe(502);
});
