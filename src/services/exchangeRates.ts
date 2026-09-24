export const FX_CACHE_KEY = "komari-theme:fx-cny-v2";
export const FX_TTL = 86_400_000;
export const FX_URL = "https://api.frankfurter.dev/v1/latest?base=CNY";
export interface ExchangeRates { rates: Record<string, number>; updatedAt: number; date: string }
let pending: Promise<ExchangeRates> | undefined;
export function readExchangeRates(): ExchangeRates | undefined {
  try {
    const data = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "null");
    if (data && data.updatedAt > 0 && data.updatedAt <= Date.now() && typeof data.date === "string" && data.rates?.CNY === 1 && Object.values(data.rates).every(v => typeof v === "number" && Number.isFinite(v) && v > 0)) return data;
  } catch { /* Storage may be disabled. */ }
}
export function loadExchangeRates(): Promise<ExchangeRates> {
  const cached = readExchangeRates();
  if (cached && Date.now() - cached.updatedAt < FX_TTL) return Promise.resolve(cached);
  if (pending) return pending;
  pending = (async () => {
    const response = await fetch(FX_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Exchange rate request failed");
    const data = await response.json();
    if (data.base !== "CNY" || typeof data.date !== "string" || !data.rates || !data.rates.USD) throw new Error("Invalid exchange rates");
    const rates: Record<string, number> = { CNY: 1 };
    for (const [code, value] of Object.entries(data.rates)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error("Invalid exchange rate");
      rates[code] = 1 / value;
    }
    const result = { rates, updatedAt: Date.now(), date: data.date };
    try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify(result)); } catch { /* Fresh data remains usable without persistence. */ }
    return result;
  })().finally(() => { pending = undefined; });
  return pending;
}
export function currencyRate(currency: string, rates: Record<string, number>): number | undefined {
  const aliases: Record<string, string> = { "": "CNY", "¥": "CNY", "￥": "CNY", RMB: "CNY", "$": "USD", "US$": "USD", "€": "EUR", "£": "GBP", "HK$": "HKD", "円": "JPY", "JP¥": "JPY" };
  const code = currency.trim().toUpperCase();
  return rates[aliases[code] ?? code];
}
