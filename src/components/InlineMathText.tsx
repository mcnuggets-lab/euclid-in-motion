import katex from "katex";

import type { Definition } from "@/data/catalog";
import { DefinitionText } from "@/components/DefinitionText";

type InlineMathTextProps = {
  definitions: Definition[];
  text: string;
};

const inlineMathPattern = /(\\\(.+?\\\))/g;

export function InlineMathText({ definitions, text }: InlineMathTextProps) {
  return (
    <>
      {text.split(inlineMathPattern).map((part, index) => {
        if (part.startsWith("\\(") && part.endsWith("\\)")) {
          const markup = katex.renderToString(part.slice(2, -2), {
            displayMode: false,
            throwOnError: false,
          });

          return (
            <span
              className="inline-math"
              dangerouslySetInnerHTML={{ __html: markup }}
              key={`${part}-${index}`}
            />
          );
        }

        return <DefinitionText definitions={definitions} key={`${part}-${index}`} text={part} />;
      })}
    </>
  );
}
