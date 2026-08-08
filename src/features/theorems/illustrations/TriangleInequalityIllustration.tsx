import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/triangle-inequality.css";

import {
  angleFrom,
  classNames,
  clamp,
  distance,
  formatDisplayNumber,
  getSvgCoordinates,
  hatchMark,
  midpoint,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type TriangleInequalityIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ProofFocus = "construction" | "isosceles" | "angles" | "sides" | "conclusion";

type ProofStep = TheoremDiscovery & {
  focus: ProofFocus;
  status: string;
};

type ArcData = {
  label: Point;
  path: string;
};

type InequalityData = {
  directLength: number;
  formula: string;
  gap: number;
  id: "ab" | "ac" | "bc";
  routeParts: [number, number];
};

const freeBaseY = 174;
const freePointB = { x: 88, y: freeBaseY };
const freePointC = { x: 232, y: freeBaseY };
const minimumApexX = 28;
const maximumApexX = 292;
const initialApexX = 160;
const minimumApexHeight = 14;
const maximumApexHeight = 144;
const initialApexHeight = 122;
const handleRadius = 22;

const proofPointB = { x: 42, y: 180 };
const proofPointA = { x: 116, y: 122 };
const proofPointC = { x: 240, y: 180 };
const proofBA = distance(proofPointB, proofPointA);
const proofAC = distance(proofPointA, proofPointC);
const proofPointD = {
  x:
    proofPointA.x +
    ((proofPointA.x - proofPointB.x) / proofBA) * proofAC,
  y:
    proofPointA.y +
    ((proofPointA.y - proofPointB.y) / proofBA) * proofAC,
};

const proofSteps: ProofStep[] = [
  {
    focus: "construction",
    insight:
      "The extension turns BA and its copied segment AD into one longer segment BD. The matching ticks certify AD ≅ AC, so BD = BA + AD = BA + AC.",
    prompt:
      "Read the point order B–A–D and the congruence ticks before using the displayed segment equation.",
    status: "B–A–D, AD ≅ AC, and BD = BA + AD = BA + AC.",
    title: "Extend and copy",
  },
  {
    focus: "isosceles",
    insight:
      "Equal sides AD and AC make triangle ACD isosceles. Its base angles ACD and CDA are congruent, and ray DA is the same ray as DB.",
    prompt:
      "The green arcs come from the Isosceles Base-Angles Theorem, not from measuring the drawing.",
    status: "AD ≅ AC, so ∠ACD ≅ ∠CDA = ∠BDC.",
    title: "Use the isosceles triangle",
  },
  {
    focus: "angles",
    insight:
      "At C, the whole angle BCD contains angle ACD plus the positive angle BCA. It is therefore larger than ACD, which is congruent to angle BDC.",
    prompt:
      "Follow the full purple arc and its orange added part. Angle Addition supplies the strict comparison.",
    status: "∠BCD = ∠BCA + ∠ACD > ∠ACD ≅ ∠BDC.",
    title: "Compare the angles",
  },
  {
    focus: "sides",
    insight:
      "In triangle BCD, the larger angle at C lies opposite BD. Triangle Side–Angle Order gives BD > BC; the construction then replaces BD by BA + AC.",
    prompt:
      "Match each compared angle to its opposite side before making the substitution.",
    status: "BD > BC and BD = BA + AC, so AB + AC > BC because BA and AB name the same side.",
    title: "Compare the opposite sides",
  },
  {
    focus: "conclusion",
    insight:
      "Nothing in the construction made BC special. Cycling the vertex names proves the corresponding inequality for each remaining side.",
    prompt:
      "Read all three results as relabeled copies of the same proof, not as three measured examples.",
    status: "AB + AC > BC, AB + BC > AC, and AC + BC > AB.",
    title: "Relabel the triangle",
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

  return {
    label: polarPoint(vertex, labelRadius, start + delta / 2),
    path: `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${endPoint.x} ${endPoint.y}`,
  };
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

function horizontalPositionLabel(value: number) {
  if (value < freePointB.x) {
    return "left of B";
  }
  if (value > freePointC.x) {
    return "right of C";
  }
  return "between B and C";
}

function heightLabel(value: number) {
  const span = maximumApexHeight - minimumApexHeight;
  if (value < minimumApexHeight + span / 3) {
    return "near the straight-line boundary";
  }
  if (value > maximumApexHeight - span / 3) {
    return "far from BC";
  }
  return "middle height";
}

function formatLength(value: number) {
  return formatDisplayNumber(value, 1);
}

export function TriangleInequalityIllustration({
  activeStep,
  onDiscoveryChange,
}: TriangleInequalityIllustrationProps) {
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
  const freePointA = { x: apexX, y: freeBaseY - apexHeight };
  const pointA = isExploring ? freePointA : proofPointA;
  const pointB = isExploring ? freePointB : proofPointB;
  const pointC = isExploring ? freePointC : proofPointC;

  const lengthAB = distance(pointA, pointB);
  const lengthAC = distance(pointA, pointC);
  const lengthBC = distance(pointB, pointC);
  const inequalities: InequalityData[] = [
    {
      directLength: lengthBC,
      formula: "AB + AC > BC",
      gap: lengthAB + lengthAC - lengthBC,
      id: "bc",
      routeParts: [lengthAB, lengthAC],
    },
    {
      directLength: lengthAC,
      formula: "AB + BC > AC",
      gap: lengthAB + lengthBC - lengthAC,
      id: "ac",
      routeParts: [lengthAB, lengthBC],
    },
    {
      directLength: lengthAB,
      formula: "AC + BC > AB",
      gap: lengthAC + lengthBC - lengthAB,
      id: "ab",
      routeParts: [lengthAC, lengthBC],
    },
  ];
  const sideLabelAB = outsideSegmentLabel(pointA, pointB, pointC, 14);
  const sideLabelAC = outsideSegmentLabel(pointA, pointC, pointB, 14);
  const sideLabelBC = outsideSegmentLabel(pointB, pointC, pointA, 15);
  const equalArcC = minorArc(proofPointC, proofPointA, proofPointD, 17, 29);
  const equalArcD = minorArc(proofPointD, proofPointC, proofPointA, 17, 29);
  const wholeArcC = minorArc(proofPointC, proofPointB, proofPointD, 25, 40);
  const addedArcC = minorArc(proofPointC, proofPointB, proofPointA, 18, 31);

  const explorationStep: ProofStep = {
    focus: "construction",
    insight:
      "The displayed lengths let you check all three sums directly. Every two-side route remains longer than its direct side. These measurements illustrate the theorem; the guided construction proves it.",
    prompt:
      "Move A between, left of, and right of the fixed base endpoints. Watch all three strict inequalities remain true as the side lengths change.",
    status: "All three displayed two-side routes are longer than their direct sides.",
    title: "Explore direct and two-side routes",
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

  const showConstruction = !isExploring && proofStep < 4;
  const showIsosceles = showConstruction && proofStep >= 1;
  const showAngleComparison = showConstruction && proofStep >= 2;
  const showSideComparison = showConstruction && proofStep >= 3;
  const showConclusion = !isExploring && proofStep >= 4;
  const figureDescription = isExploring
    ? `Triangle ABC has side lengths AB ${formatLength(lengthAB)}, AC ${formatLength(lengthAC)}, and BC ${formatLength(lengthBC)}. All three two-side routes are longer than their direct sides. Vertex A can move but remains above line BC.`
    : `Triangle inequality guided proof step ${proofStep + 1}. ${currentStep.status}`;

  return (
    <div className="theorem-figure triangle-inequality">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg triangle-inequality__svg"
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
        <title id={titleId}>Triangle inequality interactive</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        <line
          className={classNames(
            "triangle-inequality__side triangle-inequality__side--ab",
            showSideComparison && "triangle-inequality__side--muted",
          )}
          x1={pointA.x}
          x2={pointB.x}
          y1={pointA.y}
          y2={pointB.y}
        />
        <line
          className={classNames(
            "triangle-inequality__side triangle-inequality__side--ac",
            showSideComparison && "triangle-inequality__side--muted",
          )}
          x1={pointA.x}
          x2={pointC.x}
          y1={pointA.y}
          y2={pointC.y}
        />
        <line
          className={classNames(
            "triangle-inequality__side triangle-inequality__side--bc",
            showSideComparison && "triangle-inequality__side--comparison-shorter",
          )}
          x1={pointB.x}
          x2={pointC.x}
          y1={pointB.y}
          y2={pointC.y}
        />

        {showConstruction ? (
          <>
            <line
              className="triangle-inequality__constructed"
              x1={proofPointA.x}
              x2={proofPointD.x}
              y1={proofPointA.y}
              y2={proofPointD.y}
            />
            <line
              className="triangle-inequality__constructed triangle-inequality__constructed--join"
              x1={proofPointC.x}
              x2={proofPointD.x}
              y1={proofPointC.y}
              y2={proofPointD.y}
            />
            {hatchMark(
              midpoint(proofPointA, proofPointC),
              {
                x: proofPointC.x - proofPointA.x,
                y: proofPointC.y - proofPointA.y,
              },
              5,
              "triangle-inequality-ac-tick",
              "#23805a",
            )}
            {hatchMark(
              midpoint(proofPointA, proofPointD),
              {
                x: proofPointD.x - proofPointA.x,
                y: proofPointD.y - proofPointA.y,
              },
              5,
              "triangle-inequality-ad-tick",
              "#23805a",
            )}
            {showIsosceles ? (
              <>
                <path className="triangle-inequality__angle triangle-inequality__angle--equal" d={equalArcC.path} />
                <path className="triangle-inequality__angle triangle-inequality__angle--equal" d={equalArcD.path} />
              </>
            ) : null}
            {showAngleComparison ? (
              <>
                <path className="triangle-inequality__angle triangle-inequality__angle--whole" d={wholeArcC.path} />
                <path className="triangle-inequality__angle triangle-inequality__angle--added" d={addedArcC.path} />
              </>
            ) : null}
            {showSideComparison ? (
              <line
                className="triangle-inequality__comparison-longer"
                x1={proofPointB.x}
                x2={proofPointD.x}
                y1={proofPointB.y}
                y2={proofPointD.y}
              />
            ) : null}
            <circle className="triangle-inequality__point triangle-inequality__point--constructed" cx={proofPointD.x} cy={proofPointD.y} r="4.5" />
            <text className="triangle-inequality__point-label triangle-inequality__point-label--constructed" x={proofPointD.x + 10} y={proofPointD.y - 8}>D</text>
          </>
        ) : null}

        {isExploring ? (
          <>
            <text className="triangle-inequality__side-measure triangle-inequality__side-measure--ab" x={sideLabelAB.x} y={sideLabelAB.y}>{formatLength(lengthAB)}</text>
            <text className="triangle-inequality__side-measure triangle-inequality__side-measure--ac" x={sideLabelAC.x} y={sideLabelAC.y}>{formatLength(lengthAC)}</text>
            <text className="triangle-inequality__side-measure triangle-inequality__side-measure--bc" x={sideLabelBC.x} y={sideLabelBC.y}>{formatLength(lengthBC)}</text>
          </>
        ) : null}

        <circle className="triangle-inequality__point" cx={pointA.x} cy={pointA.y} r="4.5" />
        <circle className="triangle-inequality__point" cx={pointB.x} cy={pointB.y} r="4.5" />
        <circle className="triangle-inequality__point" cx={pointC.x} cy={pointC.y} r="4.5" />
        <text className="triangle-inequality__point-label" x={pointA.x} y={pointA.y - 11}>A</text>
        <text className="triangle-inequality__point-label" x={pointB.x - 10} y={pointB.y + 17}>B</text>
        <text className="triangle-inequality__point-label" x={pointC.x + 10} y={pointC.y + 17}>C</text>

        {isExploring ? (
          <>
            <circle className="triangle-inequality__handle-target" cx={pointA.x} cy={pointA.y} onPointerDown={beginDrag} r={handleRadius} />
            <circle className={classNames("triangle-inequality__handle", isDragging && "triangle-inequality__handle--active")} cx={pointA.x} cy={pointA.y} r="7" />
          </>
        ) : null}
      </svg>

      {isExploring ? (
        <div aria-label="Three triangle inequalities" className="triangle-inequality__inequalities" role="group">
          {inequalities.map((item) => (
            <div className="triangle-inequality__inequality-card" key={item.id}>
              <strong>{item.formula}</strong>
              <div className="triangle-inequality__inequality-values">
                {formatLength(item.routeParts[0])} + {formatLength(item.routeParts[1])} &gt; {formatLength(item.directLength)}
              </div>
              <small>Extra distance: {formatLength(item.gap)}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="theorem-measure triangle-inequality__proof-summary">
          <strong>{currentStep.title}</strong>
          <span>{currentStep.status}</span>
        </div>
      )}

      {showConclusion ? (
        <div aria-label="Triangle inequality conclusions" className="triangle-inequality__results" role="group">
          <div className="triangle-inequality__result"><strong>AB + AC &gt; BC</strong></div>
          <div className="triangle-inequality__result"><strong>AB + BC &gt; AC</strong></div>
          <div className="triangle-inequality__result"><strong>AC + BC &gt; AB</strong></div>
        </div>
      ) : null}

      {isExploring ? (
        <div className="triangle-inequality__controls">
          <label className="triangle-inequality__control" htmlFor={horizontalControlId}>
            <span><strong>Move A left or right</strong><span>{horizontalPositionLabel(apexX)}</span></span>
            <input aria-valuetext={horizontalPositionLabel(apexX)} id={horizontalControlId} max={maximumApexX} min={minimumApexX} onChange={(event) => setApexX(Number(event.target.value))} type="range" value={apexX} />
          </label>
          <label className="triangle-inequality__control" htmlFor={heightControlId}>
            <span><strong>Move A toward or away from BC</strong><span>{heightLabel(apexHeight)}</span></span>
            <input aria-valuetext={heightLabel(apexHeight)} id={heightControlId} max={maximumApexHeight} min={minimumApexHeight} onChange={(event) => setApexHeight(Number(event.target.value))} type="range" value={apexHeight} />
          </label>
        </div>
      ) : null}

      <p aria-live="polite" className={classNames("triangle-inequality__status", !isExploring && "triangle-inequality__status--proof")}>{discovery.status}</p>
    </div>
  );
}
