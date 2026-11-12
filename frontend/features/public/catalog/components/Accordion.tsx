type Props = {
  title: string;
  children: React.ReactNode;
};

/** 商品詳細のアコーディオン1項目。JS不要の<details>/<summary>（Server Componentのまま使える）。 */
export function Accordion({ title, children }: Props) {
  return (
    <details className="py-4">
      <summary className="cursor-pointer list-none text-xs tracking-widest uppercase">
        {title}
      </summary>
      <div className="mt-3 text-sm leading-loose text-graphite">{children}</div>
    </details>
  );
}
