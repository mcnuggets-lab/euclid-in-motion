import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/alternate-interior-converse.css";

import {
  angleFrom,
  classNames,
  clamp,
  getSvgCoordinates,
  lineEndpointsFromPoints,
  midpoint,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type AlternateInteriorConverseIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ConverseStep = TheoremDiscovery & {
  focus: "hypothesis" | "intersection" | "first-case" | "second-case" | "conclusion";
};

type ArcData = {
  label: Point;
  path: string;
};

type FigureGeometry = {
  a: Point;
  b: Point;
  intersection: Point | null;
  lineLDirection: Point;
  lineMDirection: Point;
};

const pointP = { x: 160, y: 65 };
const pointQ = { x: 160, y: 155 };
const lineLAngle = 17;
const minimumLineMAngle = -35;
const maximumLineMAngle = 75;
const initialLineMAngle = 8;
const linePointDistance = 47;
const handleRadius = 22;
const frameInset = 13;
const firstCaseIntersection = { x: 285, y: 120 };

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

function directionBetween(first: Point, second: Point): Point {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function reflectPoint(point: Point): Point {
  return { x: svgWidth - point.x, y: point.y };
}

function cross(first: Point, second: Point) {
  return first.x * second.y - first.y * second.x;
}

function lineIntersection(
  firstPoint: Point,
  firstDirection: Point,
  secondPoint: Point,
  secondDirection: Point,
) {
  const denominator = cross(firstDirection, secondDirection);
  if (Math.abs(denominator) < 1e-10) {
    return null;
  }

  const difference = {
    x: secondPoint.x - firstPoint.x,
    y: secondPoint.y - firstPoint.y,
  };
  const firstScale = cross(difference, secondDirection) / denominator;
  return move(firstPoint, firstDirection, firstScale);
}

function rotatingLineGeometry(lineMAngle: number): FigureGeometry {
  const lineLDirection = direction(lineLAngle);
  const lineMDirection = direction(lineMAngle);
  return {
    a: move(pointP, lineLDirection, -linePointDistance),
    b: move(pointQ, lineMDirection, linePointDistance),
    intersection: lineIntersection(
      pointP,
      lineLDirection,
      pointQ,
      lineMDirection,
    ),
    lineLDirection,
    lineMDirection,
  };
}

function intersectingCaseGeometry(
  intersection: Point,
  side: "A" | "B",
): FigureGeometry {
  const lineLDirection = directionBetween(pointP, intersection);
  const lineMDirection = directionBetween(pointQ, intersection);
  return {
    a: move(
      pointP,
      lineLDirection,
      side === "B" ? -linePointDistance : linePointDistance,
    ),
    b: move(
      pointQ,
      lineMDirection,
      side === "B" ? linePointDistance : -linePointDistance,
    ),
    intersection,
    lineLDirection,
    lineMDirection,
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
  return radiansToDegrees(difference);
}

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function signedDegreeLabel(value: number) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

function isInsideFrame(point: Point) {
  return (
    point.x >= frameInset &&
    point.x <= svgWidth - frameInset &&
    point.y >= frameInset &&
    point.y <= svgHeight - frameInset
  );
}

function edgePoint(target: Point) {
  const center = midpoint(pointP, pointQ);
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const candidates = [
    dx > 0 ? (svgWidth - frameInset - center.x) / dx : undefined,
    dx < 0 ? (frameInset - center.x) / dx : undefined,
    dy > 0 ? (svgHeight - frameInset - center.y) / dy : undefined,
    dy < 0 ? (frameInset - center.y) / dy : undefined,
  ].filter((value): value is number => value !== undefined && value > 0);
  const scale = Math.min(...candidates);

  return {
    point: { x: center.x + dx * scale, y: center.y + dy * scale },
    rotation: radiansToDegrees(Math.atan2(dy, dx)),
  };
}

function offscreenDirection(point: Point) {
  const horizontalDistance = Math.abs(point.x - svgWidth / 2) / svgWidth;
  const verticalDistance = Math.abs(point.y - svgHeight / 2) / svgHeight;
  if (horizontalDistance >= verticalDistance) {
    return point.x < 0 ? "left" : "right";
  }
  return point.y < 0 ? "above" : "below";
}

function parallelMark(center: Point, angle: number, key: string) {
  const vector = direction(angle);
  const normal = { x: -vector.y, y: vector.x };
  const start = move(move(center, vector, -7), normal, 5);
  const end = move(move(center, vector, -7), normal, -5);

  return (
    <path
      className="alternate-converse__parallel-mark"
      d={`M ${start.x} ${start.y} L ${center.x} ${center.y} L ${end.x} ${end.y}`}
      key={key}
    />
  );
}

export function AlternateInteriorConverseIllustration({
  activeStep,
  onDiscoveryChange,
}: AlternateInteriorConverseIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const rotationControlId = useId();
  const [lineMAngle, setLineMAngle] = useState(initialLineMAngle);
  const [isDragging, setIsDragging] = useState(false);
  const [reflected, setReflected] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const secondCaseIntersection = reflectPoint(firstCaseIntersection);
  const geometry = isExploring
    ? rotatingLineGeometry(lineMAngle)
    : proofStep === 1 || proofStep === 2
      ? intersectingCaseGeometry(firstCaseIntersection, "B")
      : proofStep === 3
        ? intersectingCaseGeometry(secondCaseIntersection, "A")
        : rotatingLineGeometry(lineLAngle);
  const isParallel = geometry.intersection === null;
  const shouldReflect = isExploring && reflected;
  const display = (point: Point) => (shouldReflect ? reflectPoint(point) : point);
  const displayP = display(pointP);
  const displayQ = display(pointQ);
  const pointA = display(geometry.a);
  const pointB = display(geometry.b);
  const pointR = geometry.intersection ? display(geometry.intersection) : null;
  const lineLEndpoints = lineEndpointsFromPoints(displayP, pointA);
  const lineMEndpoints = lineEndpointsFromPoints(displayQ, pointB);
  const transversalEndpoints = lineEndpointsFromPoints(displayP, displayQ);
  const firstAngleSize = angleSize(displayP, pointA, displayQ);
  const secondAngleSize = angleSize(displayQ, displayP, pointB);
  const angleDifference = firstAngleSize - secondAngleSize;
  const firstAngleArc = minorArc(displayP, pointA, displayQ, 21, 35);
  const firstAngleOuterArc = minorArc(displayP, pointA, displayQ, 26, 40);
  const secondAngleArc = minorArc(displayQ, displayP, pointB, 21, 35);
  const secondAngleOuterArc = minorArc(displayQ, displayP, pointB, 26, 40);
  const belowQ = display({ x: pointQ.x, y: pointQ.y + 65 });
  const secondVerticalArc = pointR
    ? minorArc(displayQ, belowQ, pointR, 26, 40)
    : null;
  const intersectionIsVisible = pointR ? isInsideFrame(pointR) : false;
  const intersectionEdge = pointR && !intersectionIsVisible ? edgePoint(pointR) : null;
  const intersectionSide = geometry.intersection
    ? geometry.intersection.x < pointP.x
      ? "A side"
      : "B side"
    : null;
  const showGivenMarks = isParallel;
  const showTriangle = !isExploring && proofStep >= 1 && proofStep <= 3 && pointR;
  const showFirstContradiction = !isExploring && proofStep === 2;
  const showSecondContradiction = !isExploring && proofStep === 3;
  const showConclusion = !isExploring && proofStep === 4;

  const proofSteps: ConverseStep[] = [
    {
      focus: "hypothesis",
      insight: "The double arcs record the given congruence ∠APQ ≅ ∠PQB. The pair is alternate interior because its angles lie at different intersections and on opposite sides of transversal t.",
      prompt: "Congruence is the hypothesis. The proof must show that an intersection of ℓ and m is impossible.",
      title: "Name the congruent alternate angles",
    },
    {
      focus: "intersection",
      insight: "Assume for contradiction that ℓ and m meet at R. Points P, Q, and R form a triangle, and Plane Separation puts R on exactly one side of t.",
      prompt: "The equality remains an assumption in the card below; the intersecting arcs are not marked congruent in the schematic.",
      title: "Assume the lines meet",
    },
    {
      focus: "first-case",
      insight: "On the B side, ∠APQ is an exterior angle of △PQR and ∠PQB is remote interior. Exterior-angle inequality gives ∠APQ > ∠PQB, contradicting the given congruence.",
      prompt: "The strict comparison comes from the earlier theorem, not from the displayed degree values.",
      title: "Rule out an intersection on the B side",
    },
    {
      focus: "second-case",
      insight: "On the A side, the magenta exterior angle is vertical to ∠PQB and therefore congruent to it. It cannot also be congruent to remote interior ∠APQ, because exterior-angle inequality makes it strictly larger.",
      prompt: "The reflected case uses Vertical Angles before applying the same exterior-angle contradiction.",
      title: "Rule out an intersection on the A side",
    },
    {
      focus: "conclusion",
      insight: "Both possible locations of R lead to contradictions. Thus ℓ and m have no common point; as distinct coplanar lines, they are parallel by definition.",
      prompt: "The parallel arrows record the conclusion after both intersection cases have been excluded.",
      title: "Conclude that the lines are parallel",
    },
  ];
  const explorationStep: ConverseStep = {
    focus: "intersection",
    insight: isParallel
      ? `Both alternate interior angles are ${degreeLabel(firstAngleSize)}. The exact match gives the parallel state with no intersection.`
      : `∠APQ is ${degreeLabel(firstAngleSize)} and ∠PQB is ${degreeLabel(secondAngleSize)}. The lines meet on the ${intersectionSide?.toLowerCase()}.`,
    prompt: "Rotate line m. The motion illustrates the result; the guided contradiction proves why every finite intersection is impossible.",
    title: "Follow the intersection",
  };
  const currentStep = isExploring
    ? explorationStep
    : (proofSteps[proofStep] ?? proofSteps[0]);

  const figureDescription = isExploring
    ? isParallel
      ? `Transversal t crosses parallel lines l and m at P and Q. Alternate interior angles APQ and PQB are both ${degreeLabel(firstAngleSize)}.`
      : `Transversal t crosses lines l and m at P and Q. Angles APQ and PQB are ${degreeLabel(firstAngleSize)} and ${degreeLabel(secondAngleSize)}. The lines meet on the ${intersectionSide?.toLowerCase()}${pointR && !intersectionIsVisible ? ` ${offscreenDirection(pointR)} of the frame` : ""}.`
    : showConclusion
      ? "Both possible intersections have been excluded, so lines l and m are marked parallel."
      : showSecondContradiction
        ? "The intersection R is on the A side. An exterior angle at Q is vertical to angle PQB and larger than remote interior angle APQ."
        : showFirstContradiction
          ? "The intersection R is on the B side. Exterior angle APQ is larger than remote interior angle PQB."
          : proofStep === 1
            ? "Lines l and m are assumed to meet at R, forming triangle PQR."
            : "The alternate interior angles APQ and PQB are marked congruent as the hypothesis.";

  const status = isExploring
    ? isParallel
      ? "Exact match: the alternate interior angles are congruent and the lines have no intersection."
      : pointR && intersectionIsVisible
        ? `The lines meet at R on the ${intersectionSide?.toLowerCase()}.`
        : `The lines meet on the ${intersectionSide?.toLowerCase()}, ${pointR ? offscreenDirection(pointR) : "outside"} of the frame.`
    : showConclusion
      ? "Conclusion: ℓ and m have no common point, so ℓ ∥ m."
      : showSecondContradiction
        ? "Contradiction: the exterior is congruent to ∠APQ by the hypothesis, but exterior-angle inequality makes it larger."
        : showFirstContradiction
          ? "Contradiction: the hypothesis says the angles are congruent, but exterior-angle inequality makes ∠APQ larger."
          : proofStep === 1
            ? "Assumption for contradiction: ℓ and m meet at R."
            : "Given: ∠APQ ≅ ∠PQB.";

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  const beginDrag = (event: PointerEvent<SVGCircleElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const updateLineAngle = (pointer: Point) => {
    const canonicalPointer = reflected ? reflectPoint(pointer) : pointer;
    let nextAngle = radiansToDegrees(angleFrom(pointQ, canonicalPointer));
    while (nextAngle > 90) {
      nextAngle -= 180;
    }
    while (nextAngle < -90) {
      nextAngle += 180;
    }
    setLineMAngle(
      Math.round(clamp(nextAngle, minimumLineMAngle, maximumLineMAngle)),
    );
  };

  const renderSummary = () => {
    if (isExploring) {
      return (
        <>
          <div className="theorem-measure alternate-converse__measure--first">
            <strong>∠APQ</strong>
            <span>{degreeLabel(firstAngleSize)}</span>
          </div>
          <div className="theorem-measure alternate-converse__measure--second">
            <strong>∠PQB</strong>
            <span>{degreeLabel(secondAngleSize)}</span>
          </div>
          <div className={classNames("theorem-measure", isParallel && "alternate-converse__measure--result")}>
            <strong>Signed difference</strong>
            <span>∠APQ − ∠PQB = {signedDegreeLabel(angleDifference)}</span>
          </div>
        </>
      );
    }

    if (proofStep === 0) {
      return (
        <>
          <div className="theorem-measure alternate-converse__measure--given">
            <strong>Given</strong>
            <span>∠APQ ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure">
            <strong>Position</strong>
            <span>Alternate interior</span>
          </div>
          <div className="theorem-measure">
            <strong>Goal</strong>
            <span>Show ℓ and m cannot meet</span>
          </div>
        </>
      );
    }

    if (proofStep === 1) {
      return (
        <>
          <div className="theorem-measure alternate-converse__measure--given">
            <strong>Hypothesis</strong>
            <span>∠APQ ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure alternate-converse__measure--assumption">
            <strong>Assume</strong>
            <span>ℓ and m meet at R</span>
          </div>
          <div className="theorem-measure">
            <strong>Order</strong>
            <span>R lies on one side of t</span>
          </div>
        </>
      );
    }

    if (showFirstContradiction) {
      return (
        <>
          <div className="theorem-measure alternate-converse__measure--given">
            <strong>Given</strong>
            <span>∠APQ ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure alternate-converse__measure--first">
            <strong>Derived</strong>
            <span>∠APQ &gt; ∠PQB</span>
          </div>
          <div className="theorem-measure">
            <strong>Why</strong>
            <span>Exterior angle &gt; remote interior angle</span>
          </div>
        </>
      );
    }

    if (showSecondContradiction) {
      return (
        <>
          <div className="theorem-measure alternate-converse__measure--given">
            <strong>Given</strong>
            <span>∠APQ ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure alternate-converse__measure--vertical">
            <strong>Vertical transfer</strong>
            <span>Exterior at Q ≅ ∠PQB</span>
          </div>
          <div className="theorem-measure alternate-converse__measure--first">
            <strong>Derived</strong>
            <span>Exterior at Q &gt; ∠APQ</span>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="theorem-measure alternate-converse__measure--result">
          <strong>Meeting on B side</strong>
          <span>Impossible</span>
        </div>
        <div className="theorem-measure alternate-converse__measure--result">
          <strong>Meeting on A side</strong>
          <span>Impossible</span>
        </div>
        <div className="theorem-measure alternate-converse__measure--result">
          <strong>Definition</strong>
          <span>No common point · ℓ ∥ m</span>
        </div>
      </>
    );
  };

  const lineLDisplayAngle = radiansToDegrees(
    angleFrom(displayP, display(move(pointP, geometry.lineLDirection, 1))),
  );
  const lineMDisplayAngle = radiansToDegrees(
    angleFrom(displayQ, display(move(pointQ, geometry.lineMDirection, 1))),
  );
  const lineLMarkCenter = move(displayP, direction(lineLDisplayAngle), 42);
  const lineMMarkCenter = move(displayQ, direction(lineMDisplayAngle), 42);

  return (
    <div className="theorem-figure alternate-converse">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg alternate-converse__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (isExploring && isDragging) {
            updateLineAngle(getSvgCoordinates(event.currentTarget, event));
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Converse of the Alternate Interior Angles Theorem interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        {showTriangle && pointR ? (
          <path
            className="alternate-converse__triangle"
            d={`M ${displayP.x} ${displayP.y} L ${displayQ.x} ${displayQ.y} L ${pointR.x} ${pointR.y} Z`}
          />
        ) : null}

        <line className="alternate-converse__line" {...lineLEndpoints} />
        <line className="alternate-converse__line" {...lineMEndpoints} />
        <line
          className="alternate-converse__line alternate-converse__line--transversal"
          {...transversalEndpoints}
        />

        {isParallel ? (
          <>
            {parallelMark(lineLMarkCenter, lineLDisplayAngle, "line-l")}
            {parallelMark(lineMMarkCenter, lineMDisplayAngle, "line-m")}
          </>
        ) : null}

        <path
          className="alternate-converse__angle alternate-converse__angle--first"
          d={firstAngleArc.path}
        />
        <path
          className="alternate-converse__angle alternate-converse__angle--second"
          d={secondAngleArc.path}
        />
        {showGivenMarks ? (
          <>
            <path
              className="alternate-converse__angle alternate-converse__angle--first"
              d={firstAngleOuterArc.path}
            />
            <path
              className="alternate-converse__angle alternate-converse__angle--second"
              d={secondAngleOuterArc.path}
            />
          </>
        ) : null}
        {showSecondContradiction && secondVerticalArc ? (
          <path
            className="alternate-converse__angle alternate-converse__angle--vertical"
            d={secondVerticalArc.path}
          />
        ) : null}

        {isExploring ? (
          <>
            <text
              className="alternate-converse__angle-label alternate-converse__angle-label--first"
              x={firstAngleArc.label.x}
              y={firstAngleArc.label.y}
            >
              {degreeLabel(firstAngleSize)}
            </text>
            <text
              className="alternate-converse__angle-label alternate-converse__angle-label--second"
              x={secondAngleArc.label.x}
              y={secondAngleArc.label.y}
            >
              {degreeLabel(secondAngleSize)}
            </text>
          </>
        ) : null}

        {pointR && intersectionIsVisible ? (
          <>
            <circle className="alternate-converse__point alternate-converse__point--intersection" cx={pointR.x} cy={pointR.y} r="4.5" />
            <text className="alternate-converse__point-label alternate-converse__point-label--intersection" x={pointR.x + (shouldReflect ? -10 : 10)} y={pointR.y - 9}>R</text>
          </>
        ) : null}
        {isExploring && intersectionEdge ? (
          <g
            className="alternate-converse__edge-marker"
            transform={`translate(${intersectionEdge.point.x} ${intersectionEdge.point.y}) rotate(${intersectionEdge.rotation})`}
          >
            <path d="M -10 -6 L 0 0 L -10 6" />
            <text transform={`rotate(${-intersectionEdge.rotation})`} x="-3" y="-9">R</text>
          </g>
        ) : null}

        <circle className="alternate-converse__point" cx={displayP.x} cy={displayP.y} r="4.5" />
        <circle className="alternate-converse__point" cx={displayQ.x} cy={displayQ.y} r="4.5" />
        <circle className="alternate-converse__point alternate-converse__point--named" cx={pointA.x} cy={pointA.y} r="3.6" />
        <circle className="alternate-converse__point alternate-converse__point--named" cx={pointB.x} cy={pointB.y} r="3.6" />

        <text className="alternate-converse__point-label" x={displayP.x + (shouldReflect ? 11 : -11)} y={displayP.y - 8}>P</text>
        <text className="alternate-converse__point-label" x={displayQ.x + (shouldReflect ? -11 : 11)} y={displayQ.y + 15}>Q</text>
        <text className="alternate-converse__point-label" x={pointA.x + (shouldReflect ? 10 : -10)} y={pointA.y - 7}>A</text>
        <text className="alternate-converse__point-label" x={pointB.x + (shouldReflect ? -10 : 10)} y={pointB.y + 13}>B</text>
        <text className="alternate-converse__line-label" x={pointA.x + (shouldReflect ? 17 : -17)} y={pointA.y + 12}>ℓ</text>
        <text className="alternate-converse__line-label" x={pointB.x + (shouldReflect ? -17 : 17)} y={pointB.y - 10}>m</text>
        <text className="alternate-converse__line-label" x={displayP.x + 10} y="18">t</text>

        {isExploring ? (
          <>
            <circle
              aria-hidden="true"
              className={classNames(
                "alternate-converse__handle",
                isDragging && "alternate-converse__handle--active",
              )}
              cx={pointB.x}
              cy={pointB.y}
              r="7"
            />
            <circle
              className="alternate-converse__handle-target"
              cx={pointB.x}
              cy={pointB.y}
              onPointerDown={beginDrag}
              r={handleRadius}
            />
          </>
        ) : null}
      </svg>

      <div className="alternate-converse__summary">{renderSummary()}</div>

      {isExploring ? (
        <div className="alternate-converse__controls">
          <label className="alternate-converse__control" htmlFor={rotationControlId}>
            <span>
              <strong>Rotate line m</strong>
              <span>∠PQB = {degreeLabel(secondAngleSize)}</span>
            </span>
            <input
              aria-valuetext={`Angle PQB is ${degreeLabel(secondAngleSize)}`}
              id={rotationControlId}
              max={maximumLineMAngle}
              min={minimumLineMAngle}
              onChange={(event) => setLineMAngle(Number(event.target.value))}
              type="range"
              value={lineMAngle}
            />
          </label>
          <div className="alternate-converse__actions">
            <button
              className="alternate-converse__action"
              onClick={() => setLineMAngle(lineLAngle)}
              type="button"
            >
              Match the alternate angle
            </button>
            <button
              className="alternate-converse__action"
              onClick={() => setReflected((current) => !current)}
              type="button"
            >
              Reflect arrangement
            </button>
          </div>
        </div>
      ) : null}

      <p
        className={classNames(
          "alternate-converse__status",
          (isParallel || showConclusion) && "alternate-converse__status--result",
          (showFirstContradiction || showSecondContradiction) && "alternate-converse__status--contradiction",
        )}
        role="status"
      >
        {status}
      </p>
    </div>
  );
}
