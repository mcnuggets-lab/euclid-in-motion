import { useEffect, useId, useState } from "react";
import "./styles/alternate-interior-angles.css";

import {
  DraggablePoint,
  ParallelMarker,
  RayLine,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import {
  angleFrom,
  classNames,
  clamp,
  formatDisplayNumber,
  polarPointRadians as polarPoint,
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
    pointQ,
    secondAngle,
    secondName,
    secondPoints,
  } = measureAlternateInteriorPair(currentQOffset, currentPairIndex);
  const angleDifference = Math.abs(firstAngle - secondAngle);
  const anglesMatch = angleDifference <= measurementTolerance;

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
      <SvgCanvas
        className="alternate-interior-angles__svg"
        description={figureDescription}
        descriptionId={descriptionId}
        title="Alternate Interior Angles Theorem interactive figure"
        titleId={titleId}
      >
        <RayLine origin={pointP} through={pointA} type="line" />
        <RayLine origin={pointQ} through={pointB} type="line" />
        <RayLine origin={pointP} through={pointQ} strokeWidth={2} type="line" />

        {showAuxiliaryLine ? (
          <RayLine
            className={classNames(
              "alternate-interior-angles__auxiliary-line",
              showConclusion && "alternate-interior-angles__auxiliary-line--faded",
            )}
            origin={pointP}
            through={pointX}
            type="line"
          />
        ) : null}

        <ParallelMarker count={2} point={givenLineMarkCenter} />
        <ParallelMarker count={2} point={givenParallelMarkCenter} />

        {showDerivedParallel ? (
          <>
            <ParallelMarker count={2} point={derivedLineMarkCenter} />
            <ParallelMarker count={2} point={derivedParallelMarkCenter} />
          </>
        ) : null}

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
              className="alternate-interior-angles__angle alternate-interior-angles__angle--second"
              d={secondAngleArc.path}
            />
            <path
              className="alternate-interior-angles__angle alternate-interior-angles__angle--second alternate-interior-angles__angle--double"
              d={secondAngleOuterArc.path}
            />
          </>
        ) : null}

        <StaticPoint label="P" labelOffset={{ x: -10, y: -10 }} point={pointP} />
        <DraggablePoint
          ariaLabel="Transversal point Q"
          disabled={!isExploring}
          label="Q"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(pointer) => {
            const fromBase = {
              x: pointer.x - basePointQ.x,
              y: pointer.y - basePointQ.y,
            };
            const projectedOffset = dot(fromBase, lineDirection);
            setQOffset(Math.round(clamp(projectedOffset, minimumQOffset, maximumQOffset)));
          }}
          point={pointQ}
          tone="accent"
        />

        <text className="alternate-interior-angles__line-label" x={lineLLabelPoint.x} y={lineLLabelPoint.y}>
          ℓ
        </text>
        <text className="alternate-interior-angles__line-label" x={lineMLabelPoint.x} y={lineMLabelPoint.y}>
          m
        </text>
        <text className="alternate-interior-angles__line-label" x={transversalLabelPoint.x} y={transversalLabelPoint.y}>
          t
        </text>

        {showAuxiliaryLine ? (
          <text
            className={classNames(
              "alternate-interior-angles__line-label alternate-interior-angles__line-label--auxiliary",
              showConclusion && "alternate-interior-angles__line-label--faded",
            )}
            x={auxiliaryLabelPoint.x}
            y={auxiliaryLabelPoint.y}
          >
            n
          </text>
        ) : null}

        {showPlayfair ? (
          <text className="alternate-interior-angles__uniqueness-label" x={uniquenessLabelPoint.x} y={uniquenessLabelPoint.y}>
            n = ℓ by Playfair
          </text>
        ) : null}
      </SvgCanvas>

      <div className="alternate-interior-angles__summary theorem-figure__summary">
        {renderSummary()}
      </div>

      {isExploring ? (
        <div className="alternate-interior-angles__pair-selector">
          <strong>Select alternate interior pair:</strong>
          <div className="alternate-interior-angles__pair-buttons">
            <button
              className={classNames(
                "alternate-interior-angles__pair-button",
                pairIndex === 0 && "alternate-interior-angles__pair-button--active",
              )}
              onClick={() => setPairIndex(0)}
              type="button"
            >
              Pair 1: ∠APQ and ∠PQB
            </button>
            <button
              className={classNames(
                "alternate-interior-angles__pair-button",
                pairIndex === 1 && "alternate-interior-angles__pair-button--active",
              )}
              onClick={() => setPairIndex(1)}
              type="button"
            >
              Pair 2: ∠QPE and ∠CQP
            </button>
          </div>
        </div>
      ) : null}

      <div className="alternate-interior-angles__controls">
        <strong>Move transversal intersection Q along line m</strong>
        <label htmlFor={moveQControlId}>
          <span>
            <span>Shift Q along line m</span>
            <span>Offset: {currentQOffset}px</span>
          </span>
          <input
            disabled={!isExploring}
            id={moveQControlId}
            max={maximumQOffset}
            min={minimumQOffset}
            onChange={(event) => setQOffset(Number(event.target.value))}
            type="range"
            value={currentQOffset}
          />
        </label>
      </div>

      <p className="theorem-figure__status">{currentStep.status}</p>
    </div>
  );
}
