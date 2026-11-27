import { describe, expect, it } from "vitest";
import { dictionaries, dirOf, LOCALES } from "../lib/i18n";
import { formatMoney, toCents } from "../lib/format";
import { NEXT, STATUSES } from "../lib/status";

const keys = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe("i18n", () => {
  it("French, English and Arabic define exactly the same keys", () => {
    const base = keys(dictionaries.fr).sort();
    for (const l of LOCALES) expect(keys(dictionaries[l]).sort()).toEqual(base);
  });
  it("no translation is empty", () => {
    for (const l of LOCALES) for (const k of keys(dictionaries[l])) {
      const v = k.split(".").reduce((o: any, p) => o[p], dictionaries[l]);
      expect(String(v).trim().length, `${l}:${k}`).toBeGreaterThan(0);
    }
  });
  it("Arabic is right-to-left, the others are not", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("fr")).toBe("ltr");
    expect(dirOf("en")).toBe("ltr");
  });
  it("every status has a label and an action label in every language", () => {
    for (const l of LOCALES) for (const s of STATUSES) expect(dictionaries[l].status[s]).toBeTruthy();
  });
});

describe("money", () => {
  it("converts user input to integer cents", () => {
    expect(toCents("249")).toBe(24900);
    expect(toCents("249,50")).toBe(24950);
    expect(toCents("19.99")).toBe(1999);
    expect(toCents("abc")).toBeNull();
    expect(toCents("-5")).toBeNull();
  });
  it("formats cents as MAD", () => {
    expect(formatMoney(24950, "en")).toContain("249.50");
  });
});

describe("status buttons", () => {
  it("final statuses offer no action", () => {
    expect(NEXT.delivered).toEqual([]);
    expect(NEXT.returned).toEqual([]);
  });
});
