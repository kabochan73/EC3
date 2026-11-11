// 配列の並べ替え（管理画面の▲▼ボタン等）に使う純粋な計算（docs/frontend/folder-structure.md）。

/** indexの要素をtoの位置へ動かした新しい配列を返す（元の配列は変更しない）。 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return items;
  }

  const result = [...items];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);

  return result;
}
