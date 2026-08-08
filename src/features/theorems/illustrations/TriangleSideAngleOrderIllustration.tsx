import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/triangle-side-angle-order.css";

import {
  angleFrom,
  classNames,
  clamp,
  distance,
  formatDisplayNumber,
  getSvgCoordinates,
  hatchMark,
  midpoint,
  pointAlong,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type TriangleSideAngleOrderIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ProofFocus = "layoff" | "isosceles" | "exterior" | "chain" | "converse";

type ProofStep = TheoremDiscovery & {
  focus: ProofFocus;
  status: string;
};

type RankedItem = {
  angle: string;
  angleSize: number;
  side: string;
  sideLength: number;
};

type ArcData = {
  label: Point;
  path: string;
};

const freeBaseY = 184;
const freePointB = { x: 82, y: freeBaseY };
const freePointC = { x: 238, y: freeBaseY };
const minimumApexX = 28;
const maximumApexX = 292;
const initialApexX = 160;
const minimumApexHeight = 72;
const maximumApexHeight = 154;
const initialApexHeight = 150;
const handleRadius = 22;

const proofPointA = { x: 48, y: 36 };
const proofPointB = { x: 276, y: 176 };
const proofPointC = { x: 92, y: 176 };
const proofPointD = pointAlong(
  proofPointA,
  proofPointB,
  distance(proofPointA, proofPointC) / distance(proofPointA, proofPointB),
);

const proofSteps: ProofStep[] = [
  {
    focus: "layoff",
    insight:
      "Because AB is longer than AC, a copy of AC laid off from A ends at D strictly between A and B. Segment CD creates the auxiliary triangle used by the proof.",
    prompt:
      "The location of D comes from segment comparison and segment copy, not from estimating the drawing.",
    status: "AB > AC, D lies between A and B, and AD ≅ AC.",
    title: "Lay off the shorter side",
  },
  {
    focus: "isosceles",
    insight:
      "The matching marks show AD ≅ AC. Triangle ACD is therefore isosceles, so its base angles ACD and CDA are congruent.",
    prompt:
      "Follow the equal sides to their opposite base angles; the matching arcs record the Isosceles Base-Angles Theorem.",
    status: "AD ≅ AC, so ∠ACD ≅ ∠CDA.",
    title: "Use the isosceles triangle",
  },
  {
    focus: "exterior",
    insight:
      "Ray DA extends side DB of triangle BCD. Thus ∠CDA is an exterior angle and is larger than remote interior angle ∠DBC, which is the original ∠ABC.",
    prompt:
      "The point order A–D–B is essential: it makes the blue angle at D an exterior angle of triangle BCD.",
    status: "Exterior-angle inequality: ∠CDA > ∠DBC = ∠ABC.",
    title: "Use the exterior angle",
  },
  {
    focus: "chain",
    insight:
      "Angle ACB contains angle ACD plus the positive angle DCB. Combining that strict comparison with the isosceles equality and exterior-angle inequality proves ∠ACB > ∠ABC.",
    prompt:
      "Read the chain from the full angle at C, through the congruent auxiliary angles, to the original angle at B.",
    status: "∠ACB > ∠ACD ≅ ∠CDA > ∠ABC.",
    title: "Assemble the forward comparison",
  },
  {
    focus: "converse",
    insight:
      "If ∠ACB > ∠ABC, equal sides would force equal angles and the reverse side order would force the reverse angle order. Trichotomy leaves only AB > AC.",
    prompt:
      "The converse is a contradiction argument, not an informal reversal of the forward theorem.",
    status: "AB ≅ AC is impossible; AB < AC is impossible; therefore AB > AC.",
    title: "Prove the converse by trichotomy",
  },
];

function normalizeRadians(value: number) {
  const fullTurn = Math.PI * 2;
  return ((value % fullTurn) + fullTurn) % fullTurn;
}

function minorArc(
  vertex: Point,
  first: Point,
  second: Point,
  radius: number,
  labelRadius: number,
): ArcData {
  const start = normalizeRadians(angleFrom(vertex, first));
  const end = normalizeRadians(angleFrom(vertex, second));
  const forward = normalizeRadians(end - start);
  const delta = forward <= Math.PI ? forward : forward - Math.PI * 2;
  const arcEnd = start + delta;
  const startPoint = polarPoint(vertex, radius, start);
  const endPoint = polarPoint(vertex, radius, arcEnd);
  const label = polarPoint(vertex, labelRadius, start + delta / 2);

  return {
    label,
    path: `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${endPoint.x} ${endPoint.y}`,
  };
}

function angleSize(vertex: Point, first: Point, second: Point) {
  const firstAngle = angleFrom(vertex, first);
  const secondAngle = angleFrom(vertex, second);
  const difference = Math.abs(normalizeRadians(secondAngle - firstAngle));
  return (Math.min(difference, Math.PI * 2 - difference) * 180) / Math.PI;
}

function outsideSegmentLabel(
  first: Point,
  second: Point,
  opposite: Point,
  offset: number,
) {
  const center = midpoint(first, second);
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy);
  const normal = { x: -dy / length, y: dx / length };
  const pointsTowardOpposite =
    normal.x * (opposite.x - center.x) +
      normal.y * (opposite.y - center.y) >
    0;
  const direction = pointsTowardOpposite ? -1 : 1;

  return {
    x: center.x + normal.x * offset * direction,
    y: center.y + normal.y * offset * direction,
  };
}

function compareDescending(first: number, second: number, tolerance: number) {
  if (Math.abs(first - second) <= tolerance) {
    return 0;
  }
  return second - first;
}

function rankingText(
  items: RankedItem[],
  key: "sideLength" | "angleSize",
  labelKey: "side" | "angle",
  tolerance: number,
  formatValue?: (value: number) => string,
) {
  const sorted = [...items].sort((first, second) =>
    compareDescending(first[key], second[key], tolerance),
  );

  const formatItem = (item: RankedItem) =>
    formatValue
      ? `${item[labelKey]} ${formatValue(item[key])}`
      : item[labelKey];

  return sorted.reduce((text, item, index) => {
    if (index === 0) {
      return formatItem(item);
    }
    const previous = sorted[index - 1];
    const separator =
      Math.abs(previous[key] - item[key]) <= tolerance ? " ≅ " : " > ";
    return `${text}${separator}${formatItem(item)}`;
  }, "");
}

function horizontalPositionLabel(value: number) {
  const center = (minimumApexX + maximumApexX) / 2;
  if (Math.abs(value - center) < 18) {
    return "near the center";
  }
  return value < center ? "toward B" : "toward C";
}

function heightLabel(value: number) {
  const midpoint = (minimumApexHeight + maximumApexHeight) / 2;
  return value < midpoint ? "nearer BC" : "farther from BC";
}

export function TriangleSideAngleOrderIllustration({
  activeStep,
  onDiscoveryChange,
}: TriangleSideAngleOrderIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const horizontalControlId = useId();
  const heightControlId = useId();
  const [apexX, setApexX] = useState(initialApexX);
  const [apexHeight, setApexHeight] = useState(initialApexHeight);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentStep = proofSteps[proofStep] ?? proofSteps[0];
  const freePointA = {
    x: apexX,
    y: freeBaseY - apexHeight,
  };
  const pointA = isExploring ? freePointA : proofPointA;
  const pointB = isExploring ? freePointB : proofPointB;
  const pointC = isExploring ? freePointC : proofPointC;

  const rankedItems: RankedItem[] = [
    {
      angle: "∠ACB",
      angleSize: angleSize(pointC, pointA, pointB),
      side: "AB",
      sideLength: distance(pointA, pointB),
    },
    {
      angle: "∠ABC",
      angleSize: angleSize(pointB, pointA, pointC),
      side: "AC",
      sideLength: distance(pointA, pointC),
    },
    {
      angle: "∠BAC",
      angleSize: angleSize(pointA, pointB, pointC),
      side: "BC",
      sideLength: distance(pointB, pointC),
    },
  ];
  const sideRanking = rankingText(rankedItems, "sideLength", "side", 0.000001);
  const angleRanking = rankingText(rankedItems, "angleSize", "angle", 0.000001);
  const measuredSideRanking = rankingText(
    rankedItems,
    "sideLength",
    "side",
    0.000001,
    (value) => formatDisplayNumber(value, 1),
  );
  const measuredAngleRanking = rankingText(
    rankedItems,
    "angleSize",
    "angle",
    0.000001,
    (value) => `${formatDisplayNumber(value, 1)}°`,
  );

  const arcA = minorArc(pointA, pointB, pointC, 18, 31);
  const arcB = minorArc(pointB, pointA, pointC, 18, 31);
  const arcC = minorArc(pointC, pointA, pointB, 18, 31);
  const sideLabelAB = outsideSegmentLabel(pointA, pointB, pointC, 14);
  const sideLabelAC = outsideSegmentLabel(pointA, pointC, pointB, 14);
  const sideLabelBC = outsideSegmentLabel(pointB, pointC, pointA, 15);
  const auxiliaryArcC = minorArc(proofPointC, proofPointA, proofPointD, 17, 28);
  const auxiliaryArcD = minorArc(proofPointD, proofPointC, proofPointA, 17, 29);
  const exteriorArcD = minorArc(proofPointD, proofPointC, proofPointA, 25, 38);
  const remainderArcC = minorArc(proofPointC, proofPointD, proofPointB, 23, 37);

  const explorationStep: ProofStep = {
    focus: "layoff",
    insight: `Measured sides: ${measuredSideRanking} units. Measured opposite angles: ${measuredAngleRanking}. Their matching order illustrates the theorem; the guided construction proves it.`,
    prompt:
      "Move A across the canvas and toward or away from BC. Watch each side keep the same rank as its opposite angle.",
    status: `Sides: ${measuredSideRanking} units. Opposite angles: ${measuredAngleRanking}.`,
    title: "Explore side and opposite-angle order",
  };
  const discovery = isExploring ? explorationStep : currentStep;

  useEffect(() => {
    onDiscoveryChange({
      insight: discovery.insight,
      prompt: discovery.prompt,
      title: discovery.title,
    });
  }, [discovery.insight, discovery.prompt, discovery.title, onDiscoveryChange]);

  const updateApex = (point: Point) => {
    setApexX(Math.round(clamp(point.x, minimumApexX, maximumApexX)));
    setApexHeight(
      Math.round(
        clamp(freeBaseY - point.y, minimumApexHeight, maximumApexHeight),
      ),
    );
  };

  const beginDrag = (event: PointerEvent<SVGCircleElement>) => {
    if (!isExploring) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateApex(getSvgCoordinates(event.currentTarget.ownerSVGElement!, event));
  };

  const showIsosceles = !isExploring && proofStep >= 1;
  const showExterior = !isExploring && proofStep >= 2;
  const showChain = !isExploring && proofStep >= 3;
  const showCases = !isExploring && proofStep >= 4;
  const figureDescription = isExploring
    ? `Triangle ABC has side ranking ${sideRanking} and opposite-angle ranking ${angleRanking}. Vertex A can be moved within a protected region above BC.`
    : `Triangle ABC is shown in guided proof step ${proofStep + 1}. ${currentStep.status}`;

  return (
    <div className="theorem-figure triangle-side-angle-order">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg triangle-side-angle-order__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (isDragging && isExploring) {
            updateApex(getSvgCoordinates(event.currentTarget, event));
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Triangle side and opposite-angle order interactive</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        <line
          className="triangle-side-angle-order__side triangle-side-angle-order__side--ab"
          x1={pointA.x}
          x2={pointB.x}
          y1={pointA.y}
          y2={pointB.y}
        />
        <line
          className="triangle-side-angle-order__side triangle-side-angle-order__side--ac"
          x1={pointA.x}
          x2={pointC.x}
          y1={pointA.y}
          y2={pointC.y}
        />
        <line
          className="triangle-side-angle-order__side triangle-side-angle-order__side--bc"
          x1={pointB.x}
          x2={pointC.x}
          y1={pointB.y}
          y2={pointC.y}
        />

        {isExploring ? (
          <>
            <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--bc" d={arcA.path} />
            <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--ac" d={arcB.path} />
            <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--ab" d={arcC.path} />
            <text className="triangle-side-angle-order__angle-label triangle-side-angle-order__angle-label--bc" x={arcA.label.x} y={arcA.label.y}>{formatDisplayNumber(rankedItems[2].angleSize, 1)}°</text>
            <text className="triangle-side-angle-order__angle-label triangle-side-angle-order__angle-label--ac" x={arcB.label.x} y={arcB.label.y}>{formatDisplayNumber(rankedItems[1].angleSize, 1)}°</text>
            <text className="triangle-side-angle-order__angle-label triangle-side-angle-order__angle-label--ab" x={arcC.label.x} y={arcC.label.y}>{formatDisplayNumber(rankedItems[0].angleSize, 1)}°</text>
            <text className="triangle-side-angle-order__side-measure triangle-side-angle-order__side-measure--ab" x={sideLabelAB.x} y={sideLabelAB.y}>{formatDisplayNumber(rankedItems[0].sideLength, 1)}</text>
            <text className="triangle-side-angle-order__side-measure triangle-side-angle-order__side-measure--ac" x={sideLabelAC.x} y={sideLabelAC.y}>{formatDisplayNumber(rankedItems[1].sideLength, 1)}</text>
            <text className="triangle-side-angle-order__side-measure triangle-side-angle-order__side-measure--bc" x={sideLabelBC.x} y={sideLabelBC.y}>{formatDisplayNumber(rankedItems[2].sideLength, 1)}</text>
          </>
        ) : !showCases ? (
          <>
            <line
              className="triangle-side-angle-order__constructed"
              x1={proofPointC.x}
              x2={proofPointD.x}
              y1={proofPointC.y}
              y2={proofPointD.y}
            />
            <circle className="triangle-side-angle-order__point triangle-side-angle-order__point--constructed" cx={proofPointD.x} cy={proofPointD.y} r="4" />
            <text className="triangle-side-angle-order__point-label triangle-side-angle-order__point-label--constructed" x={proofPointD.x + 9} y={proofPointD.y - 8}>D</text>
            {hatchMark(midpoint(proofPointA, proofPointC), { x: proofPointC.x - proofPointA.x, y: proofPointC.y - proofPointA.y }, 5, "ac-tick", "#c25b2a")}
            {hatchMark(midpoint(proofPointA, proofPointD), { x: proofPointD.x - proofPointA.x, y: proofPointD.y - proofPointA.y }, 5, "ad-tick", "#c25b2a")}
            {showIsosceles ? (
              <>
                <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--equal" d={auxiliaryArcC.path} />
                <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--equal" d={auxiliaryArcD.path} />
              </>
            ) : null}
            {showExterior ? (
              <>
                <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--exterior" d={exteriorArcD.path} />
                <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--target" d={arcB.path} />
              </>
            ) : null}
            {showChain ? (
              <>
                <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--whole" d={arcC.path} />
                <path className="triangle-side-angle-order__angle triangle-side-angle-order__angle--remainder" d={remainderArcC.path} />
              </>
            ) : null}
          </>
        ) : null}

        <circle className="triangle-side-angle-order__point" cx={pointA.x} cy={pointA.y} r="4.5" />
        <circle className="triangle-side-angle-order__point" cx={pointB.x} cy={pointB.y} r="4.5" />
        <circle className="triangle-side-angle-order__point" cx={pointC.x} cy={pointC.y} r="4.5" />
        <text
          className="triangle-side-angle-order__point-label"
          x={pointA.x}
          y={pointA.y - 11}
        >
          A
        </text>
        <text className="triangle-side-angle-order__point-label" x={pointB.x - 10} y={pointB.y + 17}>B</text>
        <text className="triangle-side-angle-order__point-label" x={pointC.x + 10} y={pointC.y + 17}>C</text>

        {isExploring ? (
          <>
            <circle className="triangle-side-angle-order__handle-target" cx={pointA.x} cy={pointA.y} onPointerDown={beginDrag} r={handleRadius} />
            <circle className={classNames("triangle-side-angle-order__handle", isDragging && "triangle-side-angle-order__handle--active")} cx={pointA.x} cy={pointA.y} r="7" />
          </>
        ) : null}
      </svg>

      {isExploring ? (
        <div className="triangle-side-angle-order__ranking">
          <div className="theorem-measure triangle-side-angle-order__rank-card">
            <strong>Side order</strong>
            <span>{sideRanking}</span>
          </div>
          <div className="theorem-measure triangle-side-angle-order__rank-card">
            <strong>Opposite-angle order</strong>
            <span>{angleRanking}</span>
          </div>
        </div>
      ) : (
        <div className="triangle-side-angle-order__proof-summary theorem-measure">
          <strong>{currentStep.title}</strong>
          <span>{currentStep.status}</span>
        </div>
      )}

      {showCases ? (
        <div aria-label="Segment trichotomy cases" className="triangle-side-angle-order__cases" role="group">
          <div className="triangle-side-angle-order__case triangle-side-angle-order__case--rejected">
            <strong>AB ≅ AC</strong>
            <span>Would force ∠ACB ≅ ∠ABC.</span>
          </div>
          <div className="triangle-side-angle-order__case triangle-side-angle-order__case--rejected">
            <strong>AB &lt; AC</strong>
            <span>Would force ∠ACB &lt; ∠ABC.</span>
          </div>
          <div className="triangle-side-angle-order__case triangle-side-angle-order__case--accepted">
            <strong>AB &gt; AC</strong>
            <span>The only remaining case.</span>
          </div>
        </div>
      ) : null}

      {isExploring ? (
        <div className="triangle-side-angle-order__controls">
          <label className="triangle-side-angle-order__control" htmlFor={horizontalControlId}>
            <span><strong>Move A left or right</strong><span>{horizontalPositionLabel(apexX)}</span></span>
            <input aria-valuetext={horizontalPositionLabel(apexX)} id={horizontalControlId} max={maximumApexX} min={minimumApexX} onChange={(event) => setApexX(Number(event.target.value))} type="range" value={apexX} />
          </label>
          <label className="triangle-side-angle-order__control" htmlFor={heightControlId}>
            <span><strong>Move A away from BC</strong><span>{heightLabel(apexHeight)}</span></span>
            <input aria-valuetext={heightLabel(apexHeight)} id={heightControlId} max={maximumApexHeight} min={minimumApexHeight} onChange={(event) => setApexHeight(Number(event.target.value))} type="range" value={apexHeight} />
          </label>
        </div>
      ) : null}

      <p aria-live="polite" className={classNames("triangle-side-angle-order__status", !isExploring && "triangle-side-angle-order__status--proof")}>{discovery.status}</p>
    </div>
  );
}
