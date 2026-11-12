import { describe, it, expect } from "vitest";
import { formatYen } from "@/shared/lib/format";

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
