import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/corresponding-angles.css";

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

type CorrespondingAnglesIllustrationProps = {
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

type CorrespondingPairIndex = 0 | 1 | 2 | 3;

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

function formatDifference(value: number) {
  return value < 0.05
    ? "0° / Equal"
    : `${formatDisplayNumber(value, 2)}° / Check`;
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

function pointRForQ(pointQ: Point) {
  return move(
    pointP,
    directionBetween(pointQ, pointP),
    transversalExtensionDistance,
  );
}

function measureCorrespondingPair(
  qOffset: number,
  pairIndex: CorrespondingPairIndex,
) {
  const pointQ = pointQForOffset(qOffset);
  const pointB = pointBForQ(pointQ);
  const pointC = pointCForQ(pointQ);
  const pointD = pointDForQ(pointQ);
  const pointR = pointRForQ(pointQ);
  const pairs = [
    {
      firstName: "APQ",
      firstPoints: [pointA, pointQ] as [Point, Point],
      secondName: "DQC",
      secondPoints: [pointD, pointC] as [Point, Point],
    },
    {
      firstName: "QPE",
      firstPoints: [pointQ, pointE] as [Point, Point],
      secondName: "BQD",
      secondPoints: [pointB, pointD] as [Point, Point],
    },
    {
      firstName: "EPR",
      firstPoints: [pointE, pointR] as [Point, Point],
      secondName: "PQB",
      secondPoints: [pointP, pointB] as [Point, Point],
    },
    {
      firstName: "RPA",
      firstPoints: [pointR, pointA] as [Point, Point],
      secondName: "CQP",
      secondPoints: [pointC, pointP] as [Point, Point],
    },
  ] as const;
  const pair = pairs[pairIndex];

  return {
    firstAngle: angleSize(pointP, ...pair.firstPoints),
    firstName: pair.firstName,
    firstPoints: pair.firstPoints,
    pointB,
    pointC,
    pointD,
    pointQ,
    pointR,
    secondAngle: angleSize(pointQ, ...pair.secondPoints),
    secondName: pair.secondName,
    secondPoints: pair.secondPoints,
  };
}

export function CorrespondingAnglesIllustration({
  activeStep,
  onDiscoveryChange,
}: CorrespondingAnglesIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const moveQControlId = useId();
  const [qOffset, setQOffset] = useState(initialQOffset);
  const [pairIndex, setPairIndex] = useState<CorrespondingPairIndex>(0);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentQOffset = isExploring ? qOffset : initialQOffset;
  const currentPairIndex: CorrespondingPairIndex = isExploring ? pairIndex : 0;
  const {
    firstAngle,
    firstName,
    firstPoints,
    pointB,
    pointC,
    pointD,
    pointQ,
    pointR,
    secondAngle,
    secondName,
    secondPoints,
  } = measureCorrespondingPair(currentQOffset, currentPairIndex);
  const angleDifference = Math.abs(firstAngle - secondAngle);
  const anglesMatch = angleDifference <= measurementTolerance;
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
  const bridgeAngleArc = minorArc(pointQ, pointP, pointB, 18, 32);
  const bridgeAngleOuterArc = minorArc(pointQ, pointP, pointB, 23, 38);
  const correspondingAngleArc = minorArc(pointQ, ...secondPoints, 18, 32);
  const correspondingAngleOuterArc = minorArc(pointQ, ...secondPoints, 23, 38);
  const lineLLabelPoint = move(pointA, lineDirection, -14);
  const lineMLabelPoint = move(pointB, lineDirection, 14);
  const transversalLabelPoint = move(
    move(pointP, transversalDirection, 34),
    transversalNormal,
    18,
  );
  const givenLineMarkCenter = move(pointP, lineDirection, 36);
  const givenParallelMarkCenter = move(pointQ, lineDirection, 36);
  const showBridgeAngle = !isExploring && proofStep >= 1;
  const showBridgePoint = showBridgeAngle;
  const showOppositeRayNotes = !isExploring && proofStep === 2;
  const showConclusion = !isExploring && proofStep === 3;
  const apqMuted = !isExploring && proofStep === 2;
  const pqbMuted = showConclusion;
  const dqcMuted = !isExploring && proofStep === 1;
  const showApqDouble = !isExploring && (proofStep === 1 || proofStep === 3);
  const showPqbDouble = !isExploring && proofStep === 1;
  const showTransferPair = !isExploring && proofStep === 2;
  const showTargetPair = !isExploring && proofStep === 3;
  const showPointA = !isExploring || currentPairIndex === 0 || currentPairIndex === 3;
  const showPointB = isExploring
    ? currentPairIndex === 1 || currentPairIndex === 2
    : showBridgePoint;
  const showPointC = !isExploring || currentPairIndex === 0 || currentPairIndex === 3;
  const showPointD = !isExploring || currentPairIndex === 0 || currentPairIndex === 1;
  const showPointE = isExploring && (currentPairIndex === 1 || currentPairIndex === 2);
  const showPointR = isExploring && (currentPairIndex === 2 || currentPairIndex === 3);

  const proofSteps: IllustrationStep[] = [
    {
      insight:
        "The theorem begins with the named corresponding pair ∠APQ and ∠DQC. Matching corners describe the goal, but the picture has not yet justified congruence.",
      prompt:
        "Keep the blue and purple target angles separate here: the diagram names the pair, and the proof still has to connect them through earlier results.",
      status:
        "Given: ℓ ∥ m. The corresponding pair is ∠APQ and ∠DQC, and the goal is to prove ∠APQ ≅ ∠DQC.",
      title: "Name the corresponding pair",
    },
    {
      insight:
        "Introducing B on the ray opposite C turns ∠PQB into the bridge angle from the previous lesson. The Alternate Interior Angles Theorem now transfers congruence from ∠APQ to ∠PQB.",
      prompt:
        "This step reuses the established alternate interior result. The bridge angle ∠PQB matters because it shares a vertex with the target angle at Q.",
      status:
        "Choose B on m so QB and QC are opposite. Then ∠APQ and ∠PQB are alternate interior, so ∠APQ ≅ ∠PQB.",
      title: "Apply the alternate interior theorem",
    },
    {
      insight:
        "At Q, the transversal and line m create two pairs of opposite rays. That makes ∠PQB and ∠DQC a vertical pair, so the Vertical Angles Theorem carries congruence from the bridge angle to the target angle at Q.",
      prompt:
        "Notice that QP is opposite QD and QB is opposite QC. Those opposite-ray facts are what justify the vertical-angle step.",
      status:
        "At Q, rays QP and QD are opposite and rays QB and QC are opposite, so ∠PQB and ∠DQC are vertical and congruent.",
      title: "Apply the vertical angles theorem",
    },
    {
      insight:
        "The bridge angle now links the two earlier congruences into a chain. Transitivity is the final logical step that returns to the original corresponding pair.",
      prompt:
        "The chain ∠APQ ≅ ∠PQB ≅ ∠DQC explains the conclusion, but the reason must still be named explicitly as transitivity.",
      status:
        "Transitivity combines ∠APQ ≅ ∠PQB and ∠PQB ≅ ∠DQC to conclude ∠APQ ≅ ∠DQC.",
      title: "Transfer congruence",
    },
  ];

  const explorationStep: IllustrationStep = {
    insight: anglesMatch
      ? `The measurements match: ∠${firstName} = ${formatAngle(firstAngle)} and ∠${secondName} = ${formatAngle(secondAngle)}. Moving Q changes both angles together while they remain equal.`
      : `The displayed measurements are ∠${firstName} = ${formatAngle(firstAngle)} and ∠${secondName} = ${formatAngle(secondAngle)}.`,
    prompt:
      "Move Q to change the transversal. The equal measurements illustrate the corresponding-angle result in each shown case; the guided proof explains why it follows from two earlier theorems.",
    status: `Showing corresponding pair ${currentPairIndex + 1} of 4: ∠${firstName} = ${formatAngle(firstAngle)}, ∠${secondName} = ${formatAngle(secondAngle)}, and the displayed difference is ${formatDifference(angleDifference)}.`,
    title: "Explore the corresponding-angle equality",
  };

  const currentStep = isExploring
    ? explorationStep
    : (proofSteps[proofStep] ?? proofSteps[0]);

  const figureDescription = isExploring
    ? `Parallel lines l and m are cut by transversal t at P and Q. Selected corresponding angles ${firstName} and ${secondName} each measure ${formatAngle(firstAngle)} while Q slides along line m.`
    : showConclusion
      ? "The proof now shows the congruence chain angle APQ congruent to angle PQB congruent to angle DQC, and transitivity concludes the original corresponding pair is congruent."
      : proofStep === 2
        ? "At point Q, opposite rays QP with QD and QB with QC show that angle PQB and angle DQC are vertical angles."
        : proofStep === 1
          ? "Point B appears on line m opposite C so that angle APQ and angle PQB form the alternate interior bridge used in the proof."
          : "Parallel lines l and m are shown with corresponding angles APQ and DQC as the named goal of the theorem.";

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
          <div className="theorem-measure corresponding-angles__measure--apq corresponding-angles__measure--explore-first">
            <strong>∠{firstName}</strong>
            <span>{formatAngle(firstAngle)}</span>
          </div>
          <div className="theorem-measure corresponding-angles__measure--dqc corresponding-angles__measure--explore-second">
            <strong>∠{secondName}</strong>
            <span>{formatAngle(secondAngle)}</span>
          </div>
          <div className="theorem-measure corresponding-angles__measure--result">
            <strong>Difference</strong>
            <span>{formatDifference(angleDifference)}</span>
          </div>
        </>
      );
    }

    if (proofStep === 0) {
      return (
        <>
          <div className="theorem-measure corresponding-angles__measure--given">
            <strong>Given</strong>
            <span>ℓ ∥ m</span>
          </div>
          <div className="theorem-measure">
            <strong>Pair</strong>
            <span>Corresponding</span>
          </div>
          <div className="theorem-measure">
            <strong>Goal</strong>
            <span>∠APQ ≅ ∠DQC</span>
          </div>
        </>
      );
    }

    if (proofStep === 1) {
      return (
        <>
          <div className="theorem-measure corresponding-angles__measure--bridge">
            <strong>Choose B</strong>
            <span>QB and QC are opposite rays</span>
          </div>
          <div className="theorem-measure corresponding-angles__measure--result">
            <strong>Alternate interior</strong>
            <span>∠APQ ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure corresponding-angles__measure--note">
            <strong>Bridge angle</strong>
            <span>∠PQB links the target pair</span>
          </div>
        </>
      );
    }

    if (proofStep === 2) {
      return (
        <>
          <div className="theorem-measure corresponding-angles__measure--bridge">
            <strong>Opposite rays</strong>
            <span>QP and QD; QB and QC</span>
          </div>
          <div className="theorem-measure corresponding-angles__measure--result">
            <strong>Vertical angles</strong>
            <span>∠PQB ≅ ∠DQC</span>
          </div>
          <div className="theorem-measure">
            <strong>Transfer</strong>
            <span>The bridge angle now reaches ∠DQC</span>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="theorem-measure corresponding-angles__measure--bridge">
          <strong>Chain</strong>
          <span>∠APQ ≅ ∠PQB ≅ ∠DQC</span>
        </div>
        <div className="theorem-measure corresponding-angles__measure--result">
          <strong>Transitivity</strong>
          <span>The bridge congruence transfers to the target pair</span>
        </div>
        <div className="theorem-measure corresponding-angles__measure--dqc">
          <strong>Conclusion</strong>
          <span>∠APQ ≅ ∠DQC</span>
        </div>
      </>
    );
  };

  return (
    <div className="theorem-figure corresponding-angles">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg corresponding-angles__svg"
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
            ? "Corresponding Angles Theorem interactive figure"
            : `Corresponding Angles Theorem — ${currentStep.title}`}
        </title>
        <desc id={descriptionId}>{figureDescription}</desc>

        <line className="corresponding-angles__line" {...lineLEndpoints} />
        <line className="corresponding-angles__line" {...lineMEndpoints} />
        <line
          className="corresponding-angles__line corresponding-angles__line--transversal"
          {...transversalEndpoints}
        />

        {parallelMark(
          givenLineMarkCenter,
          lineAngle,
          "corresponding-angles__parallel-mark corresponding-angles__parallel-mark--given",
          "given-line-l",
        )}
        {parallelMark(
          givenParallelMarkCenter,
          lineAngle,
          "corresponding-angles__parallel-mark corresponding-angles__parallel-mark--given",
          "given-line-m",
        )}

        <path
          className={classNames(
            "corresponding-angles__angle corresponding-angles__angle--apq",
            apqMuted && "corresponding-angles__angle--muted",
          )}
          d={firstAngleArc.path}
        />
        {showApqDouble ? (
          <path
            className={classNames(
              "corresponding-angles__angle corresponding-angles__angle--apq",
              apqMuted && "corresponding-angles__angle--muted",
            )}
            d={firstAngleOuterArc.path}
          />
        ) : null}

        {showBridgeAngle ? (
          <>
            <path
              className={classNames(
                "corresponding-angles__angle corresponding-angles__angle--pqb",
                pqbMuted && "corresponding-angles__angle--muted",
                showTransferPair && "corresponding-angles__angle--transfer",
              )}
              d={bridgeAngleArc.path}
            />
            {showPqbDouble || showTransferPair ? (
              <path
                className={classNames(
                  "corresponding-angles__angle corresponding-angles__angle--pqb",
                  pqbMuted && "corresponding-angles__angle--muted",
                  showTransferPair && "corresponding-angles__angle--transfer",
                )}
                d={bridgeAngleOuterArc.path}
              />
            ) : null}
          </>
        ) : null}

        <path
          className={classNames(
            "corresponding-angles__angle corresponding-angles__angle--dqc",
            (isExploring || proofStep <= 1) && "corresponding-angles__angle--pending",
            dqcMuted && "corresponding-angles__angle--muted",
            showTransferPair && "corresponding-angles__angle--transfer",
          )}
          d={correspondingAngleArc.path}
        />
        {showTransferPair || showTargetPair ? (
          <path
            className={classNames(
              "corresponding-angles__angle corresponding-angles__angle--dqc",
              showTargetPair && "corresponding-angles__angle--target",
              showTransferPair && "corresponding-angles__angle--transfer",
              dqcMuted && "corresponding-angles__angle--muted",
            )}
            d={correspondingAngleOuterArc.path}
          />
        ) : null}

        <circle className="corresponding-angles__point" cx={pointP.x} cy={pointP.y} r="4.5" />
        <circle
          className={classNames(
            "corresponding-angles__point",
            isExploring && "corresponding-angles__point--draggable",
          )}
          cx={pointQ.x}
          cy={pointQ.y}
          r="4.5"
        />
        {showPointA ? <circle className="corresponding-angles__point corresponding-angles__point--named" cx={pointA.x} cy={pointA.y} r="3.6" /> : null}
        {showPointC ? <circle className="corresponding-angles__point corresponding-angles__point--named" cx={pointC.x} cy={pointC.y} r="3.6" /> : null}
        {showPointD ? <circle className="corresponding-angles__point corresponding-angles__point--named" cx={pointD.x} cy={pointD.y} r="3.6" /> : null}
        {showPointE ? <circle className="corresponding-angles__point corresponding-angles__point--named" cx={pointE.x} cy={pointE.y} r="3.6" /> : null}
        {showPointR ? <circle className="corresponding-angles__point corresponding-angles__point--named" cx={pointR.x} cy={pointR.y} r="3.6" /> : null}
        {showPointB ? (
          <circle
            className={classNames(
              "corresponding-angles__point corresponding-angles__point--named",
              !isExploring && "corresponding-angles__point--bridge",
            )}
            cx={pointB.x}
            cy={pointB.y}
            r="3.6"
          />
        ) : null}
        {showOppositeRayNotes ? (
          <circle className="corresponding-angles__point-focus" cx={pointQ.x} cy={pointQ.y} r="11" />
        ) : null}

        <text className="corresponding-angles__point-label" x={pointP.x - 12} y={pointP.y - 8}>P</text>
        <text className="corresponding-angles__point-label" x={pointQ.x + 12} y={pointQ.y + 15}>Q</text>
        {showPointA ? <text className="corresponding-angles__point-label" x={pointA.x - 12} y={pointA.y - 8}>A</text> : null}
        {showPointC ? <text className="corresponding-angles__point-label" x={pointC.x + 10} y={pointC.y + 17}>C</text> : null}
        {showPointD ? <text className="corresponding-angles__point-label" x={pointD.x + 12} y={pointD.y - 8}>D</text> : null}
        {showPointE ? <text className="corresponding-angles__point-label" x={pointE.x + 10} y={pointE.y - 8}>E</text> : null}
        {showPointR ? <text className="corresponding-angles__point-label" x={pointR.x + 12} y={pointR.y - 8}>R</text> : null}
        {showPointB ? (
          <text
            className={classNames(
              "corresponding-angles__point-label",
              !isExploring && "corresponding-angles__point-label--bridge",
            )}
            x={pointB.x + 10}
            y={pointB.y + 13}
          >
            B
          </text>
        ) : null}

        <text className="corresponding-angles__line-label" x={lineLLabelPoint.x - 8} y={lineLLabelPoint.y + 12}>ℓ</text>
        <text className="corresponding-angles__line-label" x={lineMLabelPoint.x + 8} y={lineMLabelPoint.y - 10}>m</text>
        <text className="corresponding-angles__line-label" x={transversalLabelPoint.x} y={transversalLabelPoint.y}>t</text>

        <text
          className={classNames(
            "corresponding-angles__angle-label corresponding-angles__angle-label--apq",
            apqMuted && "corresponding-angles__angle-label--muted",
          )}
          x={firstAngleArc.label.x}
          y={firstAngleArc.label.y}
        >
          {firstName}
        </text>
        {showBridgeAngle ? (
          <text
            className={classNames(
              "corresponding-angles__angle-label corresponding-angles__angle-label--pqb",
              pqbMuted && "corresponding-angles__angle-label--muted",
            )}
            x={bridgeAngleArc.label.x}
            y={bridgeAngleArc.label.y}
          >
            PQB
          </text>
        ) : null}
        <text
          className={classNames(
            "corresponding-angles__angle-label corresponding-angles__angle-label--dqc",
            dqcMuted && "corresponding-angles__angle-label--muted",
          )}
          x={correspondingAngleArc.label.x}
          y={correspondingAngleArc.label.y}
        >
          {secondName}
        </text>

        {showOppositeRayNotes ? (
          <>
            <text className="corresponding-angles__line-note" x={212} y={126}>
              QP and QD opposite
            </text>
            <text className="corresponding-angles__line-note" x={218} y={145}>
              QB and QC opposite
            </text>
          </>
        ) : null}

        {showConclusion ? (
          <text className="corresponding-angles__chain" x={160} y={204}>
            ∠APQ ≅ ∠PQB ≅ ∠DQC
          </text>
        ) : null}

        {isExploring ? (
          <>
            <circle
              aria-hidden="true"
              className={classNames(
                "corresponding-angles__handle",
                isDragging && "corresponding-angles__handle--active",
              )}
              cx={pointQ.x}
              cy={pointQ.y}
              r="8"
            />
            <circle
              aria-hidden="true"
              className="corresponding-angles__handle-target"
              cx={pointQ.x}
              cy={pointQ.y}
              onPointerDown={beginDrag}
              r={handleRadius}
            />
          </>
        ) : null}
      </svg>

      <div className="corresponding-angles__summary">{renderSummary()}</div>

      {isExploring ? (
        <div className="corresponding-angles__controls">
          <button
            aria-label="Show the next corresponding angle pair"
            className="corresponding-angles__pair-action"
            onClick={() =>
              setPairIndex(
                (current) => ((current + 1) % 4) as CorrespondingPairIndex,
              )
            }
            type="button"
          >
            Show another pair
          </button>
          <div className="corresponding-angles__control">
            <span>
              <label htmlFor={moveQControlId}>
                <strong>Move Q along line m</strong>
              </label>
            </span>
            <input
              aria-valuetext={`Angle ${firstName} is ${formatAngle(firstAngle)} and angle ${secondName} is ${formatAngle(secondAngle)}.`}
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
          "corresponding-angles__status",
          (isExploring || showConclusion) && "corresponding-angles__status--result",
        )}
        role="status"
      >
        {currentStep.status}
      </p>
    </div>
  );
}
