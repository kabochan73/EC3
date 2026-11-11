type Props = {
  body: string;
};

/** ブランドコンセプト文（3〜4行、余白広め、中央寄せ）。空ならセクションごと出さない（docs/frontend/cms.md）。 */
export function BrandConcept({ body }: Props) {
  if (!body) return null;

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      {body.split("\n").map((line, index) => (
        <p key={index} className="text-sm leading-loose tracking-wide">
          {line}
        </p>
      ))}
    </section>
  );
}
