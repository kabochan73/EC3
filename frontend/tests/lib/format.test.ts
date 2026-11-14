import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatOrderStatus, formatYen } from "@/shared/lib/format";

describe("formatYen", () => {
  it("3桁ごとにカンマを入れて¥を先頭に付ける", () => {
    expect(formatYen(12000)).toBe("¥12,000");
  });

  it("1000未満でもカンマなしで表示する", () => {
    expect(formatYen(500)).toBe("¥500");
  });

  it("0も¥0として表示する", () => {
    expect(formatYen(0)).toBe("¥0");
  });
});

describe("formatDate", () => {
  it("「yyyy/mm/dd」の形で日本時間に変換する", () => {
    // UTC 2026-11-12T23:30:00 は JST 2026-11-13 8:30
    expect(formatDate("2026-11-12T23:30:00Z")).toBe("2026/11/13");
  });

  it("日本時間の深夜0〜9時のUTC日付をまたぐケースでも日本時間の日付になる", () => {
    // UTC 2026-11-12T16:00:00 は JST 2026-11-13 1:00（日付がまたぐ）
    expect(formatDate("2026-11-12T16:00:00Z")).toBe("2026/11/13");
  });

  it("nullなら「—」を返す", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("「yyyy/mm/dd hh:mm」の形で日本時間に変換する", () => {
    expect(formatDateTime("2026-11-12T23:30:00Z")).toBe("2026/11/13 08:30");
  });

  it("nullなら「—」を返す", () => {
    expect(formatDateTime(null)).toBe("—");
  });
});

describe("formatOrderStatus", () => {
  it("API・DBの値を日本語ラベルに変換する", () => {
    expect(formatOrderStatus("pending")).toBe("支払い待ち");
    expect(formatOrderStatus("paid")).toBe("支払い済み");
    expect(formatOrderStatus("shipped")).toBe("発送済み");
    expect(formatOrderStatus("completed")).toBe("完了");
    expect(formatOrderStatus("cancelled")).toBe("キャンセル済み");
  });
});
