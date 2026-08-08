import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/alternate-interior-angles.css";

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

type AlternateInteriorAnglesIllustrationProps = {
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

type AlternatePairIndex = 0 | 1;

const pointP = { x: 156, y: 72 };
const lineAngle = 17;
const linePointDistance = 48;
const lineCopyDistance = 78;
const lineOffsetDistance = 88;
const minimumQOffset = -72;
const maximumQOffset = 72;
const initialQOffset = 8;
const handleRadius = 24;
const measurementTolerance = 0.000001;

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
const pointX = move(pointP, lineDirection, -lineCopyDistance);

function pointQForOffset(qOffset: number) {
  return move(basePointQ, lineDirection, qOffset);
}

function pointBForQ(pointQ: Point) {
  return move(pointQ, lineDirection, linePointDistance);
}

function pointCForQ(pointQ: Point) {
  return move(pointQ, lineDirection, -linePointDistance);
}

function measureAlternateInteriorPair(
  qOffset: number,
  pairIndex: AlternatePairIndex,
) {
  const pointQ = pointQForOffset(qOffset);
  const pointB = pointBForQ(pointQ);
  const pointC = pointCForQ(pointQ);
  const firstPoints: [Point, Point] =
    pairIndex === 0 ? [pointA, pointQ] : [pointQ, pointE];
  const secondPoints: [Point, Point] =
    pairIndex === 0 ? [pointP, pointB] : [pointC, pointP];

  return {
    firstAngle: angleSize(pointP, ...firstPoints),
    firstName: pairIndex === 0 ? "APQ" : "QPE",
    firstPoints,
    pointB,
    pointC,
    pointQ,
    secondAngle: angleSize(pointQ, ...secondPoints),
    secondName: pairIndex === 0 ? "PQB" : "CQP",
    secondPoints,
  };
}

export function AlternateInteriorAnglesIllustration({
  activeStep,
  onDiscoveryChange,
}: AlternateInteriorAnglesIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const moveQControlId = useId();
  const [qOffset, setQOffset] = useState(initialQOffset);
  const [pairIndex, setPairIndex] = useState<AlternatePairIndex>(0);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const guidedQOffset = initialQOffset;
  const currentQOffset = isExploring ? qOffset : guidedQOffset;
  const currentPairIndex: AlternatePairIndex = isExploring ? pairIndex : 0;
  const {
    firstAngle,
    firstName,
    firstPoints,
    pointB,
    pointC,
    pointQ,
    secondAngle,
    secondName,
    secondPoints,
  } = measureAlternateInteriorPair(currentQOffset, currentPairIndex);
  const angleDifference = Math.abs(firstAngle - secondAngle);
  const anglesMatch = angleDifference <= measurementTolerance;
  const lineLEndpoints = lineEndpointsFromPoints(pointP, pointA);
  const lineMEndpoints = lineEndpointsFromPoints(pointQ, pointB);
  const transversalEndpoints = lineEndpointsFromPoints(pointP, pointQ);
  const auxiliaryLineEndpoints = lineEndpointsFromPoints(pointP, pointX);
  const firstAngleArc = minorArc(pointP, ...firstPoints, 18, 32);
  const firstAngleOuterArc = minorArc(pointP, ...firstPoints, 23, 38);
  const secondAngleArc = minorArc(pointQ, ...secondPoints, 18, 32);
  const secondAngleOuterArc = minorArc(pointQ, ...secondPoints, 23, 38);
  const lineLLabelPoint = move(pointA, lineDirection, -14);
  const lineMLabelPoint = move(pointB, lineDirection, 14);
  const transversalLabelPoint = move(move(pointP, lineNormal, 24), lineDirection, 10);
  const auxiliaryLabelPoint = move(pointX, lineNormal, -18);
  const uniquenessLabelPoint = move(pointP, lineNormal, -25);
  const givenLineMarkCenter = move(pointP, lineDirection, 36);
  const givenParallelMarkCenter = move(pointQ, lineDirection, 36);
  const derivedLineMarkCenter = move(pointP, lineDirection, -18);
  const derivedParallelMarkCenter = move(pointQ, lineDirection, 62);

  const showAuxiliaryLine = !isExploring && proofStep >= 1;
  const showDerivedParallel = !isExploring && proofStep >= 2;
  const showPlayfair = !isExploring && proofStep >= 3;
  const showConclusion = !isExploring && proofStep === 4;
  const showCopiedAngles = !isExploring && proofStep >= 1 && proofStep <= 3;
  const showOriginalAngles = isExploring || proofStep === 0 || showConclusion;

  const proofSteps: IllustrationStep[] = [
    {
      insight:
        "The theorem starts with parallel lines ℓ and m and a named alternate interior pair. The picture names the target conclusion, but the proof still has to justify the congruence.",
      prompt:
        "The guided proof removes the measurement cards because equal degree readings are only an observation, not the reason.",
      status:
        "Given: ℓ ∥ m, and the selected alternate interior pair is ∠APQ with ∠PQB. Goal: show ∠APQ ≅ ∠PQB.",
      title: "State the parallel hypothesis and goal",
    },
    {
      insight:
        "The Congruence Axioms copy ∠PQB at P inside the half-plane bounded by t that contains A. The dashed overlay names the copied ray PX and its line n, but the picture alone does not prove n = ℓ.",
      prompt:
        "The copied angle is ∠XPQ, not yet ∠APQ. The overlay coincides with ℓ only as an illustration of the construction.",
      status:
        "Construct ray PX in the half-plane containing A so that ∠XPQ ≅ ∠PQB, and let n be the line through PX.",
      title: "Copy the angle at P",
    },
    {
      insight:
        "Now ∠XPQ and ∠PQB are congruent alternate interior angles for n and m. The converse theorem turns that copied congruence into the new relation n ∥ m.",
      prompt:
        "This step certifies the auxiliary line. The congruence comes from the construction, and the parallel conclusion comes from the converse theorem.",
      status:
        "Copied alternate angles congruent, so the Converse of the Alternate Interior Angles Theorem gives n ∥ m.",
      title: "Apply the converse theorem",
    },
    {
      insight:
        "Both ℓ and n pass through P, and both are parallel to m. Playfair's uniqueness now proves the overlay line is not merely drawn on top of ℓ: it is the same line.",
      prompt:
        "Keep the two parallel relations separate here: ℓ ∥ m is the given hypothesis, while n ∥ m is the derived result used with Playfair.",
      status:
        "Playfair's Axiom gives n = ℓ because through P there is exactly one line parallel to m.",
      title: "Use Playfair uniqueness",
    },
    {
      insight:
        "Once n = ℓ is proved, the chosen half-plane forces ray PX to be the same ray as PA. Substituting that ray name transfers the copied congruence to the original alternate interior angle.",
      prompt:
        "The proof ends by renaming the copied ray, not by appealing to the picture. That final substitution turns ∠XPQ ≅ ∠PQB into ∠APQ ≅ ∠PQB.",
      status:
        "Because ray PX is ray PA in the chosen half-plane, ∠XPQ = ∠APQ, so the copied congruence becomes ∠APQ ≅ ∠PQB.",
      title: "Substitute the original ray",
    },
  ];

  const explorationStep: IllustrationStep = {
    insight: anglesMatch
      ? `The measurements match: ∠${firstName} = ${formatAngle(firstAngle)} and ∠${secondName} = ${formatAngle(secondAngle)}. Moving Q changes both angles together while they remain equal.`
      : `The displayed measurements are ∠${firstName} = ${formatAngle(firstAngle)} and ∠${secondName} = ${formatAngle(secondAngle)}.`,
    prompt:
      "Move Q to change the transversal. The equal measurements illustrate what happens in each shown case; the guided proof establishes the result for every transversal.",
    status: `Showing alternate interior pair ${currentPairIndex + 1} of 2: ∠${firstName} = ${formatAngle(firstAngle)}, ∠${secondName} = ${formatAngle(secondAngle)}, and the displayed difference is ${formatDifference(angleDifference)}.`,
    title: "Explore the alternate interior equality",
  };

  const currentStep = isExploring
    ? explorationStep
    : (proofSteps[proofStep] ?? proofSteps[0]);

  const figureDescription = isExploring
    ? `Parallel lines l and m are cut by transversal t at P and Q. Selected alternate interior angles ${firstName} and ${secondName} each measure ${formatAngle(firstAngle)} while Q slides along line m.`
    : showConclusion
      ? "The copied line has been identified with line l, so ray PX is ray PA and the theorem concludes that angle APQ is congruent to angle PQB."
      : proofStep === 3
        ? "Both line l and line n pass through P, and both are marked parallel to line m so Playfair's uniqueness can prove n equals l."
        : proofStep === 2
          ? "The copied alternate interior angles XPQ and PQB are shown congruent, and line n is now marked parallel to line m by the converse theorem."
          : proofStep === 1
            ? "A copied ray PX and its line n are drawn exactly on top of line l, but the equality n equals l is still marked as unproved."
            : "Parallel lines l and m are shown with alternate interior angles APQ and PQB as the named goal of the theorem.";

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
          <div className="theorem-measure alternate-interior-angles__measure--first alternate-interior-angles__measure--explore-first">
            <strong>∠{firstName}</strong>
            <span>{formatAngle(firstAngle)}</span>
          </div>
          <div className="theorem-measure alternate-interior-angles__measure--second alternate-interior-angles__measure--explore-second">
            <strong>∠{secondName}</strong>
            <span>{formatAngle(secondAngle)}</span>
          </div>
          <div className="theorem-measure alternate-interior-angles__measure--result">
            <strong>Difference</strong>
            <span>{formatDifference(angleDifference)}</span>
          </div>
        </>
      );
    }

    if (proofStep === 0) {
      return (
        <>
          <div className="theorem-measure alternate-interior-angles__measure--given">
            <strong>Given</strong>
            <span>ℓ ∥ m</span>
          </div>
          <div className="theorem-measure">
            <strong>Pair</strong>
            <span>Alternate interior</span>
          </div>
          <div className="theorem-measure">
            <strong>Goal</strong>
            <span>∠APQ ≅ ∠PQB</span>
          </div>
        </>
      );
    }

    if (proofStep === 1) {
      return (
        <>
          <div className="theorem-measure alternate-interior-angles__measure--derived">
            <strong>Construction</strong>
            <span>∠XPQ ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure">
            <strong>Half-plane</strong>
            <span>Choose the side of t containing A</span>
          </div>
          <div className="theorem-measure alternate-interior-angles__measure--note">
            <strong>Overlay note</strong>
            <span>n ?= ℓ is not yet proved</span>
          </div>
        </>
      );
    }

    if (proofStep === 2) {
      return (
        <>
          <div className="theorem-measure alternate-interior-angles__measure--derived">
            <strong>Copied pair</strong>
            <span>Alternate interior and congruent</span>
          </div>
          <div className="theorem-measure alternate-interior-angles__measure--result">
            <strong>Converse</strong>
            <span>n ∥ m</span>
          </div>
          <div className="theorem-measure">
            <strong>Chain</strong>
            <span>Copied congruence gives a new parallel line</span>
          </div>
        </>
      );
    }

    if (proofStep === 3) {
      return (
        <>
          <div className="theorem-measure alternate-interior-angles__measure--given">
            <strong>Original</strong>
            <span>ℓ ∥ m</span>
          </div>
          <div className="theorem-measure alternate-interior-angles__measure--derived">
            <strong>Derived</strong>
            <span>n ∥ m and P lies on n</span>
          </div>
          <div className="theorem-measure alternate-interior-angles__measure--result">
            <strong>Playfair</strong>
            <span>n = ℓ</span>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="theorem-measure alternate-interior-angles__measure--derived">
          <strong>Chosen side of t</strong>
          <span>ray PX is ray PA</span>
        </div>
        <div className="theorem-measure">
          <strong>Rename</strong>
          <span>∠XPQ = ∠APQ</span>
        </div>
        <div className="theorem-measure alternate-interior-angles__measure--result">
          <strong>Conclusion</strong>
          <span>∠APQ ≅ ∠PQB</span>
        </div>
      </>
    );
  };

  return (
    <div className="theorem-figure alternate-interior-angles">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg alternate-interior-angles__svg"
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
        <title id={titleId}>Alternate Interior Angles Theorem interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        <line className="alternate-interior-angles__line" {...lineLEndpoints} />
        <line className="alternate-interior-angles__line" {...lineMEndpoints} />
        <line
          className="alternate-interior-angles__line alternate-interior-angles__line--transversal"
          {...transversalEndpoints}
        />
        {showAuxiliaryLine ? (
          <line
            className={classNames(
              "alternate-interior-angles__auxiliary-line",
              showConclusion && "alternate-interior-angles__auxiliary-line--faded",
            )}
            {...auxiliaryLineEndpoints}
          />
        ) : null}

        {parallelMark(
          givenLineMarkCenter,
          lineAngle,
          "alternate-interior-angles__parallel-mark alternate-interior-angles__parallel-mark--given",
          "given-line-l",
        )}
        {parallelMark(
          givenParallelMarkCenter,
          lineAngle,
          "alternate-interior-angles__parallel-mark alternate-interior-angles__parallel-mark--given",
          "given-line-m",
        )}
        {showDerivedParallel
          ? [
              parallelMark(
                derivedLineMarkCenter,
                lineAngle,
                "alternate-interior-angles__parallel-mark alternate-interior-angles__parallel-mark--derived",
                "derived-line-n",
              ),
              parallelMark(
                derivedParallelMarkCenter,
                lineAngle,
                "alternate-interior-angles__parallel-mark alternate-interior-angles__parallel-mark--derived",
                "derived-line-m",
              ),
            ]
          : null}

        {showOriginalAngles ? (
          <>
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--first"
              d={firstAngleArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--first alternate-interior-angles__angle--double"
              d={firstAngleOuterArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--second"
              d={secondAngleArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--second alternate-interior-angles__angle--double"
              d={secondAngleOuterArc.path}
            />
          </>
        ) : null}
        {showCopiedAngles ? (
          <>
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--copied"
              d={firstAngleArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--copied alternate-interior-angles__angle--double"
              d={firstAngleOuterArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--copied alternate-interior-angles__angle--second-copy"
              d={secondAngleArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--copied alternate-interior-angles__angle--double alternate-interior-angles__angle--second-copy"
              d={secondAngleOuterArc.path}
            />
          </>
        ) : null}

        <circle className="alternate-interior-angles__point" cx={pointP.x} cy={pointP.y} r="4.5" />
        <circle
          className={classNames(
            "alternate-interior-angles__point",
            isExploring && "alternate-interior-angles__point--draggable",
          )}
          cx={pointQ.x}
          cy={pointQ.y}
          r="4.5"
        />
        {currentPairIndex === 0 ? (
          <>
            <circle className="alternate-interior-angles__point alternate-interior-angles__point--named" cx={pointA.x} cy={pointA.y} r="3.6" />
            <circle className="alternate-interior-angles__point alternate-interior-angles__point--named" cx={pointB.x} cy={pointB.y} r="3.6" />
          </>
        ) : (
          <>
            <circle className="alternate-interior-angles__point alternate-interior-angles__point--named" cx={pointE.x} cy={pointE.y} r="3.6" />
            <circle className="alternate-interior-angles__point alternate-interior-angles__point--named" cx={pointC.x} cy={pointC.y} r="3.6" />
          </>
        )}
        {showAuxiliaryLine && !showConclusion ? (
          <circle
            className="alternate-interior-angles__point alternate-interior-angles__point--auxiliary"
            cx={pointX.x}
            cy={pointX.y}
            r="3.6"
          />
        ) : null}
        {showPlayfair ? (
          <circle className="alternate-interior-angles__point-focus" cx={pointP.x} cy={pointP.y} r="11" />
        ) : null}

        <text className="alternate-interior-angles__point-label" x={pointP.x - 12} y={pointP.y - 8}>P</text>
        <text className="alternate-interior-angles__point-label" x={pointQ.x + 12} y={pointQ.y + 15}>Q</text>
        {currentPairIndex === 0 ? (
          <>
            <text className="alternate-interior-angles__point-label" x={pointA.x - 12} y={pointA.y - 8}>A</text>
            <text className="alternate-interior-angles__point-label" x={pointB.x + 10} y={pointB.y + 13}>B</text>
          </>
        ) : (
          <>
            <text className="alternate-interior-angles__point-label" x={pointE.x + 10} y={pointE.y - 8}>E</text>
            <text className="alternate-interior-angles__point-label" x={pointC.x + 10} y={pointC.y + 17}>C</text>
          </>
        )}
        {showAuxiliaryLine && !showConclusion ? (
          <text className="alternate-interior-angles__point-label alternate-interior-angles__point-label--auxiliary" x={pointX.x - 12} y={pointX.y + 17}>X</text>
        ) : null}

        <text className="alternate-interior-angles__line-label" x={lineLLabelPoint.x - 8} y={lineLLabelPoint.y + 12}>ℓ</text>
        <text className="alternate-interior-angles__line-label" x={lineMLabelPoint.x + 8} y={lineMLabelPoint.y - 10}>m</text>
        <text className="alternate-interior-angles__line-label" x={transversalLabelPoint.x} y={transversalLabelPoint.y}>t</text>
        {showAuxiliaryLine ? (
          <text
            className={classNames(
              "alternate-interior-angles__line-label",
              "alternate-interior-angles__line-label--auxiliary",
              showConclusion && "alternate-interior-angles__line-label--auxiliary-faded",
            )}
            x={auxiliaryLabelPoint.x}
            y={auxiliaryLabelPoint.y}
          >
            {showPlayfair ? "n = ℓ" : "n ?= ℓ"}
          </text>
        ) : null}
        {showPlayfair && !showConclusion ? (
          <text className="alternate-interior-angles__line-note" x={uniquenessLabelPoint.x} y={uniquenessLabelPoint.y}>
            P lies on both ℓ and n
          </text>
        ) : null}

        {showOriginalAngles ? (
          <>
            <text
              className="alternate-interior-angles__angle-label alternate-interior-angles__angle-label--first"
              x={firstAngleArc.label.x}
              y={firstAngleArc.label.y}
            >
              {firstName}
            </text>
            <text
              className="alternate-interior-angles__angle-label alternate-interior-angles__angle-label--second"
              x={secondAngleArc.label.x}
              y={secondAngleArc.label.y}
            >
              {secondName}
            </text>
          </>
        ) : null}
        {showCopiedAngles ? (
          <>
            <text
              className="alternate-interior-angles__angle-label alternate-interior-angles__angle-label--copied"
              x={firstAngleArc.label.x}
              y={firstAngleArc.label.y}
            >
              XPQ
            </text>
            <text
              className="alternate-interior-angles__angle-label alternate-interior-angles__angle-label--copied"
              x={secondAngleArc.label.x}
              y={secondAngleArc.label.y}
            >
              PQB
            </text>
          </>
        ) : null}

        {showConclusion ? (
          <text className="alternate-interior-angles__chain" x={160} y={204}>
            ray PX = ray PA; ∠XPQ = ∠APQ; therefore ∠APQ ≅ ∠PQB
          </text>
        ) : null}

        {isExploring ? (
          <>
            <circle
              aria-hidden="true"
              className={classNames(
                "alternate-interior-angles__handle",
                isDragging && "alternate-interior-angles__handle--active",
              )}
              cx={pointQ.x}
              cy={pointQ.y}
              r="8"
            />
            <circle
              className="alternate-interior-angles__handle-target"
              cx={pointQ.x}
              cy={pointQ.y}
              onPointerDown={beginDrag}
              r={handleRadius}
            />
          </>
        ) : null}
      </svg>

      <div className="alternate-interior-angles__summary">{renderSummary()}</div>

      {isExploring ? (
        <div className="alternate-interior-angles__controls">
          <button
            aria-label="Show the other alternate interior angle pair"
            className="alternate-interior-angles__pair-action"
            onClick={() =>
              setPairIndex((current) => (current === 0 ? 1 : 0))
            }
            type="button"
          >
            Show another pair
          </button>
          <div className="alternate-interior-angles__control">
            <span>
              <label htmlFor={moveQControlId}>
                <strong>Move Q along line m</strong>
              </label>
            </span>
            <input
              aria-valuetext={`Q is ${currentQOffset} units along line m. Angle ${firstName} is ${formatAngle(firstAngle)} and angle ${secondName} is ${formatAngle(secondAngle)}.`}
              id={moveQControlId}
              max={maximumQOffset}
              min={minimumQOffset}
              onChange={(event) => setQOffset(Number(event.target.value))}
              type="range"
              value={currentQOffset}
            />
          </div>
        </div>
      ) : null}

      <p
        className={classNames(
          "alternate-interior-angles__status",
          (isExploring || showConclusion) && "alternate-interior-angles__status--result",
        )}
        role="status"
      >
        {currentStep.status}
      </p>
    </div>
  );
}
