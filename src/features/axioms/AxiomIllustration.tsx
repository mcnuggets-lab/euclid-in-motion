import { useId, type ReactNode } from "react";

import type { AxiomPage } from "@/data/catalog";
import { CongruenceIllustration } from "@/features/axioms/illustrations/CongruenceIllustration";
import { ContinuityIllustration } from "@/features/axioms/illustrations/ContinuityIllustration";
import { IncidenceIllustration } from "@/features/axioms/illustrations/IncidenceIllustration";
import { OrderIllustration } from "@/features/axioms/illustrations/OrderIllustration";
import { ParallelsIllustration } from "@/features/axioms/illustrations/ParallelsIllustration";
import { ProtractorIllustration } from "@/features/axioms/illustrations/ProtractorIllustration";


type IllustrationProps = {
  axiom: AxiomPage;
};

export function AxiomIllustration({ axiom }: IllustrationProps) {
  const headingId = useId();

  let illustration: ReactNode = null;

  switch (axiom.id) {
    case "incidence":
      illustration = <IncidenceIllustration />;
      break;
    case "order":
      illustration = <OrderIllustration />;
      break;
    case "congruence":
      illustration = <CongruenceIllustration />;
      break;
    case "parallels":
      illustration = <ParallelsIllustration />;
      break;
    case "continuity":
      illustration = <ContinuityIllustration />;
      break;
    case "protractor":
      illustration = <ProtractorIllustration />;
      break;
    default:
      illustration = null;
  }

  if (!illustration) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="content-block">
      <strong id={headingId}>Illustration</strong>
      {illustration}
    </section>
  );
}
