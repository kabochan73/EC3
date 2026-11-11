import { describe, it, expect } from "vitest";
import { moveItem } from "@/shared/lib/array";

describe("moveItem", () => {
  it("要素を後ろに動かせる", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("要素を前に動かせる（▲ボタン相当）", () => {
    expect(moveItem(["a", "b", "c"], 2, 1)).toEqual(["a", "c", "b"]);
  });

  it("要素を1つ後ろに動かせる（▼ボタン相当）", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });

  it("先頭の要素をさらに前には動かせない（範囲外は元の配列のまま）", () => {
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
  });

  it("末尾の要素をさらに後ろには動かせない（範囲外は元の配列のまま）", () => {
    expect(moveItem(["a", "b", "c"], 2, 3)).toEqual(["a", "b", "c"]);
  });

  it("元の配列を変更しない", () => {
    const original = ["a", "b", "c"];
    moveItem(original, 0, 2);
    expect(original).toEqual(["a", "b", "c"]);
  });
});
