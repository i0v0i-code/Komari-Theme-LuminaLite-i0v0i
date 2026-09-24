import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { currencyRate, FX_CACHE_KEY, FX_TTL, loadExchangeRates, readExchangeRates } from "../exchangeRates";
const values = new Map<string, string>();
beforeEach(() => {
 values.clear();
 vi.stubGlobal("localStorage", { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string,v: string) => values.set(k,v) });
});
afterEach(() => vi.unstubAllGlobals());
const cache = (age: number) => values.set(FX_CACHE_KEY, JSON.stringify({rates:{CNY:1,USD:7},date:"2026-09-23",updatedAt:Date.now()-age}));
it("uses fresh cache without a request", async()=>{cache(1000); const fetch=vi.fn();vi.stubGlobal("fetch",fetch);expect((await loadExchangeRates()).rates.USD).toBe(7);expect(fetch).not.toHaveBeenCalled()});
it("deduplicates requests and converts quote rates to CNY",async()=>{const fetch=vi.fn(async()=>({ok:true,json:async()=>({base:"CNY",date:"2026-09-23",rates:{USD:0.125,EUR:0.1}})}));vi.stubGlobal("fetch",fetch);const [a,b]=await Promise.all([loadExchangeRates(),loadExchangeRates()]);expect(a).toEqual(b);expect(fetch).toHaveBeenCalledTimes(1);expect(currencyRate("$",a.rates)).toBe(8);expect(currencyRate("€",a.rates)).toBe(10);expect(readExchangeRates()).toEqual(a)});
it("retains expired cache on a failed refresh",async()=>{cache(FX_TTL+1);vi.stubGlobal("fetch",vi.fn(async()=>{throw Error("offline")}));await expect(loadExchangeRates()).rejects.toThrow();expect(readExchangeRates()?.rates.USD).toBe(7)});
it("does not invent unknown currency rates",()=>{expect(currencyRate("UNKNOWN",{CNY:1})).toBeUndefined()});
it("rejects malformed responses without replacing old cache",async()=>{cache(FX_TTL+1);vi.stubGlobal("fetch",vi.fn(async()=>({ok:true,json:async()=>({base:"USD",rates:{USD:1}})})));await expect(loadExchangeRates()).rejects.toThrow();expect(readExchangeRates()?.rates.USD).toBe(7)});
