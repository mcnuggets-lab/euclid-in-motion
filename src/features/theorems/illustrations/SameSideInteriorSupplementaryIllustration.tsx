import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/same-side-interior-supplementary.css";

import {
  angleFrom,
  classNames,
  clamp,
  formatDisplayNumber,
  getSvgCoordinates,
  lineEndpointsFromPoints,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type SameSideInteriorSupplementaryIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ArcData = {
  label: Point;
  path: string;
};

type IllustrationStep = TheoremDiscovery & {
  status: string;
};

type SameSidePairIndex = 0 | 1;

const pointP = { x: 156, y: 72 };
const lineAngle = 17;
const linePointDistance = 48;
const lineOffsetDistance = 88;
const minimumQOffset = -72;
const maximumQOffset = 72;
const initialQOffset = 8;
const handleRadius = 24;
const measurementTolerance = 0.000001;
const transversalExtensionDistance = 34;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function direction(angle: number): Point {
  const radians = degreesToRadians(angle);
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

function move(point: Point, vector: Point, distance: number): Point {
  return {
    x: point.x + vector.x * distance,
    y: point.y + vector.y * distance,
  };
}

function dot(first: Point, second: Point) {
  return first.x * second.x + first.y * second.y;
}

function directionBetween(first: Point, second: Point): Point {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
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
  labelRadius = radius + 14,
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
  return radiansToDegrees(difference);
}

function formatAngle(value: number) {
  return `${formatDisplayNumber(value, 1)}°`;
}

function formatTotal(value: number) {
  return Math.abs(value - 180) < 0.05
    ? "180° / Supplementary"
    : `${formatDisplayNumber(value, 1)}° / Check`;
}

function parallelMark(center: Point, angle: number, className: string, key: string) {
  const vector = direction(angle);
  const normal = { x: -vector.y, y: vector.x };
  const firstStart = move(move(center, vector, -7), normal, 5);
  const firstEnd = move(move(center, vector, -7), normal, -5);
  const secondCenter = move(center, vector, 6);
  const secondStart = move(secondCenter, normal, 5);
  const secondEnd = move(secondCenter, normal, -5);

  return (
    <g className={className} key={key}>
      <path d={`M ${firstStart.x} ${firstStart.y} L ${center.x} ${center.y} L ${firstEnd.x} ${firstEnd.y}`} />
      <path d={`M ${secondStart.x} ${secondStart.y} L ${secondCenter.x} ${secondCenter.y} L ${secondEnd.x} ${secondEnd.y}`} />
    </g>
  );
}

const lineDirection = direction(lineAngle);
const lineNormal = { x: -lineDirection.y, y: lineDirection.x };
const basePointQ = move(pointP, lineNormal, lineOffsetDistance);
const pointA = move(pointP, lineDirection, -linePointDistance);
const pointE = move(pointP, lineDirection, linePointDistance);

function pointQForOffset(qOffset: number) {
  return move(basePointQ, lineDirection, qOffset);
}

function pointBForQ(pointQ: Point) {
  return move(pointQ, lineDirection, linePointDistance);
}

function pointCForQ(pointQ: Point) {
  return move(pointQ, lineDirection, -linePointDistance);
}

function pointDForQ(pointQ: Point) {
  return move(pointQ, directionBetween(pointP, pointQ), transversalExtensionDistance);
}

function measureSameSidePair(qOffset: number, pairIndex: SameSidePairIndex) {
  const pointQ = pointQForOffset(qOffset);
  const pointB = pointBForQ(pointQ);
  const pointC = pointCForQ(pointQ);
  const pointD = pointDForQ(pointQ);
  const pair = pairIndex === 0
    ? {
        firstName: "APQ",
        firstPoints: [pointA, pointQ] as [Point, Point],
        secondName: "CQP",
        secondPoints: [pointC, pointP] as [Point, Point],
      }
    : {
        firstName: "QPE",
        firstPoints: [pointQ, pointE] as [Point, Point],
        secondName: "PQB",
        secondPoints: [pointP, pointB] as [Point, Point],
      };
  const firstAngle = angleSize(pointP, ...pair.firstPoints);
  const secondAngle = angleSize(pointQ, ...pair.secondPoints);

  return {
    firstAngle,
    firstName: pair.firstName,
    firstPoints: pair.firstPoints,
    pointB,
    pointC,
    pointD,
    pointQ,
    secondAngle,
    secondName: pair.secondName,
    secondPoints: pair.secondPoints,
    total: firstAngle + secondAngle,
  };
}

export function SameSideInteriorSupplementaryIllustration({
  activeStep,
  onDiscoveryChange,
}: SameSideInteriorSupplementaryIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const moveQControlId = useId();
  const [qOffset, setQOffset] = useState(initialQOffset);
  const [pairIndex, setPairIndex] = useState<SameSidePairIndex>(0);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentQOffset = isExploring ? qOffset : initialQOffset;
  const currentPairIndex: SameSidePairIndex = isExploring ? pairIndex : 0;
  const {
    firstAngle,
    firstName,
    firstPoints,
    pointB,
    pointC,
    pointD,
    pointQ,
    secondAngle,
    secondName,
    secondPoints,
    total,
  } = measureSameSidePair(currentQOffset, currentPairIndex);
  const totalMatches = Math.abs(total - 180) <= measurementTolerance;
  const transversalDirection = directionBetween(pointP, pointQ);
  const transversalNormal = {
    x: -transversalDirection.y,
    y: transversalDirection.x,
  };
  const lineLEndpoints = lineEndpointsFromPoints(pointP, pointA);
  const lineMEndpoints = lineEndpointsFromPoints(pointQ, pointB);
  const transversalEndpoints = lineEndpointsFromPoints(pointP, pointQ);
  const firstAngleArc = minorArc(pointP, ...firstPoints, 18, 32);
  const firstAngleOuterArc = minorArc(pointP, ...firstPoints, 23, 38);
  const secondAngleArc = minorArc(pointQ, ...secondPoints, 18, 32);
  const bridgeAngleArc = minorArc(pointQ, pointD, pointC, 18, 32);
  const bridgeAngleOuterArc = minorArc(pointQ, pointD, pointC, 23, 38);
  const lineLLabelPoint = move(pointA, lineDirection, -14);
  const lineMLabelPoint = move(pointB, lineDirection, 14);
  const transversalLabelPoint = move(
    move(pointP, transversalDirection, 34),
    transversalNormal,
    18,
  );
  const givenLineMarkCenter = move(pointP, lineDirection, 36);
  const givenParallelMarkCenter = move(pointQ, lineDirection, 36);
  const showBridge = !isExploring && proofStep >= 1;
  const showCorresponding = !isExploring && proofStep === 1;
  const showLinearPair = !isExploring && proofStep === 2;
  const showConclusion = !isExploring && proofStep === 3;
  const firstMuted = showLinearPair;
  const secondMuted = showCorresponding;
  const bridgeMuted = showConclusion;
  const showPointA = !isExploring || currentPairIndex === 0;
  const showPointB = isExploring && currentPairIndex === 1;
  const showPointC = !isExploring || currentPairIndex === 0;
  const showPointD = showBridge;
  const showPointE = isExploring && currentPairIndex === 1;

  const proofSteps: IllustrationStep[] = [
    {
      insight:
        "The hypothesis identifies parallel lines and the blue-orange same-side interior pair. The target 180° sum is stated, but the picture has not yet justified it.",
      prompt:
        "Keep the target angles distinct here. Their positions identify the pair; the proof still needs a known equal angle and a linear pair.",
      status:
        "Given: ℓ ∥ m. The same-side interior pair is ∠APQ and ∠CQP. Goal: prove ∠APQ + ∠CQP = 180°.",
      title: "Name the same-side pair",
    },
    {
      insight:
        "Point D extends the transversal beyond Q. The blue angle ∠APQ and purple angle ∠DQC occupy corresponding corners, so the preceding theorem gives their congruence.",
      prompt:
        "This step creates the replacement angle used in the sum. The matching double arcs appear only after the Corresponding Angles Theorem is applied.",
      status:
        "Choose D on t beyond Q. Since ∠APQ and ∠DQC are corresponding, ∠APQ ≅ ∠DQC.",
      title: "Apply the corresponding angles theorem",
    },
    {
      insight:
        "At Q, rays QP and QD are opposite and ray QC is shared. That makes purple ∠DQC and orange ∠CQP a linear pair, so their sizes add to 180°.",
      prompt:
        "The straight relationship at Q is the reason for the 180° sum. It comes from the Linear Pair Theorem, not from measuring the arcs.",
      status:
        "Angles ∠DQC and ∠CQP form a linear pair, so ∠DQC + ∠CQP = 180°.",
      title: "Form a linear pair",
    },
    {
      insight:
        "The corresponding-angle step says ∠APQ and ∠DQC have the same size. Substituting the blue target for the purple bridge angle transfers the linear-pair sum to the original same-side pair.",
      prompt:
        "Name the substitution explicitly: replace ∠DQC by its congruent angle ∠APQ, then return to the original blue-orange target pair.",
      status:
        "Replace ∠DQC by congruent ∠APQ: ∠APQ + ∠CQP = 180°. Therefore the same-side interior angles are supplementary.",
      title: "Substitute the target angle",
    },
  ];

  const explorationStep: IllustrationStep = {
    insight: totalMatches
      ? `As one angle grows, the other shrinks: ∠${firstName} = ${formatAngle(firstAngle)} and ∠${secondName} = ${formatAngle(secondAngle)}, with total ${formatAngle(total)}. These measurements illustrate the theorem; the guided proof explains why the total is always 180°.`
      : `The displayed measurements are ∠${firstName} = ${formatAngle(firstAngle)} and ∠${secondName} = ${formatAngle(secondAngle)}, with total ${formatAngle(total)}.`,
    prompt:
      "Move Q to change the transversal, then show the other same-side pair. Watch one angle grow as the other shrinks while their total stays 180°.",
    status: `Showing same-side pair ${currentPairIndex + 1} of 2: ∠${firstName} = ${formatAngle(firstAngle)}, ∠${secondName} = ${formatAngle(secondAngle)}, and the total is ${formatTotal(total)}.`,
    title: "Explore the supplementary total",
  };

  const currentStep = isExploring
    ? explorationStep
    : (proofSteps[proofStep] ?? proofSteps[0]);

  const figureDescription = isExploring
    ? `Parallel lines l and m are cut by transversal t at P and Q. Selected same-side interior angles ${firstName} and ${secondName} measure ${formatAngle(firstAngle)} and ${formatAngle(secondAngle)}, for a total of ${formatAngle(total)}.`
    : showConclusion
      ? "The purple bridge angle DQC is replaced by congruent blue angle APQ, giving angle APQ plus angle CQP equals 180 degrees."
      : showLinearPair
        ? "At Q, opposite rays QP and QD make angles DQC and CQP a linear pair whose sizes add to 180 degrees."
        : showCorresponding
          ? "Blue angle APQ and purple angle DQC are marked congruent by the Corresponding Angles Theorem."
          : "Parallel lines l and m are shown with same-side interior angles APQ and CQP as the target supplementary pair.";

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  const updateQOffset = (pointer: Point) => {
    const fromBase = {
      x: pointer.x - basePointQ.x,
      y: pointer.y - basePointQ.y,
    };
    const projectedOffset = dot(fromBase, lineDirection);
    setQOffset(Math.round(clamp(projectedOffset, minimumQOffset, maximumQOffset)));
  };

  const beginDrag = (event: PointerEvent<SVGCircleElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateQOffset(getSvgCoordinates(event.currentTarget.ownerSVGElement!, event));
  };

  const renderSummary = () => {
    if (isExploring) {
      return (
        <>
          <div className="theorem-measure same-side-interior__measure--first same-side-interior__measure--explore-first">
            <strong>∠{firstName}</strong>
            <span>{formatAngle(firstAngle)}</span>
          </div>
          <div className="theorem-measure same-side-interior__measure--second same-side-interior__measure--explore-second">
            <strong>∠{secondName}</strong>
            <span>{formatAngle(secondAngle)}</span>
          </div>
          <div className="theorem-measure same-side-interior__measure--result">
            <strong>Total</strong>
            <span>{formatTotal(total)}</span>
          </div>
        </>
      );
    }

    if (proofStep === 0) {
      return (
        <>
          <div className="theorem-measure same-side-interior__measure--given">
            <strong>Given</strong>
            <span>ℓ ∥ m</span>
          </div>
          <div className="theorem-measure">
            <strong>Pair</strong>
            <span>Same-side interior</span>
          </div>
          <div className="theorem-measure">
            <strong>Goal</strong>
            <span>∠APQ + ∠CQP = 180°</span>
          </div>
        </>
      );
    }

    if (proofStep === 1) {
      return (
        <>
          <div className="theorem-measure same-side-interior__measure--bridge">
            <strong>Corresponding pair</strong>
            <span>∠APQ and ∠DQC</span>
          </div>
          <div className="theorem-measure same-side-interior__measure--result">
            <strong>Corresponding angles</strong>
            <span>∠APQ ≅ ∠DQC</span>
          </div>
          <div className="theorem-measure same-side-interior__measure--note">
            <strong>Bridge angle</strong>
            <span>∠DQC will enter the linear pair</span>
          </div>
        </>
      );
    }

    if (proofStep === 2) {
      return (
        <>
          <div className="theorem-measure same-side-interior__measure--bridge">
            <strong>Opposite rays</strong>
            <span>QP and QD</span>
          </div>
          <div className="theorem-measure same-side-interior__measure--result">
            <strong>Linear pair</strong>
            <span>∠DQC + ∠CQP = 180°</span>
          </div>
          <div className="theorem-measure">
            <strong>Shared ray</strong>
            <span>QC joins the adjacent angles</span>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="theorem-measure same-side-interior__measure--bridge">
          <strong>Known equality</strong>
          <span>∠APQ and ∠DQC have the same size</span>
        </div>
        <div className="theorem-measure same-side-interior__measure--result">
          <strong>Substitution</strong>
          <span>Replace ∠DQC by ∠APQ</span>
        </div>
        <div className="theorem-measure same-side-interior__measure--conclusion">
          <strong>Conclusion</strong>
          <span>∠APQ + ∠CQP = 180°</span>
        </div>
      </>
    );
  };

  return (
    <div className="theorem-figure same-side-interior">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg same-side-interior__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (isExploring && isDragging) {
            updateQOffset(getSvgCoordinates(event.currentTarget, event));
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>
          {isExploring
            ? "Same-Side Interior Angles Theorem interactive figure"
            : `Same-Side Interior Angles Theorem — ${currentStep.title}`}
        </title>
        <desc id={descriptionId}>{figureDescription}</desc>

        <line className="same-side-interior__line" {...lineLEndpoints} />
        <line className="same-side-interior__line" {...lineMEndpoints} />
        <line
          className="same-side-interior__line same-side-interior__line--transversal"
          {...transversalEndpoints}
        />

        {parallelMark(
          givenLineMarkCenter,
          lineAngle,
          "same-side-interior__parallel-mark same-side-interior__parallel-mark--given",
          "given-line-l",
        )}
        {parallelMark(
          givenParallelMarkCenter,
          lineAngle,
          "same-side-interior__parallel-mark same-side-interior__parallel-mark--given",
          "given-line-m",
        )}

        <path
          className={classNames(
            "same-side-interior__angle same-side-interior__angle--first",
            firstMuted && "same-side-interior__angle--muted",
          )}
          d={firstAngleArc.path}
        />
        {showCorresponding ? (
          <path
            className="same-side-interior__angle same-side-interior__angle--first"
            d={firstAngleOuterArc.path}
          />
        ) : null}

        <path
          className={classNames(
            "same-side-interior__angle same-side-interior__angle--second",
            secondMuted && "same-side-interior__angle--muted",
            showLinearPair && "same-side-interior__angle--linear-pair",
          )}
          d={secondAngleArc.path}
        />

        {showBridge ? (
          <>
            <path
              className={classNames(
                "same-side-interior__angle same-side-interior__angle--bridge",
                bridgeMuted && "same-side-interior__angle--muted",
                showLinearPair && "same-side-interior__angle--linear-pair",
              )}
              d={bridgeAngleArc.path}
            />
            {showCorresponding ? (
              <path
                className="same-side-interior__angle same-side-interior__angle--bridge"
                d={bridgeAngleOuterArc.path}
              />
            ) : null}
          </>
        ) : null}

        <circle className="same-side-interior__point" cx={pointP.x} cy={pointP.y} r="4.5" />
        <circle
          className={classNames(
            "same-side-interior__point",
            isExploring && "same-side-interior__point--draggable",
          )}
          cx={pointQ.x}
          cy={pointQ.y}
          r="4.5"
        />
        {showPointA ? <circle className="same-side-interior__point same-side-interior__point--named" cx={pointA.x} cy={pointA.y} r="3.6" /> : null}
        {showPointB ? <circle className="same-side-interior__point same-side-interior__point--named" cx={pointB.x} cy={pointB.y} r="3.6" /> : null}
        {showPointC ? <circle className="same-side-interior__point same-side-interior__point--named" cx={pointC.x} cy={pointC.y} r="3.6" /> : null}
        {showPointD ? <circle className="same-side-interior__point same-side-interior__point--bridge" cx={pointD.x} cy={pointD.y} r="3.6" /> : null}
        {showPointE ? <circle className="same-side-interior__point same-side-interior__point--named" cx={pointE.x} cy={pointE.y} r="3.6" /> : null}
        {showLinearPair ? <circle className="same-side-interior__point-focus" cx={pointQ.x} cy={pointQ.y} r="11" /> : null}

        <text className="same-side-interior__point-label" x={pointP.x - 12} y={pointP.y - 8}>P</text>
        <text className="same-side-interior__point-label" x={pointQ.x + 12} y={pointQ.y + 15}>Q</text>
        {showPointA ? <text className="same-side-interior__point-label" x={pointA.x - 12} y={pointA.y - 8}>A</text> : null}
        {showPointB ? <text className="same-side-interior__point-label" x={pointB.x + 10} y={pointB.y + 13}>B</text> : null}
        {showPointC ? <text className="same-side-interior__point-label" x={pointC.x + 10} y={pointC.y + 17}>C</text> : null}
        {showPointD ? <text className="same-side-interior__point-label same-side-interior__point-label--bridge" x={pointD.x + 12} y={pointD.y - 8}>D</text> : null}
        {showPointE ? <text className="same-side-interior__point-label" x={pointE.x + 10} y={pointE.y - 8}>E</text> : null}

        <text className="same-side-interior__line-label" x={lineLLabelPoint.x - 8} y={lineLLabelPoint.y + 12}>ℓ</text>
        <text className="same-side-interior__line-label" x={lineMLabelPoint.x + 8} y={lineMLabelPoint.y - 10}>m</text>
        <text className="same-side-interior__line-label" x={transversalLabelPoint.x} y={transversalLabelPoint.y}>t</text>

        <text
          className={classNames(
            "same-side-interior__angle-label same-side-interior__angle-label--first",
            firstMuted && "same-side-interior__angle-label--muted",
          )}
          x={firstAngleArc.label.x}
          y={firstAngleArc.label.y}
        >
          {firstName}
        </text>
        <text
          className={classNames(
            "same-side-interior__angle-label same-side-interior__angle-label--second",
            secondMuted && "same-side-interior__angle-label--muted",
          )}
          x={secondAngleArc.label.x}
          y={secondAngleArc.label.y}
        >
          {secondName}
        </text>
        {showBridge ? (
          <text
            className={classNames(
              "same-side-interior__angle-label same-side-interior__angle-label--bridge",
              bridgeMuted && "same-side-interior__angle-label--muted",
            )}
            x={bridgeAngleArc.label.x}
            y={bridgeAngleArc.label.y}
          >
            DQC
          </text>
        ) : null}

        {showLinearPair ? (
          <text className="same-side-interior__line-note" x={218} y={126}>
            QP and QD are opposite rays
          </text>
        ) : null}

        {showConclusion ? (
          <text className="same-side-interior__chain" x={160} y={204}>
            ∠DQC + ∠CQP = 180°; replace ∠DQC by ∠APQ
          </text>
        ) : null}

        {isExploring ? (
          <>
            <circle
              aria-hidden="true"
              className={classNames(
                "same-side-interior__handle",
                isDragging && "same-side-interior__handle--active",
              )}
              cx={pointQ.x}
              cy={pointQ.y}
              r="8"
            />
            <circle
              aria-hidden="true"
              className="same-side-interior__handle-target"
              cx={pointQ.x}
              cy={pointQ.y}
              onPointerDown={beginDrag}
              r={handleRadius}
            />
          </>
        ) : null}
      </svg>

      <div className="same-side-interior__summary">{renderSummary()}</div>

      {isExploring ? (
        <div className="same-side-interior__controls">
          <button
            aria-label="Show the other same-side interior angle pair"
            className="same-side-interior__pair-action"
            onClick={() =>
              setPairIndex((current) => (current === 0 ? 1 : 0))
            }
            type="button"
          >
            Show another pair
          </button>
          <div className="same-side-interior__control">
            <span>
              <label htmlFor={moveQControlId}>
                <strong>Move Q along line m</strong>
              </label>
            </span>
            <input
              aria-valuetext={`Angle ${firstName} is ${formatAngle(firstAngle)}, angle ${secondName} is ${formatAngle(secondAngle)}, and their total is ${formatAngle(total)}.`}
              id={moveQControlId}
              max={maximumQOffset}
              min={minimumQOffset}
              onChange={(event) => setQOffset(Number(event.target.value))}
              step={1}
              type="range"
              value={currentQOffset}
            />
          </div>
        </div>
      ) : null}

      <p
        className={classNames(
          "same-side-interior__status",
          (isExploring || showConclusion) && "same-side-interior__status--result",
        )}
        role="status"
      >
        {currentStep.status}
      </p>
    </div>
  );
}
