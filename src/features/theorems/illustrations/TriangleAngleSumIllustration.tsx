import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/triangle-angle-sum.css";

import {
  angleFrom,
  classNames,
  clamp,
  formatDisplayNumber,
  getSvgCoordinates,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type TriangleAngleSumIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type IllustrationStep = TheoremDiscovery & {
  focus: "target" | "parallel" | "copy-b" | "copy-c" | "partition" | "conclusion";
  status: string;
};

type ArcData = {
  label: Point;
  path: string;
};

const baseY = 180;
const pointB = { x: 42, y: baseY };
const pointC = { x: 278, y: baseY };
const minimumApexX = 78;
const maximumApexX = 242;
const initialApexX = 148;
const minimumApexHeight = 65;
const maximumApexHeight = 135;
const initialApexHeight = 112;
const handleRadius = 22;
const lineStartX = 14;
const lineEndX = 306;

const proofSteps: IllustrationStep[] = [
  {
    focus: "target",
    insight:
      "The three interior angles are identified, and the 180° total is the target. The diagram has not yet supplied a reason for that total.",
    prompt:
      "Keep the theorem target separate from the visual impression. The proof begins by adding a line whose relationship to BC is guaranteed by the Parallel Axiom.",
    status:
      "Triangle ABC has interior angles ∠BAC, ∠ABC, and ∠BCA. Goal: prove their angle sizes add to 180°.",
    title: "Name the triangle and the target",
  },
  {
    focus: "parallel",
    insight:
      "The Parallel Axiom supplies the unique line through A parallel to BC. Points D and E name opposite directions on that constructed line.",
    prompt:
      "The green marks record DE ∥ BC. This construction creates two transversals, AB and AC, that can carry the base angles to A.",
    status:
      "Draw line DE through A with DE ∥ BC. Points D, A, and E occur in that order, so ∠DAE is a straight angle.",
    title: "Draw a parallel through A",
  },
  {
    focus: "copy-b",
    insight:
      "Transversal AB cuts parallel lines DE and BC. The blue angles DAB and ABC are alternate interior angles and therefore congruent.",
    prompt:
      "Follow transversal AB from the base to the new line. The matching blue arcs show the first angle copy used at A.",
    status:
      "By the Alternate Interior Angles Theorem, ∠DAB ≅ ∠ABC.",
    title: "Copy the angle at B",
  },
  {
    focus: "copy-c",
    insight:
      "Transversal AC gives the second copy. The purple angles CAE and BCA are alternate interior angles and therefore congruent.",
    prompt:
      "The two base angles now have congruent copies beside ∠BAC on the constructed line through A.",
    status:
      "By the Alternate Interior Angles Theorem, ∠CAE ≅ ∠BCA.",
    title: "Copy the angle at C",
  },
  {
    focus: "partition",
    insight:
      "At A, the blue copy, orange triangle angle, and purple copy are adjacent and together fill straight angle DAE.",
    prompt:
      "Use the straight line, not measured arc sizes: Angle Addition and the Linear Pair Theorem make this three-angle total 180°.",
    status:
      "Angles ∠DAB, ∠BAC, and ∠CAE partition straight angle ∠DAE, so their angle sizes add to 180°.",
    title: "Partition the straight angle",
  },
  {
    focus: "conclusion",
    insight:
      "Substitution returns from the copied angles to the original triangle. The blue and purple congruences transfer the straight-angle total to ABC.",
    prompt:
      "Replace ∠DAB by ∠ABC and ∠CAE by ∠BCA. The final equation now names only the three original triangle angles.",
    status:
      "Substitute the congruent base angles: ∠BAC + ∠ABC + ∠BCA = 180°.",
    title: "Substitute the triangle angles",
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
  labelRadius = radius + 13,
): ArcData {
  const firstAngle = normalizeRadians(angleFrom(vertex, first));
  const secondAngle = normalizeRadians(angleFrom(vertex, second));
  let startAngle = firstAngle;
  let sweep = normalizeRadians(secondAngle - firstAngle);

  if (sweep > Math.PI) {
    startAngle = secondAngle;
    sweep = Math.PI * 2 - sweep;
  }

  const start = polarPoint(vertex, radius, startAngle);
  const end = polarPoint(vertex, radius, startAngle + sweep);
  return {
    label: polarPoint(vertex, labelRadius, startAngle + sweep / 2),
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

function roundedTriangleAngles(values: [number, number, number]) {
  const scaled = values.map((value) => value * 10);
  const roundedDown = scaled.map((value) => Math.floor(value));
  const missingTenths = 1800 - roundedDown.reduce((total, value) => total + value, 0);
  const remainderOrder = scaled
    .map((value, index) => ({ fraction: value - Math.floor(value), index }))
    .sort((first, second) => second.fraction - first.fraction);

  for (let index = 0; index < missingTenths; index += 1) {
    roundedDown[remainderOrder[index % remainderOrder.length].index] += 1;
  }

  return roundedDown.map((value) => value / 10) as [number, number, number];
}

function formatAngle(value: number) {
  return `${formatDisplayNumber(value, 1)}°`;
}

function horizontalPositionLabel(value: number) {
  const center = (minimumApexX + maximumApexX) / 2;
  if (Math.abs(value - center) <= 8) {
    return "near the center";
  }
  return value < center ? "left of center" : "right of center";
}

function heightLabel(value: number) {
  const span = maximumApexHeight - minimumApexHeight;
  if (value < minimumApexHeight + span / 3) {
    return "lower";
  }
  if (value > maximumApexHeight - span / 3) {
    return "higher";
  }
  return "middle height";
}

function ParallelMark({ x, y }: Point) {
  return (
    <path
      className="triangle-angle-sum__parallel-mark"
      d={`M ${x - 7} ${y - 5} L ${x} ${y} L ${x - 7} ${y + 5}`}
    />
  );
}

export function TriangleAngleSumIllustration({
  activeStep,
  onDiscoveryChange,
}: TriangleAngleSumIllustrationProps) {
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
  const pointA = { x: apexX, y: baseY - apexHeight };
  const pointD = { x: lineStartX, y: pointA.y };
  const pointE = { x: lineEndX, y: pointA.y };
  const parallelMarkX = apexX < svgWidth / 2 ? 238 : 82;

  const rawAngles: [number, number, number] = [
    angleSize(pointB, pointA, pointC),
    angleSize(pointA, pointB, pointC),
    angleSize(pointC, pointB, pointA),
  ];
  const displayedAngles = roundedTriangleAngles(rawAngles);
  const [angleB, angleA, angleC] = displayedAngles;

  const angleBArc = minorArc(pointB, pointA, pointC, 18, 31);
  const angleAArc = minorArc(pointA, pointB, pointC, 23, 36);
  const angleCArc = minorArc(pointC, pointB, pointA, 18, 31);
  const copyBArc = minorArc(pointA, pointD, pointB, 20, 32);
  const copyCArc = minorArc(pointA, pointC, pointE, 20, 32);
  const partitionAngleAArc = minorArc(pointA, pointB, pointC, 20, 32);

  const showParallel = !isExploring && proofStep >= 1;
  const showCopyB = !isExploring && proofStep >= 2;
  const showCopyC = !isExploring && proofStep >= 3;
  const showPartition = !isExploring && proofStep >= 4;
  const showConclusion = !isExploring && proofStep >= 5;

  const explorationStep: IllustrationStep = {
    focus: "target",
    insight: `The displayed angle sizes are ∠ABC = ${formatAngle(angleB)}, ∠BAC = ${formatAngle(angleA)}, and ∠BCA = ${formatAngle(angleC)}. Their displayed total is 180.0°. These measurements illustrate the theorem; the guided construction explains why it is always true in Euclidean geometry.`,
    prompt:
      "Drag A, or use both sliders, to make acute and obtuse triangles. Watch all three angle sizes change while their total stays fixed.",
    status: `∠ABC = ${formatAngle(angleB)}, ∠BAC = ${formatAngle(angleA)}, ∠BCA = ${formatAngle(angleC)}; total = 180.0°.`,
    title: "Explore the triangle angle total",
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
      Math.round(clamp(baseY - point.y, minimumApexHeight, maximumApexHeight)),
    );
  };

  const beginDrag = (event: PointerEvent<SVGCircleElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateApex(getSvgCoordinates(event.currentTarget.ownerSVGElement!, event));
  };

  const figureDescription = isExploring
    ? `Triangle ABC has angle sizes ${formatAngle(angleA)}, ${formatAngle(angleB)}, and ${formatAngle(angleC)}, displayed with a total of 180.0 degrees. Vertex A can be moved.`
    : `Triangle ABC is shown in guided proof step ${proofStep + 1}. ${currentStep.status}`;

  const renderSummary = () => {
    if (isExploring) {
      return (
        <>
          <div className="theorem-measure triangle-angle-sum__measure--b">
            <strong>∠ABC</strong>
            <span>{formatAngle(angleB)}</span>
          </div>
          <div className="theorem-measure triangle-angle-sum__measure--a">
            <strong>∠BAC</strong>
            <span>{formatAngle(angleA)}</span>
          </div>
          <div className="theorem-measure triangle-angle-sum__measure--c">
            <strong>∠BCA</strong>
            <span>{formatAngle(angleC)}</span>
          </div>
          <div className="theorem-measure triangle-angle-sum__measure--result">
            <strong>Total</strong>
            <span>180.0°</span>
          </div>
        </>
      );
    }

    if (proofStep === 0) {
      return (
        <>
          <div className="theorem-measure">
            <strong>Triangle</strong>
            <span>ABC</span>
          </div>
          <div className="theorem-measure triangle-angle-sum__measure--result">
            <strong>Target</strong>
            <span>three angles total 180°</span>
          </div>
        </>
      );
    }

    if (proofStep === 1) {
      return (
        <>
          <div className="theorem-measure triangle-angle-sum__measure--parallel">
            <strong>Construction</strong>
            <span>DE ∥ BC</span>
          </div>
          <div className="theorem-measure">
            <strong>Straight angle</strong>
            <span>∠DAE</span>
          </div>
        </>
      );
    }

    if (proofStep === 2) {
      return (
        <div className="theorem-measure triangle-angle-sum__measure--b">
          <strong>First copy</strong>
          <span>∠DAB ≅ ∠ABC</span>
        </div>
      );
    }

    if (proofStep === 3) {
      return (
        <>
          <div className="theorem-measure triangle-angle-sum__measure--b">
            <strong>First copy</strong>
            <span>∠DAB ≅ ∠ABC</span>
          </div>
          <div className="theorem-measure triangle-angle-sum__measure--c">
            <strong>Second copy</strong>
            <span>∠CAE ≅ ∠BCA</span>
          </div>
        </>
      );
    }

    if (proofStep === 4) {
      return (
        <div className="theorem-measure triangle-angle-sum__measure--straight">
          <strong>Straight-angle partition</strong>
          <span>∠DAB + ∠BAC + ∠CAE = 180°</span>
        </div>
      );
    }

    return (
      <div className="theorem-measure triangle-angle-sum__measure--result">
        <strong>Triangle angle sum</strong>
        <span>∠BAC + ∠ABC + ∠BCA = 180°</span>
      </div>
    );
  };

  return (
    <div className="theorem-figure triangle-angle-sum">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg triangle-angle-sum__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (isDragging) {
            updateApex(getSvgCoordinates(event.currentTarget, event));
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Triangle angle sum interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        {showParallel ? (
          <>
            <line
              className="triangle-angle-sum__constructed-line"
              x1={pointD.x}
              x2={pointE.x}
              y1={pointD.y}
              y2={pointE.y}
            />
            <ParallelMark x={parallelMarkX} y={pointA.y} />
            <ParallelMark x={parallelMarkX} y={baseY} />
          </>
        ) : null}

        <path className="triangle-angle-sum__side" d={`M ${pointA.x} ${pointA.y} L ${pointB.x} ${pointB.y} L ${pointC.x} ${pointC.y} Z`} />

        <path
          className={classNames(
            "triangle-angle-sum__angle triangle-angle-sum__angle--b",
            showPartition && "triangle-angle-sum__angle--muted",
          )}
          d={angleBArc.path}
        />
        <path
          className={classNames(
            "triangle-angle-sum__angle triangle-angle-sum__angle--a",
            showPartition && "triangle-angle-sum__angle--muted",
          )}
          d={angleAArc.path}
        />
        <path
          className={classNames(
            "triangle-angle-sum__angle triangle-angle-sum__angle--c",
            showPartition && "triangle-angle-sum__angle--muted",
          )}
          d={angleCArc.path}
        />

        {showCopyB ? (
          <path
            className={classNames(
              "triangle-angle-sum__angle triangle-angle-sum__angle--b-copy",
              currentStep.focus === "copy-c" && "triangle-angle-sum__angle--muted",
            )}
            d={copyBArc.path}
          />
        ) : null}
        {showCopyC ? (
          <path
            className="triangle-angle-sum__angle triangle-angle-sum__angle--c-copy"
            d={copyCArc.path}
          />
        ) : null}
        {showPartition ? (
          <path
            className="triangle-angle-sum__angle triangle-angle-sum__angle--partition-a"
            d={partitionAngleAArc.path}
          />
        ) : null}

        {isExploring ? (
          <>
            <text className="triangle-angle-sum__angle-label triangle-angle-sum__angle-label--b" x={angleBArc.label.x} y={angleBArc.label.y}>{formatAngle(angleB)}</text>
            <text className="triangle-angle-sum__angle-label triangle-angle-sum__angle-label--a" x={angleAArc.label.x} y={angleAArc.label.y}>{formatAngle(angleA)}</text>
            <text className="triangle-angle-sum__angle-label triangle-angle-sum__angle-label--c" x={angleCArc.label.x} y={angleCArc.label.y}>{formatAngle(angleC)}</text>
          </>
        ) : null}

        <circle className="triangle-angle-sum__point" cx={pointA.x} cy={pointA.y} r="4.5" />
        <circle className="triangle-angle-sum__point" cx={pointB.x} cy={pointB.y} r="4.5" />
        <circle className="triangle-angle-sum__point" cx={pointC.x} cy={pointC.y} r="4.5" />
        {showParallel ? (
          <>
            <circle className="triangle-angle-sum__point triangle-angle-sum__point--constructed" cx={pointD.x} cy={pointD.y} r="3.5" />
            <circle className="triangle-angle-sum__point triangle-angle-sum__point--constructed" cx={pointE.x} cy={pointE.y} r="3.5" />
          </>
        ) : null}

        <text className="triangle-angle-sum__point-label" x={pointA.x} y={pointA.y - 11}>A</text>
        <text className="triangle-angle-sum__point-label" x={pointB.x - 10} y={pointB.y + 17}>B</text>
        <text className="triangle-angle-sum__point-label" x={pointC.x + 10} y={pointC.y + 17}>C</text>
        {showParallel ? (
          <>
            <text className="triangle-angle-sum__point-label triangle-angle-sum__point-label--constructed" x={pointD.x + 7} y={pointD.y - 8}>D</text>
            <text className="triangle-angle-sum__point-label triangle-angle-sum__point-label--constructed" x={pointE.x - 7} y={pointE.y - 8}>E</text>
          </>
        ) : null}

        <circle
          className="triangle-angle-sum__handle-target"
          cx={pointA.x}
          cy={pointA.y}
          onPointerDown={beginDrag}
          r={handleRadius}
        />
        <circle
          className={classNames(
            "triangle-angle-sum__handle",
            isDragging && "triangle-angle-sum__handle--active",
          )}
          cx={pointA.x}
          cy={pointA.y}
          r="7"
        />
      </svg>

      <div
        className={classNames(
          "triangle-angle-sum__summary theorem-figure__summary",
          !isExploring && "triangle-angle-sum__summary--guided",
        )}
      >
        {renderSummary()}
      </div>

      <div className="triangle-angle-sum__controls">
        <strong>Move vertex A</strong>
        <label htmlFor={horizontalControlId}>
          <span>
            <span>Left or right</span>
            <span>{horizontalPositionLabel(apexX)}</span>
          </span>
          <input
            aria-valuetext={horizontalPositionLabel(apexX)}
            id={horizontalControlId}
            max={maximumApexX}
            min={minimumApexX}
            onChange={(event) => setApexX(Number(event.target.value))}
            type="range"
            value={apexX}
          />
        </label>
        <label htmlFor={heightControlId}>
          <span>
            <span>Up or down</span>
            <span>{heightLabel(apexHeight)}</span>
          </span>
          <input
            aria-valuetext={heightLabel(apexHeight)}
            id={heightControlId}
            max={maximumApexHeight}
            min={minimumApexHeight}
            onChange={(event) => setApexHeight(Number(event.target.value))}
            type="range"
            value={apexHeight}
          />
        </label>
      </div>

      <p
        aria-live="polite"
        className={classNames(
          "triangle-angle-sum__status",
          (isExploring || showConclusion) && "triangle-angle-sum__status--result",
        )}
      >
        {discovery.status}
      </p>
    </div>
  );
}
