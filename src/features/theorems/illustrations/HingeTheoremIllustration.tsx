import { useEffect, useId, useState } from "react";
import "./styles/hinge-theorem.css";

import {
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
import { SvgCanvas, StaticPoint, DraggablePoint } from "@/features/geometry/components";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type HingeTheoremIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type DragTarget = "abc" | "def";

type ProofStep = TheoremDiscovery & {
  status: string;
};

type ArcData = {
  label: Point;
  path: string;
};

const minimumAngle = 24;
const maximumAngle = 146;
const initialAngleABC = 104;
const initialAngleDEF = 56;
const fixedArmLength = 82;
const movingArmLength = 76;
const handleRadius = 20;

const freePointA = { x: 76, y: 178 };
const freePointB = { x: freePointA.x + fixedArmLength, y: freePointA.y };
const freePointD = { x: 230, y: 178 };
const freePointE = { x: freePointD.x + fixedArmLength, y: freePointD.y };

const proofPointA = { x: 32, y: 188 };
const proofPointB = { x: 290, y: 188 };
const proofArmLength = 140;
const proofGeneralSmallAngle = 24;
const proofGeneralLargeAngle = 60;
const proofNearCollinearSmallAngle = 48;
const proofNearCollinearLargeAngle = 72;

const proofSteps: ProofStep[] = [
  {
    insight:
      "The two marked arm pairs are congruent, and the included angle in triangle ABC is larger. The theorem's target is the comparison BC > EF.",
    prompt:
      "Read the congruence ticks and the included-angle order as givens. The drawing has not yet proved the third-side order.",
    status: "AB ≅ DE, AC ≅ DF, and ∠BAC > ∠EDF. Prove BC > EF.",
    title: "Name the comparison",
  },
  {
    insight:
      "The smaller hinge is copied inside the larger angle. SAS makes triangle BAG congruent to triangle EDF, so BG is a certified copy of EF. The remaining goal is BC > BG.",
    prompt:
      "Match AB with DE, AG with DF, and the included angles. Treat BC > BG as the new goal, not as a conclusion from the picture.",
    status: "△BAG ≅ △EDF by SAS, so BG ≅ EF. It remains to prove BC > BG.",
    title: "Put both hinges at A",
  },
  {
    insight:
      "There is a boundary case before the broken-route construction. If G lies on BC, Crossbar and uniqueness put G between B and C, so BG < BC directly. Otherwise the constructed triangle BGH will be nondegenerate and the route plan is valid.",
    prompt:
      "The diagram shows the noncollinear branch. The dashed H and HG are a plan, not yet a construction; the collinear branch needs no H.",
    status: "If G ∈ BC, then BG < BC directly. Otherwise plan H so that BG < BH + HG = BC.",
    title: "Split off the collinear case",
  },
  {
    insight:
      "Since AG ≅ AC, bisecting angle GAC creates two candidate SAS triangles. Because the bisector remains inside angle BAC, Crossbar puts H on segment BC.",
    prompt:
      "Continue in the noncollinear branch. The equal purple arcs come from Angle Bisector Existence. Crossbar—not the drawing—places H between B and C.",
    status: "AG ≅ AC, ∠GAH ≅ ∠HAC, and H lies between B and C.",
    title: "Construct H",
  },
  {
    insight:
      "Triangles AGH and ACH have two corresponding sides and the included angle congruent. SAS produces exactly the relation the route plan needs: GH ≅ HC.",
    prompt:
      "Follow the equal arms, shared side AH, and equal angle arcs. H is not being declared a midpoint: GH and HC point in different directions.",
    status: "△AGH ≅ △ACH by SAS, so GH ≅ HC.",
    title: "Prove the needed match",
  },
  {
    insight:
      "In the noncollinear branch, Triangle Inequality makes BG shorter than the broken route through H. The earlier collinear branch already gave BG < BC directly.",
    prompt:
      "Read the substitutions in order: first HG = HC, then BH + HC = BC, and finally BG = EF.",
    status: "BG < BH + HG = BH + HC = BC; with BG ≅ EF, this gives BC > EF.",
    title: "Use the broken route",
  },
];

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function leftMovingPoint(angle: number) {
  return polarPoint(
    freePointA,
    movingArmLength,
    -degreesToRadians(angle),
  );
}

function rightMovingPoint(angle: number) {
  return polarPoint(
    freePointD,
    movingArmLength,
    -degreesToRadians(angle),
  );
}

function proofMovingPoint(angle: number) {
  return polarPoint(
    proofPointA,
    proofArmLength,
    -degreesToRadians(angle),
  );
}

function circularArc(
  center: Point,
  radius: number,
  startAngle: number,
  deltaAngle: number,
  labelRadius: number,
): ArcData {
  const start = polarPoint(center, radius, startAngle);
  const end = polarPoint(center, radius, startAngle + deltaAngle);
  const label = polarPoint(
    center,
    labelRadius,
    startAngle + deltaAngle / 2,
  );

  return {
    label,
    path: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${deltaAngle >= 0 ? 1 : 0} ${end.x} ${end.y}`,
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
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const towardOpposite =
    normal.x * (opposite.x - center.x) +
      normal.y * (opposite.y - center.y) >
    0;
  const direction = towardOpposite ? -1 : 1;

  return {
    x: center.x + normal.x * offset * direction,
    y: center.y + normal.y * offset * direction,
  };
}

function cross(first: Point, second: Point) {
  return first.x * second.y - first.y * second.x;
}

function raySegmentIntersection(
  rayOrigin: Point,
  rayPoint: Point,
  segmentStart: Point,
  segmentEnd: Point,
) {
  const ray = {
    x: rayPoint.x - rayOrigin.x,
    y: rayPoint.y - rayOrigin.y,
  };
  const segment = {
    x: segmentEnd.x - segmentStart.x,
    y: segmentEnd.y - segmentStart.y,
  };
  const offset = {
    x: segmentStart.x - rayOrigin.x,
    y: segmentStart.y - rayOrigin.y,
  };
  const denominator = cross(ray, segment);
  const rayFraction = cross(offset, segment) / denominator;

  return {
    x: rayOrigin.x + ray.x * rayFraction,
    y: rayOrigin.y + ray.y * rayFraction,
  };
}

function segmentTicks(
  first: Point,
  second: Point,
  count: number,
  keyPrefix: string,
  stroke: string,
) {
  const direction = { x: second.x - first.x, y: second.y - first.y };

  return Array.from({ length: count }, (_, index) => {
    const centeredIndex = index - (count - 1) / 2;
    const center = pointAlong(first, second, 0.5 + centeredIndex * 0.065);
    return hatchMark(center, direction, 4.5, `${keyPrefix}-${index}`, stroke);
  });
}

function formatLength(value: number) {
  return formatDisplayNumber(value, 1);
}

function comparisonStatus(firstAngle: number, secondAngle: number) {
  if (firstAngle === secondAngle) {
    return "The included angles match, and the two third sides match as SAS predicts.";
  }

  if (firstAngle > secondAngle) {
    return "Triangle ABC has the larger included angle, and its third side BC is longer.";
  }

  return "Triangle DEF has the larger included angle, and its third side EF is longer.";
}

export function HingeTheoremIllustration({
  activeStep,
  onDiscoveryChange,
}: HingeTheoremIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const abcControlId = useId();
  const defControlId = useId();
  const [angleABC, setAngleABC] = useState(initialAngleABC);
  const [angleDEF, setAngleDEF] = useState(initialAngleDEF);
  const [dragging, setDragging] = useState<DragTarget | null>(null);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentStep = proofSteps[proofStep] ?? proofSteps[0];
  const useNearCollinearProofGeometry = proofStep === 2;
  const proofSmallAngle = useNearCollinearProofGeometry
    ? proofNearCollinearSmallAngle
    : proofGeneralSmallAngle;
  const proofLargeAngle = useNearCollinearProofGeometry
    ? proofNearCollinearLargeAngle
    : proofGeneralLargeAngle;
  const displayAngleABC = isExploring ? angleABC : proofLargeAngle;
  const displayAngleDEF = isExploring ? angleDEF : proofSmallAngle;
  const pointC = leftMovingPoint(displayAngleABC);
  const pointF = rightMovingPoint(displayAngleDEF);
  const lengthBC = distance(freePointB, pointC);
  const lengthEF = distance(freePointE, pointF);
  const leftAngleArc = circularArc(
    freePointA,
    15,
    0,
    -degreesToRadians(displayAngleABC),
    27,
  );
  const rightAngleArc = circularArc(
    freePointD,
    15,
    0,
    -degreesToRadians(displayAngleDEF),
    27,
  );
  const leftSideLabelPosition = outsideSegmentLabel(
    freePointB,
    pointC,
    freePointA,
    12,
  );
  const rightSideLabelPosition = outsideSegmentLabel(
    freePointE,
    pointF,
    freePointD,
    12,
  );
  const leftSideLabel = {
    ...leftSideLabelPosition,
    x: clamp(leftSideLabelPosition.x, 14, svgWidth - 14),
  };
  const rightSideLabel = {
    ...rightSideLabelPosition,
    x: clamp(rightSideLabelPosition.x, 14, svgWidth - 14),
  };

  const proofPointC = proofMovingPoint(proofLargeAngle);
  const proofPointG = proofMovingPoint(proofSmallAngle);
  const proofBisectorPoint = proofMovingPoint(
    (proofSmallAngle + proofLargeAngle) / 2,
  );
  const proofPointH = raySegmentIntersection(
    proofPointA,
    proofBisectorPoint,
    proofPointB,
    proofPointC,
  );
  const proofLargeArc = circularArc(
    proofPointA,
    24,
    0,
    -degreesToRadians(proofLargeAngle),
    37,
  );
  const proofCopiedArc = circularArc(
    proofPointA,
    18,
    0,
    -degreesToRadians(proofSmallAngle),
    29,
  );
  const proofHalfArcOne = circularArc(
    proofPointA,
    18,
    -degreesToRadians(proofSmallAngle),
    -degreesToRadians((proofLargeAngle - proofSmallAngle) / 2),
    29,
  );
  const proofHalfArcTwo = circularArc(
    proofPointA,
    18,
    -degreesToRadians((proofSmallAngle + proofLargeAngle) / 2),
    -degreesToRadians((proofLargeAngle - proofSmallAngle) / 2),
    29,
  );

  const status = comparisonStatus(angleABC, angleDEF);
  const explorationDiscovery: ProofStep = {
    insight:
      "The two arm pairs remain congruent while the included angles change. In every displayed example, the larger included angle and longer third side occur in the same triangle. These measurements illustrate the theorem; the guided construction proves it.",
    prompt:
      "Drag C and F or use the sliders. Try both strict orders and make the included angles exactly equal for the SAS checkpoint.",
    status,
    title: "Explore two equal-arm hinges",
  };
  const discovery = isExploring ? explorationDiscovery : currentStep;

  useEffect(() => {
    onDiscoveryChange({
      insight: discovery.insight,
      prompt: discovery.prompt,
      title: discovery.title,
    });
  }, [discovery.insight, discovery.prompt, discovery.title, onDiscoveryChange]);

  const updateAngle = (target: DragTarget, point: Point) => {
    if (target === "abc") {
      const rawDegrees =
        (-Math.atan2(point.y - freePointA.y, point.x - freePointA.x) * 180) /
        Math.PI;
      setAngleABC(Math.round(clamp(rawDegrees, minimumAngle, maximumAngle)));
      return;
    }

    const rawDegrees =
      (-Math.atan2(point.y - freePointD.y, point.x - freePointD.x) * 180) /
      Math.PI;
    setAngleDEF(Math.round(clamp(rawDegrees, minimumAngle, maximumAngle)));
  };

  const showOriginalPair = !isExploring && proofStep === 0;
  const showCommonHinge = !isExploring && proofStep >= 1;
  const showRoutePlan = showCommonHinge && proofStep === 2;
  const showBisector = showCommonHinge && proofStep >= 3;
  const showSmallSas = showCommonHinge && proofStep >= 4;
  const showInequality = showCommonHinge && proofStep >= 5;
  const figureDescription = isExploring
    ? `Triangles ABC and DEF have two congruent arm pairs. Their included angles are ${angleABC} degrees and ${angleDEF} degrees, and their third-side lengths are ${formatLength(lengthBC)} and ${formatLength(lengthEF)}. ${status}`
    : `Hinge Theorem guided proof step ${proofStep + 1}. ${currentStep.status}`;

  const renderComparisonPair = (showMeasurements: boolean) => (
    <>
      <g>
        <line className="hinge-theorem__arm hinge-theorem__arm--first" x1={freePointA.x} x2={freePointB.x} y1={freePointA.y} y2={freePointB.y} />
        <line className="hinge-theorem__arm hinge-theorem__arm--second" x1={freePointA.x} x2={pointC.x} y1={freePointA.y} y2={pointC.y} />
        <line className={classNames("hinge-theorem__third-side", showMeasurements && displayAngleABC > displayAngleDEF && "hinge-theorem__third-side--longer")} x1={freePointB.x} x2={pointC.x} y1={freePointB.y} y2={pointC.y} />
        <path className="hinge-theorem__angle" d={leftAngleArc.path} />
        {segmentTicks(freePointA, freePointB, 1, "hinge-ab", "#1f5fbf")}
        {segmentTicks(freePointA, pointC, 2, "hinge-ac", "#c25b2a")}
        <StaticPoint className="hinge-theorem__point" point={freePointA} label="A" labelOffset={{ x: 0, y: 17 }} />
        <StaticPoint className="hinge-theorem__point" point={freePointB} label="B" labelOffset={{ x: -2, y: 17 }} />
        <text className="hinge-theorem__triangle-name" x={freePointA.x} y="211">△ABC</text>
        {showMeasurements ? (
          <>
            <text className="hinge-theorem__angle-measure" x={leftAngleArc.label.x} y={leftAngleArc.label.y}>{angleABC}°</text>
            <text className="hinge-theorem__side-measure" x={leftSideLabel.x} y={leftSideLabel.y}>{formatLength(lengthBC)}</text>
            <DraggablePoint
              hitRadius={handleRadius}
              label="C"
              labelOffset={{ x: 0, y: -11 }}
              onDrag={(p) => updateAngle("abc", p)}
              onDragEnd={() => setDragging(null)}
              onDragStart={() => setDragging("abc")}
              point={pointC}
              radius={6.5}
              className={classNames("hinge-theorem__handle", dragging === "abc" && "hinge-theorem__handle--active")}
              showLabel={true}
            />
          </>
        ) : (
          <StaticPoint className="hinge-theorem__point" point={pointC} label="C" labelOffset={{ x: 0, y: -11 }} />
        )}
      </g>
      <g>
        <line className="hinge-theorem__arm hinge-theorem__arm--first" x1={freePointD.x} x2={freePointE.x} y1={freePointD.y} y2={freePointE.y} />
        <line className="hinge-theorem__arm hinge-theorem__arm--second" x1={freePointD.x} x2={pointF.x} y1={freePointD.y} y2={pointF.y} />
        <line className={classNames("hinge-theorem__third-side", showMeasurements && displayAngleDEF > displayAngleABC && "hinge-theorem__third-side--longer")} x1={freePointE.x} x2={pointF.x} y1={freePointE.y} y2={pointF.y} />
        <path className="hinge-theorem__angle" d={rightAngleArc.path} />
        {segmentTicks(freePointD, freePointE, 1, "hinge-de", "#1f5fbf")}
        {segmentTicks(freePointD, pointF, 2, "hinge-df", "#c25b2a")}
        <StaticPoint className="hinge-theorem__point" point={freePointD} label="D" labelOffset={{ x: 0, y: 17 }} />
        <StaticPoint className="hinge-theorem__point" point={freePointE} label="E" labelOffset={{ x: 2, y: 17 }} />
        <text className="hinge-theorem__triangle-name" x={freePointD.x} y="211">△DEF</text>
        {showMeasurements ? (
          <>
            <text className="hinge-theorem__angle-measure" x={rightAngleArc.label.x} y={rightAngleArc.label.y}>{angleDEF}°</text>
            <text className="hinge-theorem__side-measure" x={rightSideLabel.x} y={rightSideLabel.y}>{formatLength(lengthEF)}</text>
            <DraggablePoint
              hitRadius={handleRadius}
              label="F"
              labelOffset={{ x: 0, y: -11 }}
              onDrag={(p) => updateAngle("def", p)}
              onDragEnd={() => setDragging(null)}
              onDragStart={() => setDragging("def")}
              point={pointF}
              radius={6.5}
              className={classNames("hinge-theorem__handle", dragging === "def" && "hinge-theorem__handle--active")}
              showLabel={true}
            />
          </>
        ) : (
          <StaticPoint className="hinge-theorem__point" point={pointF} label="F" labelOffset={{ x: 0, y: -11 }} />
        )}
      </g>
    </>
  );

  return (
    <div className="theorem-figure hinge-theorem">
      <SvgCanvas
        descriptionId={descriptionId}
        description={figureDescription}
        titleId={titleId}
        title={isExploring ? "Hinge Theorem interactive" : `Hinge Theorem: ${currentStep.title}`}
        className="hinge-theorem__svg"
        onPointerCancel={() => setDragging(null)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setDragging(null);
          }
        }}
        onPointerMove={(event) => {
          if (dragging && isExploring) {
            updateAngle(dragging, getSvgCoordinates(event.currentTarget, event));
          }
        }}
        onPointerUp={() => setDragging(null)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {isExploring || showOriginalPair ? renderComparisonPair(isExploring) : null}

        {showCommonHinge ? (
          <>
            <line className="hinge-theorem__arm hinge-theorem__arm--first" x1={proofPointA.x} x2={proofPointB.x} y1={proofPointA.y} y2={proofPointB.y} />
            <line className="hinge-theorem__arm hinge-theorem__arm--second" x1={proofPointA.x} x2={proofPointC.x} y1={proofPointA.y} y2={proofPointC.y} />
            <line className={classNames("hinge-theorem__third-side", proofStep === 1 && "hinge-theorem__comparison-side--muted", showInequality && "hinge-theorem__third-side--longer")} x1={proofPointB.x} x2={proofPointC.x} y1={proofPointB.y} y2={proofPointC.y} />
            <line className="hinge-theorem__copied" x1={proofPointA.x} x2={proofPointG.x} y1={proofPointA.y} y2={proofPointG.y} />
            <line className={classNames("hinge-theorem__copied", proofStep === 1 && "hinge-theorem__comparison-side--muted", showInequality && "hinge-theorem__copied--shorter")} x1={proofPointB.x} x2={proofPointG.x} y1={proofPointB.y} y2={proofPointG.y} />
            <path className="hinge-theorem__angle" d={proofLargeArc.path} />
            <path className="hinge-theorem__angle hinge-theorem__angle--copied" d={proofCopiedArc.path} />
            {segmentTicks(proofPointA, proofPointB, 1, "proof-ab", "#1f5fbf")}
            {segmentTicks(proofPointA, proofPointC, 2, "proof-ac", "#c25b2a")}
            {segmentTicks(proofPointA, proofPointG, 2, "proof-ag", "#c25b2a")}

            {showRoutePlan ? (
              <>
                <line className="hinge-theorem__route-plan" x1={proofPointB.x} x2={proofPointH.x} y1={proofPointB.y} y2={proofPointH.y} />
                <line className="hinge-theorem__route-plan" x1={proofPointH.x} x2={proofPointG.x} y1={proofPointH.y} y2={proofPointG.y} />
                <StaticPoint className="hinge-theorem__point hinge-theorem__point--planned" point={proofPointH} label="H?" labelOffset={{ x: 10, y: -7 }} radius={4.5} />
              </>
            ) : null}

            {showBisector ? (
              <>
                <line className="hinge-theorem__bisector" x1={proofPointA.x} x2={proofPointH.x} y1={proofPointA.y} y2={proofPointH.y} />
                <path className="hinge-theorem__angle hinge-theorem__angle--half" d={proofHalfArcOne.path} />
                <path className="hinge-theorem__angle hinge-theorem__angle--half" d={proofHalfArcTwo.path} />
                <StaticPoint className="hinge-theorem__point hinge-theorem__point--constructed" point={proofPointH} label="H" labelOffset={{ x: 9, y: -7 }} radius={4.5} />
              </>
            ) : null}

            {showSmallSas ? (
              <>
                <line className="hinge-theorem__small-match" x1={proofPointG.x} x2={proofPointH.x} y1={proofPointG.y} y2={proofPointH.y} />
                <line className="hinge-theorem__small-match" x1={proofPointH.x} x2={proofPointC.x} y1={proofPointH.y} y2={proofPointC.y} />
                {segmentTicks(proofPointG, proofPointH, 3, "proof-gh", "#23805a")}
                {segmentTicks(proofPointH, proofPointC, 3, "proof-hc", "#23805a")}
              </>
            ) : null}

            <StaticPoint className="hinge-theorem__point" point={proofPointA} label="A" labelOffset={{ x: -2, y: 18 }} />
            <StaticPoint className="hinge-theorem__point" point={proofPointB} label="B" labelOffset={{ x: 3, y: 18 }} />
            <StaticPoint className="hinge-theorem__point" point={proofPointC} label="C" labelOffset={{ x: -9, y: -9 }} />
            <StaticPoint className="hinge-theorem__point hinge-theorem__point--copied" point={proofPointG} label="G" labelOffset={{ x: 10, y: -8 }} />
          </>
        ) : null}
      </SvgCanvas>

      {isExploring ? (
        <div className="hinge-theorem__controls">
          <label className="hinge-theorem__control" htmlFor={abcControlId}>
            <span><strong>Angle in △ABC</strong><span>{angleABC}°</span></span>
            <input aria-valuetext={`${angleABC} degrees`} id={abcControlId} max={maximumAngle} min={minimumAngle} onChange={(event) => setAngleABC(Number(event.target.value))} type="range" value={angleABC} />
          </label>
          <label className="hinge-theorem__control" htmlFor={defControlId}>
            <span><strong>Angle in △DEF</strong><span>{angleDEF}°</span></span>
            <input aria-valuetext={`${angleDEF} degrees`} id={defControlId} max={maximumAngle} min={minimumAngle} onChange={(event) => setAngleDEF(Number(event.target.value))} type="range" value={angleDEF} />
          </label>
        </div>
      ) : (
        <div className="theorem-measure hinge-theorem__proof-summary">
          <strong>{currentStep.title}</strong>
          <span>{currentStep.status}</span>
        </div>
      )}

      {showRoutePlan ? (
        <div className="hinge-theorem__route-question" aria-label="Triangle inequality route plan">
          <strong>BG &lt; BH + HG</strong>
          <span>If HG ≅ HC, then BH + HG becomes BC. Can we construct such an H?</span>
        </div>
      ) : null}

      {showInequality ? (
        <div className="hinge-theorem__equation" aria-label="Triangle inequality substitution">
          <strong>BG &lt; BH + HG = BH + HC = BC</strong>
          <span>Since BG ≅ EF, it follows that BC &gt; EF.</span>
        </div>
      ) : null}

      <p aria-live="polite" className={classNames("hinge-theorem__status", !isExploring && "hinge-theorem__status--proof")}>{discovery.status}</p>
    </div>
  );
}

export function HingeConverseCorollaryIllustration() {
  const titleId = useId();
  const descriptionId = useId();
  const pointA = { x: 166, y: 258 };
  const pointB = { x: 22, y: 258 };
  const pointC = polarPoint(pointA, 128, Math.PI + degreesToRadians(112));
  const pointD = { x: 474, y: 258 };
  const pointE = { x: 618, y: 258 };
  const pointF = polarPoint(pointD, 128, -degreesToRadians(52));
  const largerArc = circularArc(
    pointA,
    28,
    Math.PI,
    degreesToRadians(112),
    43,
  );
  const smallerArc = circularArc(
    pointD,
    28,
    0,
    -degreesToRadians(52),
    43,
  );

  return (
    <figure className="hinge-theorem-corollary">
      <SvgCanvas
        descriptionId={descriptionId}
        description="Triangles ABC and DEF have matching blue and orange arm pairs. The purple third side BC is longer than EF, and the included angle BAC is correspondingly larger than angle EDF."
        titleId={titleId}
        title="Converse Hinge Theorem comparison"
        className="hinge-theorem-corollary__svg"
        viewBox="0 0 640 300"
      >
        <line className="hinge-theorem-corollary__arm hinge-theorem-corollary__arm--first" x1={pointA.x} x2={pointB.x} y1={pointA.y} y2={pointB.y} />
        <line className="hinge-theorem-corollary__arm hinge-theorem-corollary__arm--second" x1={pointA.x} x2={pointC.x} y1={pointA.y} y2={pointC.y} />
        <line className="hinge-theorem-corollary__base hinge-theorem-corollary__base--longer" x1={pointB.x} x2={pointC.x} y1={pointB.y} y2={pointC.y} />
        <path className="hinge-theorem-corollary__angle hinge-theorem-corollary__angle--larger" d={largerArc.path} />

        <line className="hinge-theorem-corollary__arm hinge-theorem-corollary__arm--first" x1={pointD.x} x2={pointE.x} y1={pointD.y} y2={pointE.y} />
        <line className="hinge-theorem-corollary__arm hinge-theorem-corollary__arm--second" x1={pointD.x} x2={pointF.x} y1={pointD.y} y2={pointF.y} />
        <line className="hinge-theorem-corollary__base" x1={pointE.x} x2={pointF.x} y1={pointE.y} y2={pointF.y} />
        <path className="hinge-theorem-corollary__angle" d={smallerArc.path} />

        {segmentTicks(pointA, pointB, 1, "corollary-ab", "#1f5fbf")}
        {segmentTicks(pointD, pointE, 1, "corollary-de", "#1f5fbf")}
        {segmentTicks(pointA, pointC, 2, "corollary-ac", "#c25b2a")}
        {segmentTicks(pointD, pointF, 2, "corollary-df", "#c25b2a")}

        {[
          { dx: 0, dy: 22, label: "A", point: pointA },
          { dx: -5, dy: 22, label: "B", point: pointB },
          { dx: 0, dy: -14, label: "C", point: pointC },
          { dx: 0, dy: 22, label: "D", point: pointD },
          { dx: 5, dy: 22, label: "E", point: pointE },
          { dx: 0, dy: -14, label: "F", point: pointF },
        ].map(({ dx, dy, label, point }) => (
          <StaticPoint
            className="hinge-theorem-corollary__point"
            key={label}
            point={point}
            label={label}
            labelOffset={{ x: dx, y: dy }}
          />
        ))}

        <text className="hinge-theorem-corollary__comparison" x="320" y="293">BC &gt; EF</text>
      </SvgCanvas>
    </figure>
  );
}
