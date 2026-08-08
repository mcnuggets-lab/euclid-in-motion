import { useState } from "react";

import { guideById } from "@/data/catalog";
import {
  AxiomExplorationPage,
  AxiomIndexPage,
  AxiomPage,
} from "@/features/content/AxiomPages";
import { resolvePage } from "@/features/content/contentRouting";
import { HomePage, NotFoundPage } from "@/features/content/StaticPages";
import {
  TheoremIndexPage,
  TheoremPage,
} from "@/features/content/TheoremPages";
import { GuideView } from "@/features/guides/GuideView";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

export { resolvePage } from "@/features/content/contentRouting";

export function ContentView({
  onNavigate,
  path,
}: {
  onNavigate: (path: string) => void;
  path: string;
}) {
  const page = resolvePage(path);
  const [activeTheoremStep, setActiveTheoremStep] = useState<number | null>(null);
  const [theoremDiscovery, setTheoremDiscovery] = useState<TheoremDiscovery | null>(null);

  switch (page.kind) {
    case "home":
      return <HomePage onNavigate={onNavigate} />;
    case "axiom-index":
      return <AxiomIndexPage onNavigate={onNavigate} />;
    case "axiom-page":
      return <AxiomPage axiomId={page.axiomId} onNavigate={onNavigate} />;
    case "axiom-exploration-page":
      return (
        <AxiomExplorationPage
          explorationPath={page.explorationPath}
          onNavigate={onNavigate}
        />
      );
    case "guide-page": {
      const guide = guideById.get(page.guideId);
      return guide ? <GuideView guide={guide} onNavigate={onNavigate} /> : null;
    }
    case "theorem-index":
      return <TheoremIndexPage onNavigate={onNavigate} />;
    case "theorem-page":
      return (
        <TheoremPage
          activeStep={activeTheoremStep}
          discovery={theoremDiscovery}
          onDiscoveryChange={setTheoremDiscovery}
          onNavigate={onNavigate}
          onStepChange={setActiveTheoremStep}
          theoremId={page.theoremId}
        />
      );
    case "not-found":
      return <NotFoundPage />;
  }
}
