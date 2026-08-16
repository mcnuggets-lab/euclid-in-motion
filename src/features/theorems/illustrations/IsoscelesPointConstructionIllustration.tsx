import { useEffect, useId, useState } from "react";
import "./styles/isosceles-point-construction.css";

import {
  circleIntersections,
  classNames,
  clamp,
  getSvgCoordinates,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { SvgCanvas, StaticPoint, DraggablePoint } from "@/features/geometry/components";
import type { TheoremDiscovery } from "@/features/theorems/discovery";


type IsoscelesPointConstructionIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type Focus = "copy" | "circles" | "witnesses" | "continuity" | "result";

type ConstructionStep = TheoremDiscovery & {
  focus: Focus;
};

const constructionPointA = { x: 128, y: 110 };
const minimumBaseLength = 26;
const maximumBaseLength = 52;
const initialBaseLength = 44;
const handleRadius = 22;
const resultViewScale = 1.45;

function tickEndpoints(first: Point, second: Point, size = 6) {
  const center = {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
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

export function IsoscelesPointConstructionIllustration({
  activeStep,
  onDiscoveryChange,
}: IsoscelesPointConstructionIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [baseLength, setBaseLength] = useState(initialBaseLength);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const showResult = isExploring || proofStep === 4;
  const displayScale = isExploring ? resultViewScale : 1;
  const displayBaseLength = baseLength * displayScale;
  const pointA = isExploring
    ? { x: svgWidth / 2 - displayBaseLength / 2, y: 178 }
    : constructionPointA;
  const pointB = { x: pointA.x + displayBaseLength, y: pointA.y };
  const pointC = { x: pointB.x + displayBaseLength, y: pointA.y };
  const radius = baseLength * 2;
  const displayRadius = displayBaseLength * 2;
  const pointD = { x: pointA.x - displayRadius, y: pointA.y };
  const intersections = circleIntersections(
    pointA,
    displayRadius,
    pointB,
    displayRadius,
  );
  const pointQ = intersections[0] ?? pointA;
  const pointP = intersections[1] ?? pointA;
  const baseTick = tickEndpoints(pointA, pointB);
  const copyTick = tickEndpoints(pointB, pointC);
  const leftRadiusTick = tickEndpoints(pointA, pointP);
  const rightRadiusTick = tickEndpoints(pointB, pointP);

  const proofSteps: ConstructionStep[] = [
    {
      focus: "copy",
      insight: `Copy AB once beyond B. AB and BC are both ${baseLength} units long, so AC is made of two copies of AB.`,
      prompt: "The doubled length AC will be the common radius. This step uses segment copy and segment addition, not a measurement shortcut.",
      title: "Copy the base segment once",
    },
    {
      focus: "circles",
      insight: `The blue circle centered at A and orange circle centered at B both have radius AC: ${radius} units, or two copies of AB.`,
      prompt: "Both circles use the same radius. Their intersections are not assumed; the next steps establish the continuity conditions that guarantee them.",
      title: "Draw two circles with that radius",
    },
    {
      focus: "witnesses",
      insight: "C lies on the blue circle and inside the orange one: BC is one copy of AB while AC is two. D lies on the blue circle and outside the orange one: BD is three copies of AB.",
      prompt: "Continuity needs witnesses on one circle that lie on opposite sides of the other circle's boundary. C and D provide them explicitly.",
      title: "Give continuity an inside and an outside witness",
    },
    {
      focus: "continuity",
      insight: "Because the blue circle contains C inside the orange circle and D outside it, circle-circle continuity guarantees the distinct intersections P and Q.",
      prompt: "The intersection points now follow from the continuity axiom; they are not supplied by the drawing alone.",
      title: "Apply circle-circle continuity",
    },
    {
      focus: "result",
      insight: `AP and BP are both ${radius} units long, so AP ≅ BP. Point P is off line AB, making triangle APB isosceles.`,
      prompt: "The equal radii establish the two congruent legs. The construction's two circle intersections also lie away from the base line.",
      title: "Read an isosceles point from an intersection",
    },
  ];
  const explorationStep: ConstructionStep = {
    focus: "result",
    insight: `P stays equally distant from A and B: AP and BP are both ${radius} units long. Drag B or change the base length to keep tracking that invariant.`,
    prompt: "Follow the two equal legs as the base changes. The guided proof explains how circles guarantee that this off-line point exists.",
    title: "Explore the construction",
  };
  const currentStep = isExploring ? explorationStep : proofSteps[proofStep];
  const showCopy = !isExploring && proofStep < 4;
  const showCircles = !isExploring && proofStep >= 1 && proofStep < 4;
  const showWitnesses = !isExploring && proofStep >= 2 && proofStep < 4;
  const showIntersections = !isExploring && proofStep === 3;
  const figureDescription = showResult
    ? `Segment AB has length ${baseLength} units. Point P is off line AB, and AP and BP are both ${radius} units long.`
    : showIntersections
      ? `The blue and orange circles have two distinct intersections P and Q, supplied by circle-circle continuity.`
      : showWitnesses
        ? "Point C lies on the blue circle and inside the orange circle. Point D lies on the blue circle and outside the orange circle."
        : showCircles
          ? "The blue circle centered at A and orange circle centered at B have the same radius AC."
          : "Segment AB is copied once from B to C, making AC two copies of AB.";
  const status = showResult
    ? `P is an isosceles point: AP ≅ BP, and P is off line AB.`
    : showIntersections
      ? "The two intersections are guaranteed by the inside and outside witnesses."
      : showWitnesses
        ? "C is inside the orange circle; D is outside it. Both are on the blue circle."
        : showCircles
          ? "Both circles use AC, the segment made of two copies of AB, as their radius."
          : "AB has been copied to BC, creating the doubled segment AC.";

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  return (
    <div className="theorem-figure isosceles-point-construction">
      <SvgCanvas
        descriptionId={descriptionId}
        description={figureDescription}
        titleId={titleId}
        title={isExploring ? "Isosceles point construction interactive figure" : `Isosceles point construction: ${currentStep.title}`}
        className="isosceles-point-construction__svg"
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
          const nextBaseLength = isExploring
            ? ((point.x - svgWidth / 2) * 2) / displayScale
            : (point.x - pointA.x) / displayScale;
          setBaseLength(
            Math.round(
              clamp(nextBaseLength, minimumBaseLength, maximumBaseLength),
            ),
          );
        }}
        onPointerUp={() => setIsDragging(false)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {showCircles ? (
          <>
            <circle className="isosceles-point-construction__circle isosceles-point-construction__circle--a" cx={pointA.x} cy={pointA.y} r={displayRadius} />
            <circle className="isosceles-point-construction__circle isosceles-point-construction__circle--b" cx={pointB.x} cy={pointB.y} r={displayRadius} />
          </>
        ) : null}

        <line
          className="isosceles-point-construction__line"
          x1={pointA.x}
          x2={pointB.x}
          y1={pointA.y}
          y2={pointB.y}
        />
        {showCopy ? (
          <line
            className={classNames(
              "isosceles-point-construction__extension",
              "isosceles-point-construction__extension--right",
            )}
            x1={pointB.x}
            x2={pointC.x}
            y1={pointB.y}
            y2={pointC.y}
          />
        ) : null}
        {showWitnesses ? (
          <line
            className="isosceles-point-construction__extension"
            x1={pointD.x}
            x2={pointA.x}
            y1={pointD.y}
            y2={pointA.y}
          />
        ) : null}

        {showResult ? (
          <>
            <line className="isosceles-point-construction__radius" x1={pointA.x} x2={pointP.x} y1={pointA.y} y2={pointP.y} />
            <line className="isosceles-point-construction__radius" x1={pointB.x} x2={pointP.x} y1={pointB.y} y2={pointP.y} />
            <line className="isosceles-point-construction__tick" {...leftRadiusTick} />
            <line className="isosceles-point-construction__tick" {...rightRadiusTick} />
          </>
        ) : null}

        {showCopy ? (
          <>
            <line className="isosceles-point-construction__tick" {...baseTick} />
            <line className="isosceles-point-construction__tick" {...copyTick} />
          </>
        ) : null}

        {showResult ? (
          <StaticPoint
            className="isosceles-point-construction__intersection isosceles-point-construction__intersection--chosen"
            point={pointP}
            label="P"
            labelOffset={{ x: 11, y: 15 }}
            radius={5}
          />
        ) : showIntersections ? (
          <>
            <StaticPoint
              className="isosceles-point-construction__intersection isosceles-point-construction__intersection--chosen"
              point={pointP}
              label="P"
              labelOffset={{ x: 11, y: 15 }}
              radius={5}
            />
            <StaticPoint
              className="isosceles-point-construction__intersection"
              point={pointQ}
              label="Q"
              labelOffset={{ x: 11, y: -10 }}
              radius={4.5}
            />
          </>
        ) : null}

        <StaticPoint className="isosceles-point-construction__point" point={pointA} label="A" labelOffset={{ x: 0, y: 20 }} />

        {showCopy ? (
          <StaticPoint
            className={showWitnesses ? "isosceles-point-construction__witness isosceles-point-construction__witness--inside" : "isosceles-point-construction__point"}
            point={pointC}
            label="C"
            labelOffset={{ x: 0, y: 20 }}
          />
        ) : null}

        {showWitnesses ? (
          <>
            <StaticPoint
              className="isosceles-point-construction__witness isosceles-point-construction__witness--outside"
              point={pointD}
              label="D"
              labelOffset={{ x: 0, y: 20 }}
            />
            <text className="isosceles-point-construction__witness-label isosceles-point-construction__witness-label--outside" x={pointD.x + 8} y={pointD.y - 11}>outside circle B</text>
            <text className="isosceles-point-construction__witness-label isosceles-point-construction__witness-label--inside" x={pointC.x} y={pointC.y - 11}>inside circle B</text>
          </>
        ) : null}

        <DraggablePoint
          hitRadius={handleRadius}
          label="B"
          labelOffset={{ x: 0, y: 20 }}
          onDrag={(p) => {
            const nextBaseLength = isExploring
              ? ((p.x - svgWidth / 2) * 2) / displayScale
              : (p.x - pointA.x) / displayScale;
            setBaseLength(
              Math.round(
                clamp(nextBaseLength, minimumBaseLength, maximumBaseLength),
              ),
            );
          }}
          onDragEnd={() => setIsDragging(false)}
          onDragStart={() => setIsDragging(true)}
          point={pointB}
          radius={7}
          className={classNames(
            "isosceles-point-construction__handle",
            isDragging && "isosceles-point-construction__handle--active",
          )}
          showLabel={true}
        />
      </SvgCanvas>

      <div className="isosceles-point-construction__summary theorem-figure__summary">
        {showResult ? (
          <>
            <div className="theorem-measure isosceles-point-construction__measure--result">
              <strong>AP</strong>
              <span>{radius} units</span>
            </div>
            <div className="theorem-measure isosceles-point-construction__measure--result">
              <strong>BP</strong>
              <span>{radius} units</span>
            </div>
            <div className="theorem-measure isosceles-point-construction__measure--result">
              <strong>Result</strong>
              <span>AP ≅ BP</span>
            </div>
          </>
        ) : showIntersections ? (
          <>
            <div className="theorem-measure">
              <strong>Inside witness</strong>
              <span>C lies inside circle B</span>
            </div>
            <div className="theorem-measure">
              <strong>Outside witness</strong>
              <span>D lies outside circle B</span>
            </div>
            <div className="theorem-measure">
              <strong>Continuity</strong>
              <span>Intersections P and Q exist</span>
            </div>
          </>
        ) : showWitnesses ? (
          <>
            <div className="theorem-measure">
              <strong>BC</strong>
              <span>one copy of AB</span>
            </div>
            <div className="theorem-measure">
              <strong>AC</strong>
              <span>two copies of AB</span>
            </div>
            <div className="theorem-measure">
              <strong>BD</strong>
              <span>three copies of AB</span>
            </div>
          </>
        ) : showCircles ? (
          <>
            <div className="theorem-measure">
              <strong>Circle centered at A</strong>
              <span>radius AC</span>
            </div>
            <div className="theorem-measure">
              <strong>Circle centered at B</strong>
              <span>radius AC</span>
            </div>
            <div className="theorem-measure">
              <strong>AC</strong>
              <span>two copies of AB</span>
            </div>
          </>
        ) : (
          <>
            <div className="theorem-measure">
              <strong>AB</strong>
              <span>{baseLength} units</span>
            </div>
            <div className="theorem-measure">
              <strong>BC</strong>
              <span>{baseLength} units</span>
            </div>
            <div className="theorem-measure">
              <strong>AC</strong>
              <span>two copies of AB</span>
            </div>
          </>
        )}
      </div>

      <label className="isosceles-point-construction__control" htmlFor="isosceles-point-base-length">
        <span>
          <strong>Base length</strong>
          <span>{baseLength} units</span>
        </span>
        <input
          id="isosceles-point-base-length"
          max={maximumBaseLength}
          min={minimumBaseLength}
          onChange={(event) => setBaseLength(Number(event.target.value))}
          type="range"
          value={baseLength}
        />
      </label>

      <p className={classNames("isosceles-point-construction__status", showResult && "isosceles-point-construction__status--result")}>
        {status}
      </p>
    </div>
  );
}
