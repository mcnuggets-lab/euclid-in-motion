import { Suspense } from "react";

import type { TheoremPage } from "@/data/catalog";
import { requireTheoremId } from "@/data/theoremCurriculum";
import {
  requireContextIllustrationId,
  requireCorollaryIllustrationId,
} from "@/data/theoremIllustrationIds";
import type { TheoremDiscovery } from "@/features/theorems/discovery";
import {
  contextIllustrationRegistry,
  corollaryIllustrationRegistry,
  theoremIllustrationRegistry,
  type TheoremIllustrationComponentProps,
} from "@/features/theorems/illustrationRegistry";

type TheoremIllustrationProps = TheoremIllustrationComponentProps & {
  theorem: TheoremPage;
};

type TheoremStepNavigationProps = {
  activeStep: number | null;
  discovery: TheoremDiscovery | null;
  onStepChange: (step: number | null) => void;
  theorem: TheoremPage;
};

type StepNavigationItem = number | "leading-ellipsis" | "trailing-ellipsis";

function IllustrationFallback() {
  return (
    <div className="theorem-figure__loading" role="status">
      Loading interactive figure…
    </div>
  );
}

function getStepNavigationItems(
  stepCount: number,
  activeStep: number | null,
): StepNavigationItem[] {
  const allSteps = Array.from({ length: stepCount }, (_, index) => index);
  if (stepCount <= 5) {
    return allSteps;
  }

  const currentStep = activeStep ?? 0;
  const lastStep = stepCount - 1;
  const nearbySteps = [currentStep - 1, currentStep, currentStep + 1].filter(
    (step) => step >= 0 && step <= lastStep,
  );
  const middleSteps = nearbySteps.filter((step) => step !== 0 && step !== lastStep);
  const firstNearbyStep = nearbySteps[0];
  const lastNearbyStep = nearbySteps.at(-1)!;

  return [
    0,
    ...(firstNearbyStep > 1 ? ["leading-ellipsis" as const] : []),
    ...middleSteps,
    ...(lastNearbyStep < lastStep - 1 ? ["trailing-ellipsis" as const] : []),
    lastStep,
  ];
}

export function TheoremIllustration({
  activeStep,
  onDiscoveryChange,
  theorem,
}: TheoremIllustrationProps) {
  const theoremId = requireTheoremId(theorem.id);
  const Illustration = theoremIllustrationRegistry[theoremId];

  return (
    <Suspense fallback={<IllustrationFallback />}>
      <Illustration
        activeStep={activeStep}
        onDiscoveryChange={onDiscoveryChange}
      />
    </Suspense>
  );
}

export function TheoremCorollaryIllustration({
  illustrationId,
}: {
  illustrationId?: string;
}) {
  if (!illustrationId) {
    return null;
  }

  const corollaryIllustrationId =
    requireCorollaryIllustrationId(illustrationId);
  const Illustration = corollaryIllustrationRegistry[corollaryIllustrationId];

  return (
    <Suspense fallback={<IllustrationFallback />}>
      <Illustration />
    </Suspense>
  );
}

export function TheoremContextIllustration({
  illustrationId,
}: {
  illustrationId?: string;
}) {
  if (!illustrationId) {
    return null;
  }

  const contextIllustrationId = requireContextIllustrationId(illustrationId);
  const Illustration = contextIllustrationRegistry[contextIllustrationId];

  return (
    <Suspense fallback={<IllustrationFallback />}>
      <Illustration />
    </Suspense>
  );
}

export function TheoremStepNavigation({
  activeStep,
  discovery,
  onStepChange,
  theorem,
}: TheoremStepNavigationProps) {
  const stepCount = theorem.proofSteps.length;
  const isExploring = activeStep === null;
  const isLastStep = activeStep === stepCount - 1;
  const navigationItems = getStepNavigationItems(stepCount, activeStep);
  const keepNavigationOnOneLine =
    theorem.id === "segment-angle-comparison" || theorem.proofSteps.length >= 5;

  if (!discovery) {
    return null;
  }

  return (
    <section className="theorem-discovery">
      <div className="theorem-discovery__header">
        <div>
          <strong>Theorem explorer</strong>
          <div className="theorem-discovery__count">
            {isExploring ? "Free exploration" : `Step ${activeStep + 1} of ${stepCount}`}
          </div>
        </div>
        <button
          aria-pressed={isExploring}
          className={
            isExploring
              ? "theorem-discovery__mode-button theorem-discovery__mode-button--active"
              : "theorem-discovery__mode-button"
          }
          onClick={() => onStepChange(null)}
          type="button"
        >
          Free explore
        </button>
      </div>

      <strong className="theorem-discovery__step-title">{discovery.title}</strong>
      {discovery.prompt ? (
        <p className="theorem-discovery__prompt">{discovery.prompt}</p>
      ) : null}
      <div className="theorem-discovery__insight">
        <strong>What the figure is showing</strong>
        <span>{discovery.insight}</span>
      </div>

      <div className="theorem-discovery__uses">
        {discovery.straightPair ? (
          <div className="theorem-discovery__chip">
            Straight angle: ∠{discovery.straightPair[0]} and ∠{discovery.straightPair[1]}
          </div>
        ) : null}
        {discovery.sharedAngle ? (
          <div className="theorem-discovery__chip">
            Shared angle: ∠{discovery.sharedAngle}
          </div>
        ) : null}
        {discovery.comparePair ? (
          <div className="theorem-discovery__chip">
            Compare: ∠{discovery.comparePair[0]} and ∠{discovery.comparePair[1]}
          </div>
        ) : null}
      </div>

      <div
        className={
          keepNavigationOnOneLine
            ? "theorem-discovery__footer theorem-discovery__footer--single-line"
            : "theorem-discovery__footer"
        }
      >
        <button
          className="theorem-discovery__button theorem-discovery__previous"
          disabled={isExploring}
          onClick={() =>
            onStepChange(activeStep === null || activeStep === 0 ? null : activeStep - 1)
          }
          type="button"
        >
          Previous
        </button>
        <nav
          aria-label="Discovery steps"
          className={
            keepNavigationOnOneLine
              ? "theorem-discovery__nav theorem-discovery__nav--single-line"
              : "theorem-discovery__nav"
          }
        >
          {navigationItems.map((item) => {
            if (typeof item !== "number") {
              return (
                <span
                  aria-hidden="true"
                  className="theorem-discovery__ellipsis"
                  key={item}
                >
                  …
                </span>
              );
            }

            const step = theorem.proofSteps[item];
            return (
              <button
                aria-current={item === activeStep ? "step" : undefined}
                className={
                  item === activeStep
                    ? "theorem-discovery__tab theorem-discovery__tab--active"
                    : "theorem-discovery__tab"
                }
                key={step.title}
                onClick={() => onStepChange(item)}
                type="button"
              >
                <span className="visually-hidden">{step.title}</span>
                {item + 1}
              </button>
            );
          })}
        </nav>
        <button
          className="theorem-discovery__button theorem-discovery__next"
          onClick={() =>
            onStepChange(isExploring ? 0 : isLastStep ? 0 : activeStep + 1)
          }
          type="button"
        >
          {isExploring ? "Start proof" : isLastStep ? "Restart" : "Next"}
        </button>
      </div>
    </section>
  );
}
