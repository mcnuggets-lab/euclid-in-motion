import { useId, type ReactNode } from "react";

import type { AxiomExplorationPage } from "@/data/catalog";
import { SASIllustration } from "@/features/axioms/illustrations/SASIllustration";


type AxiomExplorationIllustrationProps = {
  exploration: AxiomExplorationPage;
};

export function AxiomExplorationIllustration({
  exploration,
}: AxiomExplorationIllustrationProps) {
  const headingId = useId();
  let illustration: ReactNode = null;

  switch (exploration.id) {
    case "sas":
      illustration = <SASIllustration />;
      break;
    default:
      illustration = null;
  }

  if (!illustration) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="content-block">
      <span className="eyebrow">Interactive exploration</span>
      <strong id={headingId}>{exploration.title}</strong>
      <p>{exploration.explorationPrompt}</p>
      {illustration}
    </section>
  );
}
