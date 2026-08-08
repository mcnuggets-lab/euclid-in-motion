import katex from "katex";


type MathBlockProps = {
  expression: string;
};

export function MathBlock({ expression }: MathBlockProps) {
  const markup = katex.renderToString(expression, {
    displayMode: true,
    throwOnError: false,
  });

  return <div className="math-block" dangerouslySetInnerHTML={{ __html: markup }} />;
}
