/** 円の金額を「¥12,000」の形にする */
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
