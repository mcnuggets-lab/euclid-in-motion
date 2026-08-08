import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/rhs-congruence.css";

import {
  classNames,
  clamp,
  formatDisplayNumber,
  getSvgCoordinates,
  hatchMark,
  pointAlong,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type RHSCongruenceIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ProofStep = TheoremDiscovery & {
  status: string;
};

const blue = "#1f5fbf";
const orange = "#c25b2a";
const purple = "#7252a3";
const green = "#23805a";

const freePointB = { x: 44, y: 170 };
const freePointE = { x: 194, y: 170 };
const minimumLeg = 75;
const maximumLeg = 105;
const minimumHypotenuse = 115;
const maximumHypotenuse = 140;
const initialLeg = 90;
const initialHypotenuse = 125;
const handleRadius = 24;

const guideA = { x: 118, y: 52 };
const guideB = { x: 118, y: 136 };
const guideC = { x: 55, y: 136 };
const guideG = { x: 181, y: 136 };
const guideD = { x: 244, y: 52 };
const guideE = { x: 244, y: 136 };
const guideF = { x: 307, y: 136 };

const proofSteps: ProofStep[] = [
  {
    insight:
      "RHS starts with one leg, the hypotenuse, and the right angles. Nothing has shown the second leg pair yet.",
    prompt:
      "Match the blue legs AB and DE, the orange hypotenuses AC and DF, and the right-angle squares at B and E. The congruent-triangle conclusion is still the goal.",
    status:
      "Right triangles at B and E with AB ≅ DE and AC ≅ DF. Prove △ABC ≅ △DEF.",
    title: "Name the RHS data",
  },
  {
    insight:
      "The auxiliary point G turns the unknown second leg of DEF into a copied segment on the extension of BC.",
    prompt:
      "Follow BC through B to the new point G. The purple copied marks show BG ≅ EF, but BC ≅ EF has not been established.",
    status: "Extend BC through B to G and copy EF so BG ≅ EF.",
    title: "Extend side BC and copy EF",
  },
  {
    insight:
      "Linear Pair supplies the included right angle for the auxiliary triangle, and that makes a clean SAS comparison.",
    prompt:
      "Read the right-angle square on ∠ABG, then compare AB with DE and BG with EF. The green result is AG ≅ DF, not yet a statement about triangle ABC.",
    status:
      "Linear Pair makes ∠ABG a right angle, and SAS gives △ABG ≅ △DEF, so AG ≅ DF.",
    title: "Use Linear Pair and SAS",
  },
  {
    insight:
      "DF now links the given hypotenuse AC to the newly proved segment AG, so triangle ACG becomes isosceles.",
    prompt:
      "Keep the orange hypotenuse match AC ≅ DF in view while using the green SAS result AG ≅ DF. Those two equalities are what make △ACG isosceles.",
    status: "AC ≅ DF and AG ≅ DF, so AC ≅ AG and △ACG is isosceles.",
    title: "Make triangle ACG isosceles",
  },
  {
    insight:
      "The isosceles base-angle theorem moves the acute angle from C to G, and the auxiliary congruence moves that angle from G to F.",
    prompt:
      "Read the green base-angle pair in △ACG together with the transferred acute angle at F. Collinearity lets ∠ACG become ∠ACB and ∠AGC become ∠AGB.",
    status:
      "Base angles in △ACG match, and the auxiliary congruence transfers the acute angle to F, so ∠ACB ≅ ∠DFE.",
    title: "Transfer the acute angle",
  },
  {
    insight:
      "The original right triangles now have two corresponding angles and the hypotenuse, so AAS closes the theorem.",
    prompt:
      "Focus only on the original triangles now: right angles at B and E, matching acute angles at C and F, and the given orange hypotenuses AC and DF.",
    status:
      "AAS uses the right angles, the derived acute angles, and AC ≅ DF to prove △ABC ≅ △DEF.",
    title: "Apply AAS and finish",
  },
];

function angleArc(center: Point, first: Point, second: Point, radius: number) {
  const startAngle = Math.atan2(first.y - center.y, first.x - center.x);
  const endAngle = Math.atan2(second.y - center.y, second.x - center.x);
  let delta = endAngle - startAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const start = {
    x: center.x + Math.cos(startAngle) * radius,
    y: center.y + Math.sin(startAngle) * radius,
  };
  const end = {
    x: center.x + Math.cos(startAngle + delta) * radius,
    y: center.y + Math.sin(startAngle + delta) * radius,
  };

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${end.x} ${end.y}`;
}

function arcFromAngles(center: Point, radius: number, startAngle: number, endAngle: number) {
  let delta = endAngle - startAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const start = {
    x: center.x + Math.cos(startAngle) * radius,
    y: center.y + Math.sin(startAngle) * radius,
  };
  const end = {
    x: center.x + Math.cos(startAngle + delta) * radius,
    y: center.y + Math.sin(startAngle + delta) * radius,
  };

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${end.x} ${end.y}`;
}

function AngleMark({
  center,
  className,
  count = 1,
  first,
  second,
}: {
  center: Point;
  className: string;
  count?: 1 | 2;
  first: Point;
  second: Point;
}) {
  const radii = count === 1 ? [15] : [11, 17];
  return (
    <>
      {radii.map((radius) => (
        <path
          className={classNames("rhs-congruence__angle", className)}
          d={angleArc(center, first, second, radius)}
          key={`${className}-${radius}`}
        />
      ))}
    </>
  );
}

function Triangle({
  a,
  b,
  c,
  className,
}: {
  a: Point;
  b: Point;
  c: Point;
  className?: string;
}) {
  return (
    <polygon
      className={classNames("rhs-congruence__triangle", className)}
      points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
    />
  );
}

function Side({
  className,
  from,
  to,
}: {
  className: string;
  from: Point;
  to: Point;
}) {
  return <line className={className} x1={from.x} x2={to.x} y1={from.y} y2={to.y} />;
}

function segmentTicks(
  first: Point,
  second: Point,
  count: 1 | 2 | 3,
  stroke: string,
  keyPrefix: string,
) {
  const fractions =
    count === 1 ? [0.5] : count === 2 ? [0.43, 0.57] : [0.38, 0.5, 0.62];
  return fractions.map((fraction, index) =>
    hatchMark(
      pointAlong(first, second, fraction),
      { x: second.x - first.x, y: second.y - first.y },
      5,
      `${keyPrefix}-${index}`,
      stroke,
    ),
  );
}

function RightAngleMark({
  point,
  className,
  horizontalDirection,
  size = 12,
}: {
  point: Point;
  className?: string;
  horizontalDirection: -1 | 1;
  size?: number;
}) {
  return (
    <path
      className={classNames("rhs-congruence__right-angle", className)}
      d={`M ${point.x} ${point.y - size} L ${point.x + horizontalDirection * size} ${point.y - size} L ${point.x + horizontalDirection * size} ${point.y}`}
    />
  );
}

function FigurePoint({ label, point }: { label: string; point: Point }) {
  const dx = point.x > 288 ? -12 : point.x < 72 ? 12 : 8;
  const dy = point.y < 78 ? -9 : 16;
  return (
    <g>
      <circle className="rhs-congruence__point" cx={point.x} cy={point.y} r="4.5" />
      <text className="rhs-congruence__point-label" x={point.x + dx} y={point.y + dy}>
        {label}
      </text>
    </g>
  );
}

function ComparisonPoint({
  dx,
  dy,
  label,
  point,
}: {
  dx: number;
  dy: number;
  label: string;
  point: Point;
}) {
  return (
    <g>
      <circle
        className="rhs-ssa-comparison__point"
        cx={point.x}
        cy={point.y}
        r="4.5"
      />
      <text
        className="rhs-ssa-comparison__point-label"
        x={point.x + dx}
        y={point.y + dy}
      >
        {label}
      </text>
    </g>
  );
}

const ssaPointA = { x: 45, y: 170 };
const ssaPointC = { x: 150, y: 55 };
const ssaCircleRadius = 125;
const ssaIntersectionOffset = Math.sqrt(
  ssaCircleRadius ** 2 - (ssaPointA.y - ssaPointC.y) ** 2,
);
const ssaPointBNear = {
  x: ssaPointC.x - ssaIntersectionOffset,
  y: ssaPointA.y,
};
const ssaPointBFar = {
  x: ssaPointC.x + ssaIntersectionOffset,
  y: ssaPointA.y,
};
const ssaRayEnd = { x: 275, y: ssaPointA.y };
const ssaNearCircleAngle = Math.atan2(
  ssaPointBNear.y - ssaPointC.y,
  ssaPointBNear.x - ssaPointC.x,
);
const ssaFarCircleAngle = Math.atan2(
  ssaPointBFar.y - ssaPointC.y,
  ssaPointBFar.x - ssaPointC.x,
);

const rhsNotePointA = { x: 45, y: 50 };
const rhsNotePointB = { x: 45, y: 170 };
const rhsNotePointC = { x: 175, y: 170 };
const rhsNoteRayEnd = { x: 280, y: 170 };
const rhsNoteHypotenuse = Math.hypot(
  rhsNotePointC.x - rhsNotePointA.x,
  rhsNotePointC.y - rhsNotePointA.y,
);
const rhsNoteIntersectionAngle = Math.atan2(
  rhsNotePointC.y - rhsNotePointA.y,
  rhsNotePointC.x - rhsNotePointA.x,
);

export function RHSSSAAmbiguityIllustration() {
  const generalTitleId = useId();
  const generalDescriptionId = useId();
  const rhsTitleId = useId();
  const rhsDescriptionId = useId();

  return (
    <div className="rhs-ssa-comparison">
      <div className="rhs-ssa-comparison__panels">
        <div className="rhs-ssa-comparison__panel">
          <strong>General SSA: two triangles</strong>
          <svg
            aria-describedby={generalDescriptionId}
            aria-labelledby={generalTitleId}
            className="rhs-ssa-comparison__svg"
            role="img"
            viewBox="0 0 300 210"
          >
            <title id={generalTitleId}>General SSA can produce two triangles</title>
            <desc id={generalDescriptionId}>
              The undetermined side AB is the horizontal base. A circle centered at C
              meets its ray at B one and B two, so the base can have two lengths while
              the two given sides and non-included angle stay the same.
            </desc>

            <Side
              className="rhs-ssa-comparison__construction"
              from={ssaPointA}
              to={ssaRayEnd}
            />
            <path
              className="rhs-ssa-comparison__construction"
              d={arcFromAngles(
                ssaPointC,
                ssaCircleRadius,
                ssaFarCircleAngle - 0.12,
                ssaNearCircleAngle + 0.12,
              )}
            />
            <polygon
              className="rhs-ssa-comparison__triangle rhs-ssa-comparison__triangle--near"
              points={`${ssaPointA.x},${ssaPointA.y} ${ssaPointC.x},${ssaPointC.y} ${ssaPointBNear.x},${ssaPointBNear.y}`}
            />
            <polygon
              className="rhs-ssa-comparison__triangle rhs-ssa-comparison__triangle--far"
              points={`${ssaPointA.x},${ssaPointA.y} ${ssaPointC.x},${ssaPointC.y} ${ssaPointBFar.x},${ssaPointBFar.y}`}
            />
            <Side
              className="rhs-ssa-comparison__variable-base rhs-ssa-comparison__variable-base--far"
              from={ssaPointA}
              to={ssaPointBFar}
            />
            <Side
              className="rhs-ssa-comparison__variable-base rhs-ssa-comparison__variable-base--near"
              from={ssaPointA}
              to={ssaPointBNear}
            />
            <Side
              className="rhs-ssa-comparison__given-side rhs-ssa-comparison__given-side--first"
              from={ssaPointA}
              to={ssaPointC}
            />
            <Side
              className="rhs-ssa-comparison__given-side rhs-ssa-comparison__given-side--second"
              from={ssaPointC}
              to={ssaPointBNear}
            />
            <Side
              className="rhs-ssa-comparison__given-side rhs-ssa-comparison__given-side--second"
              from={ssaPointC}
              to={ssaPointBFar}
            />
            {segmentTicks(ssaPointA, ssaPointC, 1, blue, "ssa-ac")}
            {segmentTicks(ssaPointC, ssaPointBNear, 2, orange, "ssa-cb-near")}
            {segmentTicks(ssaPointC, ssaPointBFar, 2, orange, "ssa-cb-far")}
            <AngleMark
              center={ssaPointA}
              className="rhs-ssa-comparison__given-angle"
              first={ssaPointBFar}
              second={ssaPointC}
            />
            <circle
              className="rhs-ssa-comparison__intersection"
              cx={ssaPointBNear.x}
              cy={ssaPointBNear.y}
              r="7"
            />
            <circle
              className="rhs-ssa-comparison__intersection"
              cx={ssaPointBFar.x}
              cy={ssaPointBFar.y}
              r="7"
            />
            <ComparisonPoint dx={-11} dy={20} label="A" point={ssaPointA} />
            <ComparisonPoint dx={-12} dy={-9} label="C" point={ssaPointC} />
            <ComparisonPoint dx={0} dy={20} label="B₁" point={ssaPointBNear} />
            <ComparisonPoint dx={0} dy={20} label="B₂" point={ssaPointBFar} />
          </svg>
          <p className="rhs-ssa-comparison__caption">
            The horizontal base AB can end at B₁ or B₂, producing two noncongruent
            triangles from the same SSA data.
          </p>
        </div>

        <div className="rhs-ssa-comparison__panel">
          <strong>RHS: one triangle</strong>
          <svg
            aria-describedby={rhsDescriptionId}
            aria-labelledby={rhsTitleId}
            className="rhs-ssa-comparison__svg"
            role="img"
            viewBox="0 0 300 210"
          >
            <title id={rhsTitleId}>RHS has one intersection on the chosen ray</title>
            <desc id={rhsDescriptionId}>
              A right triangle has fixed leg AB and hypotenuse AC. The perpendicular
              ray from B is the horizontal base. It meets the circle centered at A at
              exactly one point C in the chosen direction.
            </desc>

            <Side
              className="rhs-ssa-comparison__construction"
              from={rhsNotePointB}
              to={rhsNoteRayEnd}
            />
            <path
              className="rhs-ssa-comparison__construction"
              d={arcFromAngles(
                rhsNotePointA,
                rhsNoteHypotenuse,
                rhsNoteIntersectionAngle - 0.22,
                rhsNoteIntersectionAngle + 0.22,
              )}
            />
            <polygon
              className="rhs-ssa-comparison__triangle rhs-ssa-comparison__triangle--rhs"
              points={`${rhsNotePointA.x},${rhsNotePointA.y} ${rhsNotePointB.x},${rhsNotePointB.y} ${rhsNotePointC.x},${rhsNotePointC.y}`}
            />
            <Side
              className="rhs-ssa-comparison__given-side rhs-ssa-comparison__given-side--first"
              from={rhsNotePointA}
              to={rhsNotePointB}
            />
            <Side
              className="rhs-ssa-comparison__given-side rhs-ssa-comparison__given-side--second"
              from={rhsNotePointA}
              to={rhsNotePointC}
            />
            <Side
              className="rhs-ssa-comparison__result-side"
              from={rhsNotePointB}
              to={rhsNotePointC}
            />
            {segmentTicks(rhsNotePointA, rhsNotePointB, 1, blue, "rhs-note-ab")}
            {segmentTicks(rhsNotePointA, rhsNotePointC, 2, orange, "rhs-note-ac")}
            <RightAngleMark
              className="rhs-ssa-comparison__right-angle"
              horizontalDirection={1}
              point={rhsNotePointB}
            />
            <circle
              className="rhs-ssa-comparison__intersection rhs-ssa-comparison__intersection--single"
              cx={rhsNotePointC.x}
              cy={rhsNotePointC.y}
              r="7"
            />
            <ComparisonPoint dx={-12} dy={-9} label="A" point={rhsNotePointA} />
            <ComparisonPoint dx={-12} dy={20} label="B" point={rhsNotePointB} />
            <ComparisonPoint dx={11} dy={20} label="C" point={rhsNotePointC} />
          </svg>
          <p className="rhs-ssa-comparison__caption">
            The horizontal base BC has one possible endpoint on the chosen
            perpendicular ray, so the triangle is fixed.
          </p>
        </div>
      </div>
    </div>
  );
}

function renderGuidedStep(step: number) {
  const showConstruction = step >= 1 && step <= 4;
  const showAuxiliaryTriangle = step >= 2 && step <= 4;
  const showIsoscelesTriangle = step >= 3 && step <= 4;
  const showTransferredAngles = step === 4;
  const showFinal = step === 5;

  if (showFinal) {
    return (
      <>
        <text className="rhs-congruence__panel-label" x="92" y="24">
          Original triangle
        </text>
        <text className="rhs-congruence__panel-label" x="270" y="24">
          Original triangle
        </text>
        <Triangle a={guideA} b={guideB} c={guideC} className="rhs-congruence__triangle--final" />
        <Triangle a={guideD} b={guideE} c={guideF} className="rhs-congruence__triangle--final" />
        <Side className="rhs-congruence__side rhs-congruence__side--hypotenuse" from={guideA} to={guideC} />
        <Side className="rhs-congruence__side rhs-congruence__side--hypotenuse" from={guideD} to={guideF} />
        {segmentTicks(guideA, guideC, 2, orange, "final-ac")}
        {segmentTicks(guideD, guideF, 2, orange, "final-df")}
        <RightAngleMark className="rhs-congruence__right-angle--result" horizontalDirection={-1} point={guideB} />
        <RightAngleMark className="rhs-congruence__right-angle--result" horizontalDirection={1} point={guideE} />
        <AngleMark center={guideC} className="rhs-congruence__angle--result" first={guideA} second={guideB} />
        <AngleMark center={guideF} className="rhs-congruence__angle--result" first={guideD} second={guideE} />
        <text className="rhs-congruence__bridge-label rhs-congruence__bridge-label--final" x="181" y="208">
          AAS gives △ABC ≅ △DEF
        </text>
        <FigurePoint label="A" point={guideA} />
        <FigurePoint label="B" point={guideB} />
        <FigurePoint label="C" point={guideC} />
        <FigurePoint label="D" point={guideD} />
        <FigurePoint label="E" point={guideE} />
        <FigurePoint label="F" point={guideF} />
      </>
    );
  }

  return (
    <>
      <Triangle a={guideA} b={guideB} c={guideC} className={showTransferredAngles ? "rhs-congruence__triangle--muted" : undefined} />
      <Triangle a={guideD} b={guideE} c={guideF} className={showTransferredAngles ? "rhs-congruence__triangle--muted" : "rhs-congruence__triangle--target"} />
      {showAuxiliaryTriangle ? (
        <Triangle a={guideA} b={guideB} c={guideG} className="rhs-congruence__triangle--auxiliary" />
      ) : null}
      {showIsoscelesTriangle ? (
        <Triangle a={guideA} b={guideC} c={guideG} className="rhs-congruence__triangle--isosceles" />
      ) : null}

      <Side className="rhs-congruence__side rhs-congruence__side--leg" from={guideA} to={guideB} />
      <Side className="rhs-congruence__side rhs-congruence__side--leg" from={guideD} to={guideE} />
      {segmentTicks(guideA, guideB, 1, blue, `leg-left-${step}`)}
      {segmentTicks(guideD, guideE, 1, blue, `leg-right-${step}`)}

      <Side className="rhs-congruence__side rhs-congruence__side--hypotenuse" from={guideA} to={guideC} />
      <Side className="rhs-congruence__side rhs-congruence__side--hypotenuse" from={guideD} to={guideF} />
      {segmentTicks(guideA, guideC, 2, orange, `hyp-left-${step}`)}
      {segmentTicks(guideD, guideF, 2, orange, `hyp-right-${step}`)}

      <RightAngleMark horizontalDirection={-1} point={guideB} />
      <RightAngleMark horizontalDirection={1} point={guideE} />

      {showConstruction ? (
        <>
          <Side className="rhs-congruence__construction" from={guideB} to={guideG} />
          {segmentTicks(guideB, guideG, 3, purple, `copy-bg-${step}`)}
          {segmentTicks(guideE, guideF, 3, purple, `copy-ef-${step}`)}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Side className="rhs-congruence__result-segment" from={guideA} to={guideG} />
          {segmentTicks(guideA, guideG, 2, green, "result-ag-2")}
          <RightAngleMark className="rhs-congruence__right-angle--construction" horizontalDirection={1} point={guideB} />
          <text className="rhs-congruence__panel-label" x="96" y="24">
            Auxiliary triangle
          </text>
          <text className="rhs-congruence__panel-label" x="270" y="24">
            SAS match
          </text>
          <text className="rhs-congruence__bridge-label" x="181" y="208">
            AG matches DF after SAS
          </text>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Side className="rhs-congruence__result-segment" from={guideA} to={guideG} />
          {segmentTicks(guideA, guideG, 2, green, "result-ag-3")}
          <text className="rhs-congruence__panel-label" x="118" y="24">
            AC ≅ DF
          </text>
          <text className="rhs-congruence__panel-label" x="244" y="24">
            AG ≅ DF
          </text>
          <text className="rhs-congruence__bridge-label" x="181" y="208">
            So △ACG is isosceles
          </text>
        </>
      ) : null}

      {showTransferredAngles ? (
        <>
          <Side className="rhs-congruence__result-segment" from={guideA} to={guideG} />
          {segmentTicks(guideA, guideG, 2, green, "result-ag-4")}
          <AngleMark center={guideC} className="rhs-congruence__angle--result" first={guideA} second={guideB} />
          <AngleMark center={guideG} className="rhs-congruence__angle--result" first={guideA} second={guideB} />
          <AngleMark center={guideF} className="rhs-congruence__angle--result" first={guideD} second={guideE} />
          <text className="rhs-congruence__panel-label" x="118" y="24">
            Isosceles base angles
          </text>
          <text className="rhs-congruence__panel-label" x="270" y="24">
            Auxiliary acute angle
          </text>
          <text className="rhs-congruence__bridge-label" x="181" y="208">
            The acute angle at C matches the acute angle at F
          </text>
        </>
      ) : null}

      {step === 0 ? (
        <>
          <text className="rhs-congruence__panel-label" x="90" y="24">
            Right triangle
          </text>
          <text className="rhs-congruence__panel-label" x="270" y="24">
            Right triangle
          </text>
          <text className="rhs-congruence__bridge-label" x="181" y="208">
            A leg and the hypotenuse are given
          </text>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <text className="rhs-congruence__panel-label" x="104" y="24">
            Extend BC through B
          </text>
          <text className="rhs-congruence__panel-label" x="270" y="24">
            Copy EF
          </text>
          <text className="rhs-congruence__bridge-label" x="181" y="208">
            BG copies EF on the extension
          </text>
        </>
      ) : null}

      <FigurePoint label="A" point={guideA} />
      <FigurePoint label="B" point={guideB} />
      <FigurePoint label="C" point={guideC} />
      {showConstruction ? <FigurePoint label="G" point={guideG} /> : null}
      <FigurePoint label="D" point={guideD} />
      <FigurePoint label="E" point={guideE} />
      <FigurePoint label="F" point={guideF} />
    </>
  );
}

function formatMeasure(value: number) {
  return formatDisplayNumber(value, 1);
}

export function RHSCongruenceIllustration({
  activeStep,
  onDiscoveryChange,
}: RHSCongruenceIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const legControlId = useId();
  const hypotenuseControlId = useId();
  const [leg, setLeg] = useState(initialLeg);
  const [hypotenuse, setHypotenuse] = useState(initialHypotenuse);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentStep = proofSteps[proofStep] ?? proofSteps[0];

  const remainingLeg = Math.sqrt(Math.max(hypotenuse ** 2 - leg ** 2, 0));
  const freePointA = { x: freePointB.x, y: freePointB.y - leg };
  const freePointC = { x: freePointB.x + remainingLeg, y: freePointB.y };
  const freePointD = { x: freePointE.x, y: freePointE.y - leg };
  const freePointF = { x: freePointE.x + remainingLeg, y: freePointE.y };
  const targetIntersectionAngle = Math.atan2(
    freePointF.y - freePointD.y,
    freePointF.x - freePointD.x,
  );
  const explorationDiscovery: ProofStep = {
    insight:
      "A right triangle is fixed once a leg and the hypotenuse are fixed. The remaining leg comes from the construction, not from an extra given.",
    prompt:
      "Drag A up or down, or use the sliders, to set the shared leg and hypotenuse. Read C and F as the points where the horizontal rays meet the matching hypotenuse arcs.",
    status: `With leg ${formatMeasure(leg)} and hypotenuse ${formatMeasure(hypotenuse)}, the perpendicular-ray and arc construction gives BC = EF = ${formatMeasure(remainingLeg)}. This illustrates RHS rigidity; the guided extension, Linear Pair, SAS, isosceles, and AAS chain is the proof.`,
    title: "Reconstruct the right triangles from the leg and hypotenuse",
  };
  const discovery = isExploring ? explorationDiscovery : currentStep;

  useEffect(() => {
    onDiscoveryChange({
      insight: discovery.insight,
      prompt: discovery.prompt,
      title: discovery.title,
    });
  }, [discovery.insight, discovery.prompt, discovery.title, onDiscoveryChange]);

  const updateApex = (point: Point) => {
    setLeg(
      Math.round(
        clamp(freePointB.y - point.y, minimumLeg, maximumLeg),
      ),
    );
  };

  const beginDrag = (event: PointerEvent<SVGCircleElement>) => {
    if (!isExploring) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateApex(getSvgCoordinates(event.currentTarget.ownerSVGElement!, event));
  };

  const figureDescription = isExploring
    ? "RHS free exploration. The upper point A is draggable along the perpendicular ray from B. Two right triangles share the same leg and hypotenuse. A and D lie on perpendicular rays from B and E. C and F lie on horizontal rays where those rays meet matching hypotenuse arcs centered at A and D."
    : proofStep === 0
      ? "RHS proof step 1. Right triangles ABC and DEF show the given right angles, one corresponding leg pair, and the corresponding hypotenuse pair."
      : proofStep === 1
        ? "RHS proof step 2. BC is extended through B to G, and BG is copied from EF."
        : proofStep === 2
          ? "RHS proof step 3. Linear Pair makes angle ABG a right angle, and triangles ABG and DEF are compared by SAS."
          : proofStep === 3
            ? "RHS proof step 4. AC and AG are both tied to DF, so triangle ACG is highlighted as isosceles."
            : proofStep === 4
              ? "RHS proof step 5. Base angles in the isosceles triangle and the auxiliary congruence transfer the acute angle from C to F."
              : "RHS proof step 6. The original right triangles use the right angles, the derived acute-angle pair, and the hypotenuses to finish by AAS.";

  return (
    <div className="theorem-figure rhs-congruence">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg rhs-congruence__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) setIsDragging(false);
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
        <title id={titleId}>
          {isExploring
            ? "RHS Congruence reconstruction"
            : `RHS Congruence: ${currentStep.title}`}
        </title>
        <desc id={descriptionId}>{figureDescription}</desc>

        {isExploring ? (
          <>
            <text className="rhs-congruence__panel-label" x="86" y="20">
              Choose the RHS inputs
            </text>
            <text className="rhs-congruence__panel-label" x="250" y="20">
              Reconstructed triangle
            </text>

            <Triangle a={freePointA} b={freePointB} c={freePointC} />
            <Triangle a={freePointD} b={freePointE} c={freePointF} className="rhs-congruence__triangle--final" />

            <Side className="rhs-congruence__side rhs-congruence__side--leg" from={freePointA} to={freePointB} />
            <Side className="rhs-congruence__side rhs-congruence__side--leg" from={freePointD} to={freePointE} />
            {segmentTicks(freePointA, freePointB, 1, blue, "free-leg-left")}
            {segmentTicks(freePointD, freePointE, 1, blue, "free-leg-right")}

            <Side className="rhs-congruence__side rhs-congruence__side--hypotenuse" from={freePointA} to={freePointC} />
            <Side className="rhs-congruence__side rhs-congruence__side--hypotenuse" from={freePointD} to={freePointF} />
            {segmentTicks(freePointA, freePointC, 2, orange, "free-hyp-left")}
            {segmentTicks(freePointD, freePointF, 2, orange, "free-hyp-right")}

            <Side className="rhs-congruence__result-segment" from={freePointB} to={freePointC} />
            <Side className="rhs-congruence__result-segment" from={freePointE} to={freePointF} />

            <RightAngleMark horizontalDirection={1} point={freePointB} />
            <RightAngleMark horizontalDirection={1} point={freePointE} />

            <Side className="rhs-congruence__construction" from={freePointE} to={{ x: Math.min(freePointF.x + 14, svgWidth - 6), y: freePointE.y }} />
            <path
              className="rhs-congruence__construction-arc"
              d={arcFromAngles(
                freePointD,
                hypotenuse,
                targetIntersectionAngle - 0.11,
                targetIntersectionAngle + 0.18,
              )}
            />

            <text className="rhs-congruence__bridge-label" x="160" y="208">
              The remaining leg is reconstructed, not given
            </text>

            <FigurePoint label="A" point={freePointA} />
            <FigurePoint label="B" point={freePointB} />
            <FigurePoint label="C" point={freePointC} />
            <FigurePoint label="D" point={freePointD} />
            <FigurePoint label="E" point={freePointE} />
            <FigurePoint label="F" point={freePointF} />
            <circle
              className="rhs-congruence__handle-target"
              cx={freePointA.x}
              cy={freePointA.y}
              onPointerDown={beginDrag}
              r={handleRadius}
            />
            <circle
              className={classNames(
                "rhs-congruence__handle",
                isDragging && "rhs-congruence__handle--active",
              )}
              cx={freePointA.x}
              cy={freePointA.y}
              r="7"
            />
          </>
        ) : (
          renderGuidedStep(proofStep)
        )}
      </svg>

      {isExploring ? (
        <>
          <div className="theorem-figure__summary rhs-congruence__summary">
            <div className="theorem-measure theorem-measure--accent">
              <strong>RHS inputs</strong>
              <span>
                Right angles at B and E, AB = DE = {formatMeasure(leg)}, and AC = DF ={" "}
                {formatMeasure(hypotenuse)}.
              </span>
            </div>
            <div className="theorem-measure rhs-congruence__construction-card">
              <strong>Construction</strong>
              <span>
                Put A and D on the perpendicular rays, then place C and F where the
                horizontal rays meet the matching arcs centered at A and D.
              </span>
            </div>
            <div className="theorem-measure rhs-congruence__result-card">
              <strong>Reconstruction result</strong>
              <span>
                BC = EF = {formatMeasure(remainingLeg)}. This equality comes from the
                reconstruction, not from the starting data.
              </span>
            </div>
          </div>
          <p className="rhs-congruence__proof-note">
            The free reconstruction illustrates the theorem. The guided extension,
            Linear Pair, SAS, isosceles, and AAS chain is the proof.
          </p>
          <div className="rhs-congruence__controls">
            <label className="rhs-congruence__control" htmlFor={legControlId}>
              <span>
                <strong>Given leg AB = DE</strong>
                <span>{leg}</span>
              </span>
              <input
                aria-label="Given leg AB equals DE"
                aria-valuetext={`given leg ${leg}`}
                id={legControlId}
                max={maximumLeg}
                min={minimumLeg}
                onChange={(event) => setLeg(Number(event.target.value))}
                type="range"
                value={leg}
              />
            </label>
            <label className="rhs-congruence__control" htmlFor={hypotenuseControlId}>
              <span>
                <strong>Given hypotenuse AC = DF</strong>
                <span>{hypotenuse}</span>
              </span>
              <input
                aria-label="Given hypotenuse AC equals DF"
                aria-valuetext={`given hypotenuse ${hypotenuse}`}
                id={hypotenuseControlId}
                max={maximumHypotenuse}
                min={minimumHypotenuse}
                onChange={(event) => setHypotenuse(Number(event.target.value))}
                type="range"
                value={hypotenuse}
              />
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="theorem-measure rhs-congruence__proof-summary">
            <strong>{currentStep.title}</strong>
            <span>{currentStep.status}</span>
          </div>
          {proofStep === 2 ? (
            <div className="rhs-congruence__proof-result">
              <strong>SAS result</strong>
              <span>AB and DE, BG and EF, and the included right angles justify △ABG ≅ △DEF.</span>
            </div>
          ) : null}
          {proofStep === 3 ? (
            <div className="rhs-congruence__proof-result rhs-congruence__proof-result--derived">
              <strong>Isosceles setup</strong>
              <span>DF ties the orange given hypotenuse to the green SAS result.</span>
            </div>
          ) : null}
          {proofStep === 4 ? (
            <div className="rhs-congruence__proof-result rhs-congruence__proof-result--derived">
              <strong>Acute-angle match</strong>
              <span>The isosceles base angles and the auxiliary congruence identify the angle at C.</span>
            </div>
          ) : null}
          {proofStep === 5 ? (
            <div className="rhs-congruence__proof-result rhs-congruence__proof-result--final">
              <strong>△ABC ≅ △DEF</strong>
              <span>RHS is proved by reducing the right-triangle case to AAS.</span>
            </div>
          ) : null}
        </>
      )}

      <p
        aria-live="polite"
        className={classNames("rhs-congruence__status", !isExploring && "rhs-congruence__status--proof")}
      >
        {discovery.status}
      </p>
    </div>
  );
}
