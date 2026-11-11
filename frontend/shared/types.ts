// APIの共通ラッパー型のみ。ドメインの型は各featureのtypes.tsに置く
// （docs/frontend/component-types.md）。

export type ApiResource<T> = { data: T };
export type ApiCollection<T> = { data: T[] };
