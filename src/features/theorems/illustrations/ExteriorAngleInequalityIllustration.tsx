import { useEffect, useId, useState } from "react";
import "./styles/exterior-angle-inequality.css";

import {
  angleFrom,
  classNames,
  clamp,
  getSvgCoordinates,
  pointAlong,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type ExteriorAngleInequalityIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ExteriorStep = TheoremDiscovery & {
  focus:
    | "comparison"
    | "first-construction"
    | "first-sas"
    | "first-result"
    | "second-construction"
    | "second-result"
    | "conclusion";
};

type ArcData = {
  label: Point;
  path: string;
};

const proofBaseY = 122;
const proofPointB = { x: 62, y: proofBaseY };
const proofPointC = { x: 205, y: proofBaseY };
const proofPointD = { x: 285, y: proofBaseY };
const exploreBaseY = 150;
const explorePointB = { x: 40, y: exploreBaseY };
const explorePointC = { x: 220, y: exploreBaseY };
const explorePointD = { x: 305, y: exploreBaseY };
const minimumApexOffset = -25;
const maximumApexOffset = 15;
const initialApexOffset = -12;
const minimumApexHeight = 52;
const maximumApexHeight = 78;
const initialApexHeight = 68;
const explorationHeightScale = 1.35;
const handleRadius = 22;

function reflectedPoint(point: Point, center: Point): Point {
  return {
    x: center.x * 2 - point.x,
    y: center.y * 2 - point.y,
  };
}

function normalizeRadians(value: number) {
  const fullTurn = Math.PI * 2;
  return ((value % fullTurn) + fullTurn) % fullTurn;
}

function minorArc(
  vertex: Point,
  first: Point,
  second: Point,
  radius: number,
  labelRadius = radius + 13,
): ArcData {
  const firstAngle = normalizeRadians(angleFrom(vertex, first));
  const secondAngle = normalizeRadians(angleFrom(vertex, second));
  let startAngle = firstAngle;
  let delta = normalizeRadians(secondAngle - firstAngle);

  if (delta > Math.PI) {
    startAngle = secondAngle;
    delta = Math.PI * 2 - delta;
  }

  const endAngle = startAngle + delta;
  const start = polarPoint(vertex, radius, startAngle);
  const end = polarPoint(vertex, radius, endAngle);

  return {
    label: polarPoint(vertex, labelRadius, startAngle + delta / 2),
    path: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`,
  };
}

function angleSize(vertex: Point, first: Point, second: Point) {
  const firstAngle = angleFrom(vertex, first);
  const secondAngle = angleFrom(vertex, second);
  let difference = Math.abs(firstAngle - secondAngle) % (Math.PI * 2);
  if (difference > Math.PI) {
    difference = Math.PI * 2 - difference;
  }
  return (difference * 180) / Math.PI;
}

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function tickEndpoints(
  first: Point,
  second: Point,
  fraction: number,
  size = 5.5,
) {
  const center = pointAlong(first, second, fraction);
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: (-dy / length) * size, y: (dx / length) * size };

  return {
    x1: center.x - normal.x,
    x2: center.x + normal.x,
    y1: center.y - normal.y,
    y2: center.y + normal.y,
  };
}

function apexPositionLabel(offset: number) {
  if (offset === 0) {
    return "centered over the base";
  }
  return `${Math.abs(offset)} units ${offset < 0 ? "left" : "right"} of center`;
}

export function ExteriorAngleInequalityIllustration({
  activeStep,
  onDiscoveryChange,
}: ExteriorAngleInequalityIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const positionControlId = useId();
  const heightControlId = useId();
  const [apexOffset, setApexOffset] = useState(initialApexOffset);
  const [apexHeight, setApexHeight] = useState(initialApexHeight);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const pointB = isExploring ? explorePointB : proofPointB;
  const pointC = isExploring ? explorePointC : proofPointC;
  const pointD = isExploring ? explorePointD : proofPointD;
  const pointA = isExploring
    ? {
        x: (explorePointB.x + explorePointC.x) / 2 + apexOffset,
        y: exploreBaseY - apexHeight * explorationHeightScale,
      }
    : {
        x: (proofPointB.x + proofPointC.x) / 2 + apexOffset,
        y: proofBaseY - apexHeight,
      };
  const pointM = pointAlong(pointA, pointC, 0.5);
  const pointE = reflectedPoint(pointB, pointM);
  const pointN = pointAlong(pointB, pointC, 0.5);
  const pointH = reflectedPoint(pointA, pointN);
  const pointF = {
    x: pointC.x + (pointC.x - pointA.x) * 0.48,
    y: pointC.y + (pointC.y - pointA.y) * 0.48,
  };

  const firstRemoteSize = angleSize(pointA, pointB, pointC);
  const secondRemoteSize = angleSize(pointB, pointA, pointC);
  const exteriorSize = angleSize(pointC, pointA, pointD);
  const firstRemainderSize = exteriorSize - firstRemoteSize;
  const secondRemainderSize = exteriorSize - secondRemoteSize;

  const arcScale = isExploring ? 1.24 : 1;
  const firstRemoteArc = minorArc(
    pointA,
    pointB,
    pointC,
    18 * arcScale,
    30 * arcScale,
  );
  const secondRemoteArc = minorArc(
    pointB,
    pointA,
    pointC,
    19 * arcScale,
    30 * arcScale,
  );
  const exteriorArc = minorArc(
    pointC,
    pointA,
    pointD,
    22 * arcScale,
    34 * arcScale,
  );
  const firstCopiedArc = minorArc(pointC, pointM, pointE, 15, 24);
  const firstRemainderArc = minorArc(pointC, pointE, pointD, 19, 29);
  const secondExteriorArc = minorArc(pointC, pointB, pointF, 22, 33);
  const secondCopiedArc = minorArc(pointC, pointN, pointH, 15, 24);
  const secondRemainderArc = minorArc(pointC, pointH, pointF, 19, 29);
  const firstVerticalArc = minorArc(pointM, pointA, pointB, 10, 16);
  const firstOppositeVerticalArc = minorArc(pointM, pointC, pointE, 10, 16);
  const secondVerticalArc = minorArc(pointN, pointB, pointA, 10, 16);
  const secondOppositeVerticalArc = minorArc(pointN, pointC, pointH, 10, 16);

  const firstMidpointTicks = [
    tickEndpoints(pointA, pointM, 0.5),
    tickEndpoints(pointM, pointC, 0.5),
  ];
  const firstCopyTicks = [
    tickEndpoints(pointB, pointM, 0.47),
    tickEndpoints(pointB, pointM, 0.57),
    tickEndpoints(pointM, pointE, 0.43),
    tickEndpoints(pointM, pointE, 0.53),
  ];
  const secondMidpointTicks = [
    tickEndpoints(pointB, pointN, 0.5),
    tickEndpoints(pointN, pointC, 0.5),
  ];
  const secondCopyTicks = [
    tickEndpoints(pointA, pointN, 0.47),
    tickEndpoints(pointA, pointN, 0.57),
    tickEndpoints(pointN, pointH, 0.43),
    tickEndpoints(pointN, pointH, 0.53),
  ];

  const proofSteps: ExteriorStep[] = [
    {
      focus: "comparison",
      insight: `The exterior angle is ${degreeLabel(exteriorSize)}. The remote interior angles are ${degreeLabel(firstRemoteSize)} and ${degreeLabel(secondRemoteSize)}; the construction will prove both strict comparisons without using triangle-angle sum.`,
      prompt: "The colored arcs name the three angles to compare. Their apparent sizes are motivation, not proof.",
      title: "Name the exterior and remote angles",
    },
    {
      focus: "first-construction",
      insight: "M is the midpoint of AC, so AM ≅ MC. Extending BM through M to E with BM ≅ ME creates two side pairs for a congruence argument.",
      prompt: "One tick marks the midpoint pair; two ticks mark the copied median pair. CE is the new ray that will carry a copy of the first remote angle.",
      title: "Build the first midpoint-and-copy construction",
    },
    {
      focus: "first-sas",
      insight: "AM ≅ CM, BM ≅ EM, and the marked angles at M are vertical. Therefore △AMB ≅ △CME by SAS.",
      prompt: "The diagram stays unfilled: read the two tick patterns and the vertical-angle arcs as the three SAS inputs.",
      title: "Apply SAS to the first pair",
    },
    {
      focus: "first-result",
      insight: `The blue copy ∠MCE is congruent to ∠BAC. Plane Separation puts E on the same side of AC as D and on the same side of BC as A, so CE lies strictly inside the ${degreeLabel(exteriorSize)} exterior angle. The remaining ${degreeLabel(firstRemainderSize)} is positive.`,
      prompt: "Use the two same-side conditions to establish the interior placement; then Angle Addition turns the positive remainder into the strict comparison.",
      title: "Compare the first remote angle",
    },
    {
      focus: "second-construction",
      insight: "The first auxiliary layer is now hidden. N is the midpoint of BC, AN is copied past N to H, and AC is extended through C to F for the mirrored argument.",
      prompt: "The original triangle and green target exterior have not moved; only the auxiliary construction has been replaced.",
      title: "Mirror the construction",
    },
    {
      focus: "second-result",
      insight: `SAS copies the ${degreeLabel(secondRemoteSize)} angle at B to ∠NCH. Plane Separation puts H on the same side of BC as F and on the same side of AC as B, so CH lies inside ∠BCF. Its positive remainder makes ∠BCF strictly larger than ∠ABC.`,
      prompt: "The tick marks and vertical arcs supply SAS; the two same-side conditions place the orange copy before Angle Addition supplies the comparison.",
      title: "Compare the second remote angle",
    },
    {
      focus: "conclusion",
      insight: "∠BCF and ∠ACD are vertical and therefore congruent. Replacing ∠BCF by the congruent target exterior preserves the strict comparison, so ∠ACD is larger than both remote interior angles.",
      prompt: "The final view removes the construction and keeps only the two remote angles and the congruent vertical exterior pair.",
      title: "Transfer the comparison to the original exterior",
    },
  ];
  const explorationStep: ExteriorStep = {
    focus: "comparison",
    insight: `∠ACD = ${degreeLabel(exteriorSize)}, ∠BAC = ${degreeLabel(firstRemoteSize)}, and ∠ABC = ${degreeLabel(secondRemoteSize)}. The exterior angle is larger than each remote interior angle.`,
    prompt: "Move A and watch both strict comparisons persist. These degree values illustrate the theorem; the guided construction supplies the proof.",
    title: "Explore the exterior-angle comparison",
  };
  const currentStep = isExploring
    ? explorationStep
    : (proofSteps[proofStep] ?? proofSteps[0]);
  const showFirstConstruction = !isExploring && proofStep >= 1 && proofStep <= 3;
  const showFirstSas = !isExploring && proofStep === 2;
  const showFirstResult = !isExploring && proofStep === 3;
  const showSecondConstruction = !isExploring && proofStep >= 4 && proofStep <= 5;
  const showSecondResult = !isExploring && proofStep === 5;
  const showSecondExterior = !isExploring && proofStep >= 4;
  const showConclusion = !isExploring && proofStep === 6;
  const showFirstRemote = isExploring || proofStep === 0 || showFirstResult || showConclusion;
  const showSecondRemote = isExploring || proofStep === 0 || showSecondResult || showConclusion;

  const figureDescription = isExploring
    ? `Triangle ABC has exterior angle ACD measuring ${degreeLabel(exteriorSize)}. Its remote interior angles measure ${degreeLabel(firstRemoteSize)} and ${degreeLabel(secondRemoteSize)}.`
    : showConclusion
      ? "The original exterior angle ACD and vertically opposite exterior BCF are congruent. ACD is larger than both remote interior angles."
      : showSecondConstruction
        ? "The mirrored midpoint construction copies the angle at B inside exterior angle BCF."
        : showFirstConstruction
          ? "A midpoint-and-copy construction divides the figure into triangles AMB and CME."
          : "Triangle ABC has side BC extended through C to D, forming exterior angle ACD.";
  const status = isExploring
    ? `${degreeLabel(exteriorSize)} is larger than both ${degreeLabel(firstRemoteSize)} and ${degreeLabel(secondRemoteSize)}.`
    : showConclusion
      ? "Conclusion: ∠ACD is larger than both ∠BAC and ∠ABC."
      : showSecondResult
        ? "The second copied angle plus a positive remainder makes ∠BCF larger than ∠ABC."
        : showSecondConstruction
          ? "The mirrored construction is ready for the second SAS comparison."
          : showFirstResult
            ? "The first copied angle plus a positive remainder makes ∠ACD larger than ∠BAC."
            : showFirstSas
              ? "SAS establishes △AMB ≅ △CME."
              : showFirstConstruction
                ? "M supplies one equal pair; extending BM supplies the second."
                : "The target is to compare the green exterior angle with both remote angles.";

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  const renderSummary = () => {
    if (isExploring || proofStep === 0 || showConclusion) {
      return (
        <>
          <div className="theorem-measure exterior-angle-inequality__measure--first">
            <strong>∠BAC</strong>
            <span>{degreeLabel(firstRemoteSize)} · remote</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--exterior">
            <strong>∠ACD</strong>
            <span>{degreeLabel(exteriorSize)} · exterior</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--second">
            <strong>∠ABC</strong>
            <span>{degreeLabel(secondRemoteSize)} · remote</span>
          </div>
        </>
      );
    }

    if (showFirstSas) {
      return (
        <>
          <div className="theorem-measure exterior-angle-inequality__measure--segment">
            <strong>Midpoint pair</strong>
            <span>AM ≅ CM</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--segment">
            <strong>Copied pair</strong>
            <span>BM ≅ EM</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--vertical">
            <strong>Vertical angles</strong>
            <span>∠AMB ≅ ∠CME</span>
          </div>
        </>
      );
    }

    if (showFirstResult) {
      return (
        <>
          <div className="theorem-measure exterior-angle-inequality__measure--first">
            <strong>Copied angle</strong>
            <span>∠BAC ≅ ∠MCE</span>
          </div>
          <div className="theorem-measure">
            <strong>Positive remainder</strong>
            <span>∠ECD = {degreeLabel(firstRemainderSize)}</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--exterior">
            <strong>First comparison</strong>
            <span>∠ACD is larger than ∠BAC</span>
          </div>
        </>
      );
    }

    if (showSecondResult) {
      return (
        <>
          <div className="theorem-measure exterior-angle-inequality__measure--second">
            <strong>Copied angle</strong>
            <span>∠ABC ≅ ∠NCH</span>
          </div>
          <div className="theorem-measure">
            <strong>Positive remainder</strong>
            <span>{degreeLabel(secondRemainderSize)}</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--exterior">
            <strong>Second comparison</strong>
            <span>∠BCF is larger than ∠ABC</span>
          </div>
        </>
      );
    }

    if (showSecondConstruction) {
      return (
        <>
          <div className="theorem-measure exterior-angle-inequality__measure--segment">
            <strong>Midpoint</strong>
            <span>BN ≅ NC</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--segment">
            <strong>Copied segment</strong>
            <span>AN ≅ NH</span>
          </div>
          <div className="theorem-measure exterior-angle-inequality__measure--exterior">
            <strong>Mirrored exterior</strong>
            <span>∠BCF</span>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="theorem-measure exterior-angle-inequality__measure--segment">
          <strong>Midpoint</strong>
          <span>AM ≅ MC</span>
        </div>
        <div className="theorem-measure exterior-angle-inequality__measure--segment">
          <strong>Copied segment</strong>
          <span>BM ≅ ME</span>
        </div>
        <div className="theorem-measure">
          <strong>New ray</strong>
          <span>Join C to E</span>
        </div>
      </>
    );
  };

  return (
    <div className="theorem-figure exterior-angle-inequality">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg exterior-angle-inequality__svg"
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
          const pointer = getSvgCoordinates(event.currentTarget, event);
          const centerX = (pointB.x + pointC.x) / 2;
          const nextOffset = pointer.x - centerX;
          const nextHeight = isExploring
            ? (exploreBaseY - pointer.y) / explorationHeightScale
            : proofBaseY - pointer.y;
          setApexOffset(
            Math.round(clamp(nextOffset, minimumApexOffset, maximumApexOffset)),
          );
          setApexHeight(
            Math.round(clamp(nextHeight, minimumApexHeight, maximumApexHeight)),
          );
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Exterior-angle inequality interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        <line className="exterior-angle-inequality__side" x1={pointA.x} x2={pointB.x} y1={pointA.y} y2={pointB.y} />
        <line className="exterior-angle-inequality__side" x1={pointA.x} x2={pointC.x} y1={pointA.y} y2={pointC.y} />
        <line className="exterior-angle-inequality__side" x1={pointB.x} x2={pointC.x} y1={pointB.y} y2={pointC.y} />
        <line className="exterior-angle-inequality__extension" x1={pointC.x} x2={pointD.x} y1={pointC.y} y2={pointD.y} />

        {showSecondExterior ? (
          <line className="exterior-angle-inequality__extension" x1={pointC.x} x2={pointF.x} y1={pointC.y} y2={pointF.y} />
        ) : null}

        {showFirstConstruction ? (
          <>
            <line className="exterior-angle-inequality__auxiliary" x1={pointB.x} x2={pointE.x} y1={pointB.y} y2={pointE.y} />
            <line className="exterior-angle-inequality__auxiliary" x1={pointC.x} x2={pointE.x} y1={pointC.y} y2={pointE.y} />
            {!showFirstResult ? (
              <>
                {firstMidpointTicks.map((tick, index) => <line className="exterior-angle-inequality__tick" key={`first-midpoint-${index}`} {...tick} />)}
                {firstCopyTicks.map((tick, index) => <line className="exterior-angle-inequality__tick" key={`first-copy-${index}`} {...tick} />)}
              </>
            ) : null}
          </>
        ) : null}

        {showSecondConstruction ? (
          <>
            <line className="exterior-angle-inequality__auxiliary" x1={pointA.x} x2={pointH.x} y1={pointA.y} y2={pointH.y} />
            <line className="exterior-angle-inequality__auxiliary" x1={pointC.x} x2={pointH.x} y1={pointC.y} y2={pointH.y} />
            {secondMidpointTicks.map((tick, index) => <line className="exterior-angle-inequality__tick" key={`second-midpoint-${index}`} {...tick} />)}
            {secondCopyTicks.map((tick, index) => <line className="exterior-angle-inequality__tick" key={`second-copy-${index}`} {...tick} />)}
          </>
        ) : null}

        <path className="exterior-angle-inequality__angle-arc exterior-angle-inequality__angle-arc--exterior" d={exteriorArc.path} />
        {showFirstRemote ? <path className="exterior-angle-inequality__angle-arc exterior-angle-inequality__angle-arc--first" d={firstRemoteArc.path} /> : null}
        {showSecondRemote ? <path className="exterior-angle-inequality__angle-arc exterior-angle-inequality__angle-arc--second" d={secondRemoteArc.path} /> : null}
        {showSecondExterior ? <path className="exterior-angle-inequality__angle-arc exterior-angle-inequality__angle-arc--exterior-opposite" d={secondExteriorArc.path} /> : null}
        {showFirstSas ? (
          <>
            <path className="exterior-angle-inequality__vertical-arc" d={firstVerticalArc.path} />
            <path className="exterior-angle-inequality__vertical-arc" d={firstOppositeVerticalArc.path} />
          </>
        ) : null}
        {showFirstResult ? (
          <>
            <path className="exterior-angle-inequality__angle-arc exterior-angle-inequality__angle-arc--first" d={firstCopiedArc.path} />
            <path className="exterior-angle-inequality__remainder-arc" d={firstRemainderArc.path} />
          </>
        ) : null}
        {showSecondResult ? (
          <>
            <path className="exterior-angle-inequality__vertical-arc" d={secondVerticalArc.path} />
            <path className="exterior-angle-inequality__vertical-arc" d={secondOppositeVerticalArc.path} />
            <path className="exterior-angle-inequality__angle-arc exterior-angle-inequality__angle-arc--second" d={secondCopiedArc.path} />
            <path className="exterior-angle-inequality__remainder-arc" d={secondRemainderArc.path} />
          </>
        ) : null}

        {isExploring ? (
          <>
            <text className="exterior-angle-inequality__angle-label exterior-angle-inequality__angle-label--first" x={firstRemoteArc.label.x} y={firstRemoteArc.label.y}>{degreeLabel(firstRemoteSize)}</text>
            <text className="exterior-angle-inequality__angle-label exterior-angle-inequality__angle-label--second" x={secondRemoteArc.label.x} y={secondRemoteArc.label.y}>{degreeLabel(secondRemoteSize)}</text>
            <text className="exterior-angle-inequality__angle-label exterior-angle-inequality__angle-label--exterior" x={exteriorArc.label.x} y={exteriorArc.label.y}>{degreeLabel(exteriorSize)}</text>
          </>
        ) : null}

        <circle className="exterior-angle-inequality__point" cx={pointA.x} cy={pointA.y} r="4.5" />
        <circle className="exterior-angle-inequality__point" cx={pointB.x} cy={pointB.y} r="4.5" />
        <circle className="exterior-angle-inequality__point" cx={pointC.x} cy={pointC.y} r="4.5" />
        <circle className="exterior-angle-inequality__point" cx={pointD.x} cy={pointD.y} r="4" />
        {showSecondExterior ? <circle className="exterior-angle-inequality__point" cx={pointF.x} cy={pointF.y} r="4" /> : null}
        {showFirstConstruction ? (
          <>
            <circle className="exterior-angle-inequality__point exterior-angle-inequality__point--auxiliary" cx={pointM.x} cy={pointM.y} r="4.5" />
            <circle className="exterior-angle-inequality__point exterior-angle-inequality__point--auxiliary" cx={pointE.x} cy={pointE.y} r="4.5" />
          </>
        ) : null}
        {showSecondConstruction ? (
          <>
            <circle className="exterior-angle-inequality__point exterior-angle-inequality__point--auxiliary" cx={pointN.x} cy={pointN.y} r="4.5" />
            <circle className="exterior-angle-inequality__point exterior-angle-inequality__point--auxiliary" cx={pointH.x} cy={pointH.y} r="4.5" />
          </>
        ) : null}

        <text className="exterior-angle-inequality__point-label" x={pointA.x} y={pointA.y - 11}>A</text>
        <text className="exterior-angle-inequality__point-label" x={pointB.x - 10} y={pointB.y + 18}>B</text>
        <text className="exterior-angle-inequality__point-label" x={pointC.x - 2} y={pointC.y + 19}>C</text>
        <text className="exterior-angle-inequality__point-label" x={pointD.x + 10} y={pointD.y + 17}>D</text>
        {showSecondExterior ? <text className="exterior-angle-inequality__point-label" x={pointF.x + 10} y={pointF.y + 13}>F</text> : null}
        {showFirstConstruction ? (
          <>
            <text className="exterior-angle-inequality__point-label exterior-angle-inequality__point-label--auxiliary" x={pointM.x + 10} y={pointM.y - 7}>M</text>
            <text className="exterior-angle-inequality__point-label exterior-angle-inequality__point-label--auxiliary" x={pointE.x + 10} y={pointE.y - 8}>E</text>
          </>
        ) : null}
        {showSecondConstruction ? (
          <>
            <text className="exterior-angle-inequality__point-label exterior-angle-inequality__point-label--auxiliary" x={pointN.x} y={pointN.y + 19}>N</text>
            <text className="exterior-angle-inequality__point-label exterior-angle-inequality__point-label--auxiliary" x={pointH.x + 10} y={pointH.y + 13}>H</text>
          </>
        ) : null}

        <circle
          className="exterior-angle-inequality__handle-target"
          cx={pointA.x}
          cy={pointA.y}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
          }}
          r={handleRadius}
        />
        <circle
          className={classNames(
            "exterior-angle-inequality__handle",
            isDragging && "exterior-angle-inequality__handle--active",
          )}
          cx={pointA.x}
          cy={pointA.y}
          r="7"
        />
      </svg>

      <div className="exterior-angle-inequality__summary theorem-figure__summary">
        {renderSummary()}
      </div>

      <div className="exterior-angle-inequality__controls">
        <label className="exterior-angle-inequality__control" htmlFor={positionControlId}>
          <span>
            <strong>Apex position</strong>
            <span>{apexPositionLabel(apexOffset)}</span>
          </span>
          <input
            id={positionControlId}
            max={maximumApexOffset}
            min={minimumApexOffset}
            onChange={(event) => setApexOffset(Number(event.target.value))}
            type="range"
            value={apexOffset}
          />
        </label>
        <label className="exterior-angle-inequality__control" htmlFor={heightControlId}>
          <span>
            <strong>Apex height</strong>
            <span>{apexHeight} units</span>
          </span>
          <input
            id={heightControlId}
            max={maximumApexHeight}
            min={minimumApexHeight}
            onChange={(event) => setApexHeight(Number(event.target.value))}
            type="range"
            value={apexHeight}
          />
        </label>
      </div>

      <p className={classNames("exterior-angle-inequality__status", (isExploring || showConclusion) && "exterior-angle-inequality__status--result")}>
        {status}
      </p>
    </div>
  );
}
