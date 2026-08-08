import { useEffect, useId, useState } from "react";
import "./styles/crossbar.css";

import {
  clamp,
  distance,
  getSvgCoordinates,
  lineEndpointsFromPoints,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";


type CrossbarIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type FocusState = {
  conclusion: boolean;
  extension: boolean;
  pasch: boolean;
  premise: boolean;
  qcBranch: boolean;
};

type CrossbarStep = TheoremDiscovery & {
  focus: FocusState;
};

const vertexA = { x: 120, y: 160 };
const vertexB = { x: 272, y: 84 };
const vertexC = { x: 56, y: 52 };
const qFactor = -0.36;
const interiorMargin = 0.12;
const sliderMin = 0;
const sliderMax = 100;
const handleRadius = 22;
const rayReach = 280;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function pointBetween(first: Point, second: Point, amount: number) {
  return {
    x: first.x + (second.x - first.x) * amount,
    y: first.y + (second.y - first.y) * amount,
  };
}

function offsetLabel(point: Point, dx: number, dy: number) {
  return { x: point.x + dx, y: point.y + dy };
}

function barycentricCoordinates(point: Point, a: Point, b: Point, c: Point) {
  const denominator =
    (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);

  if (Math.abs(denominator) < 1e-6) {
    return [1 / 3, 1 / 3, 1 / 3] as const;
  }

  const weightA =
    ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) /
    denominator;
  const weightB =
    ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) /
    denominator;
  const weightC = 1 - weightA - weightB;

  return [weightA, weightB, weightC] as const;
}

function normalizeWeights(weights: readonly number[]) {
  const positive = weights.map((weight) => Math.max(weight, 0));
  const total = positive.reduce((sum, weight) => sum + weight, 0);

  if (total <= 1e-6) {
    return [1 / 3, 1 / 3, 1 / 3];
  }

  return positive.map((weight) => weight / total);
}

function enforceInteriorWeights(weights: readonly number[], minimum: number) {
  const normalized = normalizeWeights(weights);
  const result = [0, 0, 0];
  let remainingTotal = 1;
  let freeIndices = [0, 1, 2];

  // Preserve the current proportions while keeping every weight strictly interior.
  while (freeIndices.length > 0) {
    const freeTotal = freeIndices.reduce(
      (sum, index) => sum + normalized[index],
      0,
    );

    if (freeTotal <= 1e-6) {
      const share = remainingTotal / freeIndices.length;
      freeIndices.forEach((index) => {
        result[index] = share;
      });
      break;
    }

    freeIndices.forEach((index) => {
      result[index] = (normalized[index] / freeTotal) * remainingTotal;
    });

    const belowMinimum = freeIndices.filter(
      (index) => result[index] < minimum - 1e-6,
    );

    if (belowMinimum.length === 0) {
      break;
    }

    belowMinimum.forEach((index) => {
      result[index] = minimum;
    });
    remainingTotal -= belowMinimum.length * minimum;
    freeIndices = freeIndices.filter((index) => !belowMinimum.includes(index));
  }

  return result as [number, number, number];
}

function weightsFromSliders(towardB: number, towardC: number) {
  const bRatio = towardB / sliderMax;
  const cRatio = towardC / sliderMax;
  const interiorMass = 1 - interiorMargin * 3;
  const weightC = interiorMargin + interiorMass * cRatio;
  const remainingMass = interiorMass * (1 - cRatio);
  const weightB = interiorMargin + remainingMass * bRatio;
  const weightA = interiorMargin + remainingMass * (1 - bRatio);

  return [weightA, weightB, weightC] as const;
}

function slidersFromWeights(weights: readonly number[]) {
  const interiorMass = 1 - interiorMargin * 3;
  const towardC = clamp(
    ((weights[2] - interiorMargin) / interiorMass) * sliderMax,
    sliderMin,
    sliderMax,
  );
  const remainingMass = interiorMass * (1 - towardC / sliderMax);
  const towardB =
    remainingMass <= 1e-6
      ? sliderMax / 2
      : clamp(
          ((weights[1] - interiorMargin) / remainingMass) * sliderMax,
          sliderMin,
          sliderMax,
        );

  return { towardB, towardC };
}

function weightedPoint(
  [weightA, weightB, weightC]: readonly number[],
  a: Point,
  b: Point,
  c: Point,
) {
  return {
    x: a.x * weightA + b.x * weightB + c.x * weightC,
    y: a.y * weightA + b.y * weightB + c.y * weightC,
  };
}

function lineIntersection(first: Point, second: Point, third: Point, fourth: Point) {
  const denominator =
    (first.x - second.x) * (third.y - fourth.y) -
    (first.y - second.y) * (third.x - fourth.x);

  if (Math.abs(denominator) < 1e-6) {
    return pointBetween(third, fourth, 0.5);
  }

  const firstDeterminant = first.x * second.y - first.y * second.x;
  const secondDeterminant = third.x * fourth.y - third.y * fourth.x;

  return {
    x:
      (firstDeterminant * (third.x - fourth.x) -
        (first.x - second.x) * secondDeterminant) /
      denominator,
    y:
      (firstDeterminant * (third.y - fourth.y) -
        (first.y - second.y) * secondDeterminant) /
      denominator,
  };
}

function pointClass(
  pointType: "derived" | "draggable" | "fixed",
  isFocused = false,
) {
  return [
    "crossbar__point",
    `crossbar__point--${pointType}`,
    isFocused ? "crossbar__point--focused" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function panelClass(isExploring: boolean, isFocused: boolean) {
  if (isExploring || isFocused) {
    return "crossbar__panel";
  }

  return "crossbar__panel crossbar__panel--muted";
}

function routeClass(isBlocked: boolean, isActive: boolean) {
  return [
    "crossbar__route-chip",
    isBlocked ? "crossbar__route-chip--blocked" : "",
    isActive ? "crossbar__route-chip--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function CrossbarIllustration({
  activeStep,
  onDiscoveryChange,
}: CrossbarIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [towardB, setTowardB] = useState(46);
  const [towardC, setTowardC] = useState(34);
  const [isDragging, setIsDragging] = useState(false);

  const pointQ = pointBetween(vertexA, vertexB, qFactor);
  const safeWeights = weightsFromSliders(towardB, towardC);
  const pointD = weightedPoint(safeWeights, vertexA, vertexB, vertexC);
  const pointE = lineIntersection(vertexA, pointD, vertexB, vertexC);
  const fullLineAD = lineEndpointsFromPoints(vertexA, pointD);
  const rayDirection = {
    x: pointD.x - vertexA.x,
    y: pointD.y - vertexA.y,
  };
  const rayLength = Math.hypot(rayDirection.x, rayDirection.y) || 1;
  const rayEnd = {
    x: vertexA.x + (rayDirection.x / rayLength) * rayReach,
    y: vertexA.y + (rayDirection.y / rayLength) * rayReach,
  };
  const bePercent = (distance(vertexB, pointE) / distance(vertexB, vertexC)) * 100;
  const cePercent = 100 - bePercent;
  const isExploring = activeStep === null;

  const explorationStep: CrossbarStep = {
    focus: {
      conclusion: true,
      extension: true,
      pasch: true,
      premise: true,
      qcBranch: true,
    },
    insight: `D stays inside ∠BAC, so ray AD reaches BC at E. Right now E sits about ${formatPercent(
      bePercent,
    )} of the way from B toward C.`,
    prompt: "Drag D or use the sliders. Watch E slide along BC as the ray stays inside the angle.",
    title: "Explore the figure",
  };
  const proofSteps: CrossbarStep[] = [
    {
      focus: {
        conclusion: false,
        extension: true,
        pasch: false,
        premise: true,
        qcBranch: false,
      },
      insight:
        "Extend AB past A to Q so A lies between Q and B. That gives the larger triangle QBC while keeping the original ray from A to D unchanged.",
      prompt:
        "Locate the dashed extension through A. The proof starts by replacing side AB with the longer side QB of triangle QBC.",
      title: "Extend AB past A to Q",
    },
    {
      focus: {
        conclusion: false,
        extension: true,
        pasch: true,
        premise: true,
        qcBranch: false,
      },
      insight:
        "In triangle QBC, the line through A and D meets side QB at A and avoids Q, B, and C, so Pasch leaves only two exits: QC or BC.",
      prompt:
        "Watch the full dashed line through A and D. It enters triangle QBC through side QB at A, so it must leave through exactly one of the two highlighted candidate sides.",
      title: "Use plane separation on triangle QBC",
    },
    {
      focus: {
        conclusion: false,
        extension: true,
        pasch: true,
        premise: true,
        qcBranch: true,
      },
      insight:
        "D stays on the same side of AC as B, while Q lies on the opposite side. Points on ray AD stay with D's side of AC, so the QC branch is impossible.",
      prompt:
        "Compare side AC with the route chips: QC is crossed out because reaching QC would force the ray to cross into Q's half-plane first.",
      title: "Rule out the QC branch",
    },
    {
      focus: {
        conclusion: true,
        extension: true,
        pasch: true,
        premise: true,
        qcBranch: true,
      },
      insight: `Only BC remains, so ray AD meets BC at E. E lies between B and C, about ${formatPercent(
        bePercent,
      )} from B and ${formatPercent(cePercent)} from C.`,
      prompt:
        "Follow the solid ray from A through D to the derived point E. That is the required crossbar hit on the opposite side.",
      title: "Conclude the hit lies on BC",
    },
  ];
  const currentStep = isExploring ? explorationStep : proofSteps[activeStep];
  const figureDescription = isExploring
    ? "Fixed scalene triangle ABC has A at the lower left, B at the right, and C at the upper left. Draggable point D stays strictly inside triangle ABC, which keeps it inside angle BAC. Ray AD meets segment BC at derived point E, which lies between B and C."
    : "Fixed scalene triangle ABC has A at the lower left, B at the right, and C at the upper left. Point Q lies on the extension of AB past A, with A between Q and B. Draggable point D stays strictly inside triangle ABC, which keeps it inside angle BAC. Ray AD meets segment BC at derived point E, which lies between B and C.";
  const liveStatus = isExploring
    ? `Crossbar status: D is inside angle BAC. E is ${formatPercent(
        bePercent,
      )} of the way from B toward C on segment BC.`
    : `Crossbar proof status: D is inside angle BAC. Q, A, and B are collinear. E is ${formatPercent(
        bePercent,
      )} of the way from B toward C on segment BC.`;
  const [announcedStatus, setAnnouncedStatus] = useState(liveStatus);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAnnouncedStatus(liveStatus);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [liveStatus]);

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [
    bePercent,
    cePercent,
    currentStep.insight,
    currentStep.prompt,
    currentStep.title,
    onDiscoveryChange,
    pointD.x,
    pointD.y,
  ]);

  return (
    <div className="theorem-figure crossbar">
      <div className={panelClass(isExploring, currentStep.focus.premise)}>
        <div
          className={
            isExploring
              ? "crossbar__badge-row crossbar__badge-row--exploring"
              : "crossbar__badge-row"
          }
        >
          <div className="crossbar__badge">
            <strong>Premise</strong>
            <span>D is inside ∠BAC</span>
          </div>
          {!isExploring ? (
            <div
              className={[
                "crossbar__badge",
                !currentStep.focus.extension ? "crossbar__badge--muted" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <strong>Extension</strong>
              <span>A lies between Q and B</span>
            </div>
          ) : null}
          <div
            className={[
              "crossbar__badge",
              !isExploring && !currentStep.focus.conclusion
                ? "crossbar__badge--muted"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>Result</strong>
            <span>E lies between B and C</span>
          </div>
        </div>
      </div>

      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg crossbar__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (!isDragging) {
            return;
          }

          const point = getSvgCoordinates(event.currentTarget, event);
          const nextWeights = enforceInteriorWeights(
            barycentricCoordinates(point, vertexA, vertexB, vertexC),
            interiorMargin,
          );
          const nextSliders = slidersFromWeights(nextWeights);
          setTowardB(nextSliders.towardB);
          setTowardC(nextSliders.towardC);
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Crossbar theorem interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        {!isExploring && currentStep.focus.pasch ? (
          <line
            className="crossbar__pasch-line"
            x1={fullLineAD.x1}
            x2={fullLineAD.x2}
            y1={fullLineAD.y1}
            y2={fullLineAD.y2}
          />
        ) : null}

        <line
          className="crossbar__edge crossbar__edge--accent"
          x1={vertexA.x}
          x2={vertexB.x}
          y1={vertexA.y}
          y2={vertexB.y}
        />
        <line
          className="crossbar__edge"
          x1={vertexA.x}
          x2={vertexC.x}
          y1={vertexA.y}
          y2={vertexC.y}
        />
        <line
          className={
            currentStep.focus.conclusion
              ? "crossbar__edge crossbar__edge--opposite crossbar__edge--opposite-active"
              : "crossbar__edge crossbar__edge--opposite"
          }
          x1={vertexB.x}
          x2={vertexC.x}
          y1={vertexB.y}
          y2={vertexC.y}
        />
        {!isExploring ? (
          <>
            <line
              className={
                currentStep.focus.extension
                  ? "crossbar__edge crossbar__edge--extension crossbar__edge--extension-active"
                  : "crossbar__edge crossbar__edge--extension"
              }
              x1={vertexA.x}
              x2={pointQ.x}
              y1={vertexA.y}
              y2={pointQ.y}
            />
            <line
              className={
                currentStep.focus.pasch
                  ? "crossbar__edge crossbar__edge--candidate crossbar__edge--candidate-active"
                  : "crossbar__edge crossbar__edge--candidate"
              }
              x1={pointQ.x}
              x2={vertexC.x}
              y1={pointQ.y}
              y2={vertexC.y}
            />
          </>
        ) : null}
        <line
          className="crossbar__ray"
          x1={vertexA.x}
          x2={rayEnd.x}
          y1={vertexA.y}
          y2={rayEnd.y}
        />

        {!isExploring && currentStep.focus.qcBranch ? (
          <>
            <line
              className="crossbar__blocked-mark"
              x1="62"
              x2="90"
              y1="136"
              y2="108"
            />
            <line
              className="crossbar__blocked-mark"
              x1="62"
              x2="90"
              y1="108"
              y2="136"
            />
          </>
        ) : null}

        {!isExploring ? (
          <circle
            className={
              currentStep.focus.pasch
                ? "crossbar__intersection-ring crossbar__intersection-ring--active"
                : "crossbar__intersection-ring"
            }
            cx={vertexA.x}
            cy={vertexA.y}
            r="10"
          />
        ) : null}

        <circle className={pointClass("fixed")} cx={vertexA.x} cy={vertexA.y} r="4.5" />
        <circle className={pointClass("fixed")} cx={vertexB.x} cy={vertexB.y} r="4.5" />
        <circle className={pointClass("fixed")} cx={vertexC.x} cy={vertexC.y} r="4.5" />
        {!isExploring ? (
          <circle
            className={pointClass("fixed", currentStep.focus.extension)}
            cx={pointQ.x}
            cy={pointQ.y}
            r="4.5"
          />
        ) : null}
        <circle
          className="crossbar__handle-target"
          cx={pointD.x}
          cy={pointD.y}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
          }}
          r={handleRadius}
        />
        <circle
          className={pointClass("draggable", isDragging)}
          cx={pointD.x}
          cy={pointD.y}
          pointerEvents="none"
          r="7"
        />
        <circle
          className={pointClass("derived", currentStep.focus.conclusion)}
          cx={pointE.x}
          cy={pointE.y}
          r="6"
        />

        <text className="crossbar__point-label" x={offsetLabel(vertexA, 10, 18).x} y={offsetLabel(vertexA, 10, 18).y}>
          A
        </text>
        <text className="crossbar__point-label" x={offsetLabel(vertexB, 10, -10).x} y={offsetLabel(vertexB, 10, -10).y}>
          B
        </text>
        <text className="crossbar__point-label" x={offsetLabel(vertexC, -16, -10).x} y={offsetLabel(vertexC, -16, -10).y}>
          C
        </text>
        {!isExploring ? (
          <text className="crossbar__point-label" x={offsetLabel(pointQ, -18, -8).x} y={offsetLabel(pointQ, -18, -8).y}>
            Q
          </text>
        ) : null}
        <text className="crossbar__point-label" x={offsetLabel(pointD, 10, -12).x} y={offsetLabel(pointD, 10, -12).y}>
          D
        </text>
        <text className="crossbar__point-label" x={offsetLabel(pointE, 10, -8).x} y={offsetLabel(pointE, 10, -8).y}>
          E
        </text>
      </svg>

      <div
        className={
          isExploring
            ? "crossbar__summary crossbar__summary--exploring theorem-figure__summary"
            : "crossbar__summary theorem-figure__summary"
        }
      >
        <div className="theorem-measure theorem-measure--accent">
          <strong>Given</strong>
          <span>D stays inside ∠BAC</span>
        </div>
        {!isExploring ? (
          <div
            className={[
              "theorem-measure",
              currentStep.focus.qcBranch
                ? "crossbar__summary-card--blocked"
                : "theorem-measure--secondary",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>Rejected branch</strong>
            <span>{currentStep.focus.qcBranch ? "QC is blocked" : "QC is still a candidate"}</span>
          </div>
        ) : null}
        <div className="theorem-measure">
          <strong>Derived point</strong>
          <span>E lies between B and C</span>
        </div>
      </div>

      {!isExploring ? (
        <div className={panelClass(false, currentStep.focus.pasch || currentStep.focus.qcBranch)}>
          <div className="crossbar__route-heading">
            <strong>Pasch options in triangle QBC</strong>
            <span>
              {currentStep.focus.qcBranch
                ? "The half-plane argument removes QC, so BC is the only surviving exit."
                : "Once the line through A and D enters QBC through QB, the remaining choices are QC or BC."}
            </span>
          </div>
          <div className="crossbar__route-list" aria-hidden="true">
            <div
              className={routeClass(
                currentStep.focus.qcBranch,
                !currentStep.focus.qcBranch,
              )}
            >
              <span className="crossbar__route-swatch crossbar__route-swatch--dashed" />
              <strong>QC</strong>
              <span>{currentStep.focus.qcBranch ? "blocked" : "candidate"}</span>
            </div>
            <div
              className={routeClass(
                false,
                currentStep.focus.conclusion || currentStep.focus.pasch,
              )}
            >
              <span className="crossbar__route-swatch crossbar__route-swatch--solid" />
              <strong>BC</strong>
              <span>{currentStep.focus.conclusion ? "contains E" : "candidate"}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="crossbar__controls">
        <label className="crossbar__control">
          <span>
            <strong>Toward B</strong>
            <span>{formatPercent(towardB)}</span>
          </span>
          <input
            aria-label="Move D toward vertex B"
            max={sliderMax}
            min={sliderMin}
            onChange={(event) => setTowardB(Number(event.target.value))}
            type="range"
            value={towardB}
          />
        </label>
        <label className="crossbar__control">
          <span>
            <strong>Toward C</strong>
            <span>{formatPercent(towardC)}</span>
          </span>
          <input
            aria-label="Move D toward vertex C"
            max={sliderMax}
            min={sliderMin}
            onChange={(event) => setTowardC(Number(event.target.value))}
            type="range"
            value={towardC}
          />
        </label>
      </div>

      <div className="crossbar__status theorem-figure__note">
        D is constrained strictly inside triangle ABC, so the figure always keeps
        the ray premise valid while E is derived from the ray-side intersection.
      </div>
      <div aria-live="polite" className="visually-hidden">
        {announcedStatus}
      </div>
    </div>
  );
}
