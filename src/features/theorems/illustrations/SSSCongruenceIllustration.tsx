import { useEffect, useId, useState } from "react";
import "./styles/sss-congruence.css";

import {
  angleFrom,
  circleIntersections,
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

type SSSCongruenceIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type RayOrderCase = "inside" | "outside-b" | "collinear";

type ProofStep = TheoremDiscovery & {
  status: string;
};

type ArcData = {
  path: string;
};

type CaseCard = {
  detail: string;
  equationOne: string;
  equationTwo: string;
  id: RayOrderCase;
  title: string;
};

const blue = "#1f5fbf";
const orange = "#c25b2a";
const green = "#23805a";

const freeBaseY = 154;
const freePointB = { x: 38, y: freeBaseY };
const freePointC = { x: 132, y: freeBaseY };
const freePointE = { x: 188, y: freeBaseY };
const freePointF = { x: 282, y: freeBaseY };
const minimumApexX = 18;
const maximumApexX = 152;
const minimumHeight = 34;
const maximumHeight = 86;
const initialApexX = 85;
const initialHeight = 64;
const handleRadius = 24;

const stepOnePointA = { x: 30, y: 182 };
const stepOnePointB = { x: 64, y: 78 };
const stepOnePointC = { x: 150, y: 78 };
const stepOnePointD = { x: 170, y: 182 };
const stepOnePointE = { x: 204, y: 78 };
const stepOnePointF = { x: 290, y: 78 };

const stepTwoPointD = stepOnePointA;
const stepTwoPointE = stepOnePointB;
const stepTwoPointF = stepOnePointC;
const stepTwoPointG = stepOnePointD;
const stepTwoPointB = stepOnePointE;
const stepTwoPointC = stepOnePointF;

const proofPointA = { x: 28, y: 36 };
const proofPointB = { x: 64, y: 112 };
const proofPointC = { x: 268, y: 112 };
const proofPointG = { x: proofPointA.x, y: 188 };
const proofCaseApexX: Record<RayOrderCase, number> = {
  inside: 132,
  "outside-b": proofPointA.x,
  collinear: proofPointB.x,
};

const proofSteps: ProofStep[] = [
  {
    insight:
      "The theorem begins with only three side matches. The tick marks record the correspondence AB ↔ DE, BC ↔ EF, and AC ↔ DF, but no angle match has been proved yet.",
    prompt:
      "Read the three side correspondences and the target triangle correspondence. Treat the congruence claim as the goal, not as something the picture already proves.",
    status: "AB ≅ DE, BC ≅ EF, and AC ≅ DF. Prove △ABC ≅ △DEF.",
    title: "Name the SSS data",
  },
  {
    insight:
      "A copied included angle and two copied sides create triangle GBC as a certified SAS copy of DEF. That turns one side of the original SSS data into GC ≅ DF.",
    prompt:
      "Follow the copied angle at B and the two matched side pairs BC ↔ EF and BG ↔ DE. The step uses SAS, not physical motion or superposition.",
    status: "Copy ∠DEF at B and copy DE onto ray BG. SAS gives △GBC ≅ △DEF, so GC ≅ DF.",
    title: "Make a SAS copy at BC",
  },
  {
    insight:
      "The copied side matches give AB ≅ BG and AC ≅ GC. Usually they make two isosceles triangles sharing AG; if one auxiliary figure is collinear, only the other is a triangle.",
    prompt:
      "The diagram shows the noncollinear branch. The written proof separately handles A, B, G collinear and A, C, G collinear before applying a triangle theorem.",
    status: "AB ≅ BG and AC ≅ GC; apply isosceles facts only to nondegenerate auxiliary triangles.",
    title: "Draw AG and identify the cases",
  },
  {
    insight:
      "Each nondegenerate isosceles triangle contributes one pair of equal base angles along AG. A collinear boundary case uses only the pair from the other triangle.",
    prompt:
      "The shown branch has both pairs. In the written proof, never apply Isosceles Base-Angles to a collinear auxiliary figure.",
    status: "Use ∠BAG ≅ ∠AGB and/or ∠CAG ≅ ∠AGC only where the corresponding triangle is nondegenerate.",
    title: "Match only valid base angles",
  },
  {
    insight:
      "The collinear cases identify the target angles directly using the one valid base-angle pair. In the noncollinear case, ray order determines whether the two pairs combine by addition or subtraction.",
    prompt:
      "Use the three case buttons to compare the inside/addition configuration, one representative outside/subtraction configuration at B, and the collinear boundary. The cases at C are symmetric.",
    status: "The valid base-angle equalities make ∠BAC ≅ ∠BGC in the collinear and noncollinear cases.",
    title: "Recover the included angle",
  },
  {
    insight:
      "With AB ≅ BG, AC ≅ GC, and the included angles matched, SAS proves △ABC ≅ △GBC. Chaining that with the earlier SAS copy finishes the theorem.",
    prompt:
      "Read the final argument in two links: first the common-base SAS pair △ABC and △GBC, then transitivity with △GBC ≅ △DEF.",
    status: "SAS gives △ABC ≅ △GBC, and transitivity gives △ABC ≅ △DEF.",
    title: "Finish with SAS and transitivity",
  },
];

const caseCards: CaseCard[] = [
  {
    detail: "AG lies inside both included angles.",
    equationOne: "∠BAC = ∠BAG + ∠GAC",
    equationTwo: "∠BGC = ∠BGA + ∠AGC",
    id: "inside",
    title: "Inside both angles",
  },
  {
    detail: "AG lies beyond ray AB; the outside case at C is symmetric.",
    equationOne: "∠BAC = ∠CAG - ∠BAG",
    equationTwo: "∠BGC = ∠AGC - ∠AGB",
    id: "outside-b",
    title: "Outside at B",
  },
  {
    detail: "A, B, and G are collinear; triangle ACG supplies ∠GAC ≅ ∠AGC.",
    equationOne: "∠BAC = ∠GAC",
    equationTwo: "∠BGC = ∠AGC",
    id: "collinear",
    title: "Collinear at B",
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
): ArcData {
  const start = normalizeRadians(angleFrom(vertex, first));
  const end = normalizeRadians(angleFrom(vertex, second));
  const forward = normalizeRadians(end - start);
  const delta = forward <= Math.PI ? forward : forward - Math.PI * 2;
  const arcEnd = start + delta;
  const startPoint = polarPoint(vertex, radius, start);
  const endPoint = polarPoint(vertex, radius, arcEnd);

  return {
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
  const length = Math.hypot(dx, dy) || 1;
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

function caseStatus(rayOrderCase: RayOrderCase) {
  switch (rayOrderCase) {
    case "outside-b":
      return "Outside at B: AG lies beyond ray AB, so congruent angle pairs give equal differences. The outside case at C is symmetric.";
    case "collinear":
      return "Collinear at B: rays AB and AG agree, as do rays GB and GA. The one valid base-angle pair from triangle ACG gives ∠BAC ≅ ∠BGC.";
    default:
      return "Inside: AG lies inside both included angles, so congruent angle pairs give equal sums.";
  }
}

function horizontalPositionLabel(apexX: number) {
  if (apexX < freePointB.x) {
    return "left of B";
  }
  if (apexX > freePointC.x) {
    return "right of C";
  }
  return "between B and C";
}

function heightLabel(height: number) {
  const range = maximumHeight - minimumHeight;
  if (height < minimumHeight + range / 3) {
    return "near BC";
  }
  if (height > maximumHeight - range / 3) {
    return "high above BC";
  }
  return "middle height";
}

export function SSSCongruenceIllustration({
  activeStep,
  onDiscoveryChange,
}: SSSCongruenceIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const horizontalControlId = useId();
  const heightControlId = useId();
  const [apexX, setApexX] = useState(initialApexX);
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRayOrderCase, setSelectedRayOrderCase] =
    useState<RayOrderCase>("inside");

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentStep = proofSteps[proofStep] ?? proofSteps[0];

  const freePointA = { x: apexX, y: freeBaseY - height };
  const freeAB = distance(freePointA, freePointB);
  const freeAC = distance(freePointA, freePointC);
  const freeTargetIntersections = circleIntersections(
    freePointE,
    freeAB,
    freePointF,
    freeAC,
  );
  const freePointD =
    freeTargetIntersections.sort((first, second) => first.y - second.y)[0] ?? {
      x: freePointE.x + (freePointA.x - freePointB.x),
      y: freePointA.y,
    };
  const explorationDiscovery: ProofStep = {
    insight:
      "Triangle DEF is reconstructed separately from the three side lengths of triangle ABC. Point D is the chosen upper intersection of circles centered at E and F with radii AB and AC, so all three corresponding side pairs remain exact.",
    prompt:
      "Drag A or use the sliders. Watch the separated triangle DEF reconstruct while the one-, two-, and three-tick side pairs continue to match.",
    status: `AB = DE = ${formatLength(freeAB)}, AC = DF = ${formatLength(freeAC)}, and BC = EF = ${formatLength(distance(freePointB, freePointC))}. The separated reconstruction illustrates SSS rigidity; the guided states prove it.`,
    title: "Reconstruct a separate triangle from three sides",
  };
  const selectedCaseCard =
    caseCards.find((card) => card.id === selectedRayOrderCase) ?? caseCards[0];
  const selectedCaseDiscovery: ProofStep = {
    ...currentStep,
    prompt: `${selectedCaseCard.title} is selected. Compare its two displayed equations with the highlighted ray order, then choose another case.`,
    status: caseStatus(selectedRayOrderCase),
  };
  const discovery = isExploring
    ? explorationDiscovery
    : proofStep === 4
      ? selectedCaseDiscovery
      : currentStep;

  useEffect(() => {
    onDiscoveryChange({
      insight: discovery.insight,
      prompt: discovery.prompt,
      title: discovery.title,
    });
  }, [discovery.insight, discovery.prompt, discovery.title, onDiscoveryChange]);

  const updateApex = (point: Point) => {
    setApexX(Math.round(clamp(point.x, minimumApexX, maximumApexX)));
    setHeight(
      Math.round(clamp(freeBaseY - point.y, minimumHeight, maximumHeight)),
    );
  };

  const freeABLabel = outsideSegmentLabel(freePointA, freePointB, freePointC, 14);
  const freeACLabel = outsideSegmentLabel(freePointA, freePointC, freePointB, 14);
  const freeBCLabel = outsideSegmentLabel(freePointB, freePointC, freePointA, 14);

  const selectedProofPointA = {
    x: proofCaseApexX[selectedRayOrderCase],
    y: proofPointA.y,
  };
  const selectedProofPointG = {
    x: proofCaseApexX[selectedRayOrderCase],
    y: proofPointG.y,
  };
  const guidedPointA = proofStep === 4 ? selectedProofPointA : proofPointA;
  const guidedPointG = proofStep === 4 ? selectedProofPointG : proofPointG;

  const stepTwoAngleE = minorArc(stepTwoPointE, stepTwoPointD, stepTwoPointF, 18);
  const stepTwoAngleB = minorArc(stepTwoPointB, stepTwoPointG, stepTwoPointC, 18);

  const proofAngleBAG = minorArc(guidedPointA, proofPointB, guidedPointG, 16);
  const proofAngleAGB = minorArc(guidedPointG, guidedPointA, proofPointB, 16);
  const proofAngleCAG = minorArc(guidedPointA, proofPointC, guidedPointG, 24);
  const proofAngleAGC = minorArc(guidedPointG, guidedPointA, proofPointC, 24);
  const proofIncludedA = minorArc(guidedPointA, proofPointB, proofPointC, 34);
  const proofIncludedG = minorArc(guidedPointG, proofPointB, proofPointC, 34);

  const figureDescription = isExploring
    ? `SSS free exploration. Triangle ABC is draggable in the left panel. The separate triangle DEF is reconstructed in the right panel from DE equal to AB, DF equal to AC, and EF equal to BC. ${explorationDiscovery.status}`
    : proofStep === 0
      ? "SSS Congruence guided proof step 1. Triangles ABC and DEF are shown side by side with one-, two-, and three-tick side correspondences, and the target is triangle congruence."
      : proofStep === 1
        ? "SSS Congruence guided proof step 2. Triangle DEF appears beside the constructed triangle GBC. Matching side pairs and the copied included angle certify a SAS copy."
        : proofStep === 2
          ? "SSS Congruence guided proof step 3. A common-base construction shows triangles ABG and ACG with AG drawn and the equal side pairs AB to BG and AC to GC highlighted."
          : proofStep === 3
            ? "SSS Congruence guided proof step 4. This noncollinear common-base branch highlights both isosceles base-angle pairs; the written proof uses only the valid pair in either collinear boundary case."
            : proofStep === 4
              ? `SSS Congruence guided proof step 5. ${selectedCaseCard.title} is selected, so the enlarged common-base construction and highlighted included angles display that proof case. The three buttons select the inside, representative outside-at-B, and collinear configurations.`
              : "SSS Congruence guided proof step 6. The common-base construction highlights triangles ABC and GBC as the final SAS pair, then the congruence chain reaches triangle DEF by transitivity.";

  const renderGuidedCommonBase = () => {
    const pointA = guidedPointA;
    const pointB = proofPointB;
    const pointC = proofPointC;
    const pointG = guidedPointG;
    const showGuidedBaseMatches = proofStep >= 2;
    const showGuidedAnglePairs = proofStep >= 3;
    const showIncludedAngles = proofStep >= 4;
    const showFinalHighlight = proofStep >= 5;

    return (
      <>
        {showFinalHighlight ? (
          <>
            <polygon
              className="sss-congruence__triangle-fill sss-congruence__triangle-fill--upper"
              points={`${pointA.x},${pointA.y} ${pointB.x},${pointB.y} ${pointC.x},${pointC.y}`}
            />
            <polygon
              className="sss-congruence__triangle-fill sss-congruence__triangle-fill--lower"
              points={`${pointG.x},${pointG.y} ${pointB.x},${pointB.y} ${pointC.x},${pointC.y}`}
            />
          </>
        ) : null}

        <line
          className={classNames(
            "sss-congruence__side sss-congruence__side--first",
            proofStep === 4 && "sss-congruence__side--muted",
          )}
          x1={pointA.x}
          x2={pointB.x}
          y1={pointA.y}
          y2={pointB.y}
        />
        <line
          className={classNames(
            "sss-congruence__side sss-congruence__side--second",
            proofStep === 4 && "sss-congruence__side--muted",
          )}
          x1={pointA.x}
          x2={pointC.x}
          y1={pointA.y}
          y2={pointC.y}
        />
        <line
          className={classNames(
            "sss-congruence__side sss-congruence__side--first",
            proofStep === 4 && "sss-congruence__side--muted",
          )}
          x1={pointG.x}
          x2={pointB.x}
          y1={pointG.y}
          y2={pointB.y}
        />
        <line
          className={classNames(
            "sss-congruence__side sss-congruence__side--second",
            proofStep === 4 && "sss-congruence__side--muted",
          )}
          x1={pointG.x}
          x2={pointC.x}
          y1={pointG.y}
          y2={pointC.y}
        />
        <line
          className={classNames(
            "sss-congruence__shared-base",
            showFinalHighlight && "sss-congruence__shared-base--emphasis",
          )}
          x1={pointB.x}
          x2={pointC.x}
          y1={pointB.y}
          y2={pointC.y}
        />

        {segmentTicks(pointA, pointB, 1, "proof-ab", blue)}
        {segmentTicks(pointG, pointB, 1, "proof-gb", blue)}
        {segmentTicks(pointA, pointC, 2, "proof-ac", orange)}
        {segmentTicks(pointG, pointC, 2, "proof-gc", orange)}
        {segmentTicks(pointB, pointC, 3, "proof-bc", green)}

        {showGuidedBaseMatches ? (
          <line className="sss-congruence__connector" x1={pointA.x} x2={pointG.x} y1={pointA.y} y2={pointG.y} />
        ) : null}

        {showGuidedAnglePairs ? (
          <>
            <path className="sss-congruence__base-angle sss-congruence__base-angle--first" d={proofAngleBAG.path} />
            <path className="sss-congruence__base-angle sss-congruence__base-angle--first" d={proofAngleAGB.path} />
            <path className="sss-congruence__base-angle sss-congruence__base-angle--second" d={proofAngleCAG.path} />
            <path className="sss-congruence__base-angle sss-congruence__base-angle--second" d={proofAngleAGC.path} />
          </>
        ) : null}

        {showIncludedAngles ? (
          <>
            <path className="sss-congruence__included-angle" d={proofIncludedA.path} />
            <path className="sss-congruence__included-angle" d={proofIncludedG.path} />
          </>
        ) : null}

        <StaticPoint className="sss-congruence__point" point={pointA} label="A" labelOffset={{ x: 0, y: -12 }} radius={4.5} />
        <StaticPoint className="sss-congruence__point" point={pointB} label="B" labelOffset={{ x: -2, y: 18 }} radius={4.5} />
        <StaticPoint className="sss-congruence__point" point={pointC} label="C" labelOffset={{ x: 4, y: 18 }} radius={4.5} />
        <StaticPoint className="sss-congruence__point sss-congruence__point--constructed" point={pointG} label="G" labelOffset={{ x: 0, y: 20 }} radius={4.5} />

        {showFinalHighlight ? (
          <>
            <text className="sss-congruence__triangle-name" x={158} y={62}>△ABC</text>
            <text className="sss-congruence__triangle-name" x={158} y={174}>△GBC</text>
          </>
        ) : null}
      </>
    );
  };

  return (
    <div className="theorem-figure sss-congruence">
      <SvgCanvas
        descriptionId={descriptionId}
        description={figureDescription}
        titleId={titleId}
        title={isExploring ? "SSS Congruence exploration" : `SSS Congruence: ${currentStep.title}`}
        className="sss-congruence__svg"
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
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {isExploring ? (
          <>
            <text className="sss-congruence__panel-name" x="85" y="20">
              Choose △ABC
            </text>
            <text className="sss-congruence__panel-name" x="235" y="20">
              Reconstruct △DEF
            </text>

            <line className="sss-congruence__side sss-congruence__side--first" x1={freePointA.x} x2={freePointB.x} y1={freePointA.y} y2={freePointB.y} />
            <line className="sss-congruence__side sss-congruence__side--second" x1={freePointA.x} x2={freePointC.x} y1={freePointA.y} y2={freePointC.y} />
            <line className="sss-congruence__shared-base" x1={freePointB.x} x2={freePointC.x} y1={freePointB.y} y2={freePointC.y} />

            <line className="sss-congruence__side sss-congruence__side--first" x1={freePointD.x} x2={freePointE.x} y1={freePointD.y} y2={freePointE.y} />
            <line className="sss-congruence__side sss-congruence__side--second" x1={freePointD.x} x2={freePointF.x} y1={freePointD.y} y2={freePointF.y} />
            <line className="sss-congruence__shared-base" x1={freePointE.x} x2={freePointF.x} y1={freePointE.y} y2={freePointF.y} />

            {segmentTicks(freePointA, freePointB, 1, "free-ab", blue)}
            {segmentTicks(freePointD, freePointE, 1, "free-de", blue)}
            {segmentTicks(freePointA, freePointC, 2, "free-ac", orange)}
            {segmentTicks(freePointD, freePointF, 2, "free-df", orange)}
            {segmentTicks(freePointB, freePointC, 3, "free-bc", green)}
            {segmentTicks(freePointE, freePointF, 3, "free-ef", green)}

            {[
              { point: freePointB, label: "B", offset: { x: -3, y: 18 } },
              { point: freePointC, label: "C", offset: { x: 4, y: 18 } },
              { point: freePointD, label: "D", offset: { x: 0, y: -12 }, isConstructed: true },
              { point: freePointE, label: "E", offset: { x: -3, y: 18 } },
              { point: freePointF, label: "F", offset: { x: 4, y: 18 } },
            ].map(({ point, label, offset, isConstructed }, index) => (
              <StaticPoint
                className={classNames(
                  "sss-congruence__point",
                  isConstructed && "sss-congruence__point--constructed",
                )}
                point={point}
                label={label}
                labelOffset={offset}
                key={`free-point-${index}`}
                radius={4.5}
              />
            ))}

            <text className="sss-congruence__measurement sss-congruence__measurement--first" x={freeABLabel.x} y={freeABLabel.y}>
              {formatLength(freeAB)}
            </text>
            <text className="sss-congruence__measurement sss-congruence__measurement--second" x={freeACLabel.x} y={freeACLabel.y}>
              {formatLength(freeAC)}
            </text>
            <text className="sss-congruence__measurement sss-congruence__measurement--shared" x={freeBCLabel.x} y={freeBCLabel.y}>
              {formatLength(distance(freePointB, freePointC))}
            </text>

            <DraggablePoint
              hitRadius={handleRadius}
              label="A"
              labelOffset={{ x: 0, y: -12 }}
              onDrag={(p) => updateApex(p)}
              onDragEnd={() => setIsDragging(false)}
              onDragStart={() => setIsDragging(true)}
              point={freePointA}
              radius={7}
              className={classNames("sss-congruence__handle", isDragging && "sss-congruence__handle--active")}
              showLabel={true}
            />
          </>
        ) : null}

        {!isExploring && proofStep === 0 ? (
          <>
            <text className="sss-congruence__panel-name" x="90" y="26">Given triangle ABC</text>
            <text className="sss-congruence__panel-name" x="230" y="26">Given triangle DEF</text>

            <line className="sss-congruence__side sss-congruence__side--first" x1={stepOnePointA.x} x2={stepOnePointB.x} y1={stepOnePointA.y} y2={stepOnePointB.y} />
            <line className="sss-congruence__shared-base" x1={stepOnePointB.x} x2={stepOnePointC.x} y1={stepOnePointB.y} y2={stepOnePointC.y} />
            <line className="sss-congruence__side sss-congruence__side--second" x1={stepOnePointA.x} x2={stepOnePointC.x} y1={stepOnePointA.y} y2={stepOnePointC.y} />

            <line className="sss-congruence__side sss-congruence__side--first" x1={stepOnePointD.x} x2={stepOnePointE.x} y1={stepOnePointD.y} y2={stepOnePointE.y} />
            <line className="sss-congruence__shared-base" x1={stepOnePointE.x} x2={stepOnePointF.x} y1={stepOnePointE.y} y2={stepOnePointF.y} />
            <line className="sss-congruence__side sss-congruence__side--second" x1={stepOnePointD.x} x2={stepOnePointF.x} y1={stepOnePointD.y} y2={stepOnePointF.y} />

            {segmentTicks(stepOnePointA, stepOnePointB, 1, "step1-ab", blue)}
            {segmentTicks(stepOnePointD, stepOnePointE, 1, "step1-de", blue)}
            {segmentTicks(stepOnePointA, stepOnePointC, 2, "step1-ac", orange)}
            {segmentTicks(stepOnePointD, stepOnePointF, 2, "step1-df", orange)}
            {segmentTicks(stepOnePointB, stepOnePointC, 3, "step1-bc", green)}
            {segmentTicks(stepOnePointE, stepOnePointF, 3, "step1-ef", green)}

            {[
              { point: stepOnePointA, label: "A", offset: { x: 0, y: 20 } },
              { point: stepOnePointB, label: "B", offset: { x: -2, y: -12 } },
              { point: stepOnePointC, label: "C", offset: { x: 4, y: -12 } },
              { point: stepOnePointD, label: "D", offset: { x: 0, y: 20 } },
              { point: stepOnePointE, label: "E", offset: { x: -2, y: -12 } },
              { point: stepOnePointF, label: "F", offset: { x: 6, y: -12 } },
            ].map(({ point, label, offset }, index) => (
              <StaticPoint
                className="sss-congruence__point"
                point={point}
                label={label}
                labelOffset={offset}
                key={`step1-point-${index}`}
                radius={4.5}
              />
            ))}

            <text className="sss-congruence__triangle-name" x="86" y="206">△ABC</text>
            <text className="sss-congruence__triangle-name" x="224" y="206">△DEF</text>
          </>
        ) : null}

        {!isExploring && proofStep === 1 ? (
          <>
            <text className="sss-congruence__panel-name" x="92" y="26">Given triangle DEF</text>
            <text className="sss-congruence__panel-name" x="238" y="26">Constructed triangle GBC</text>

            <line className="sss-congruence__side sss-congruence__side--first" x1={stepTwoPointD.x} x2={stepTwoPointE.x} y1={stepTwoPointD.y} y2={stepTwoPointE.y} />
            <line className="sss-congruence__shared-base" x1={stepTwoPointE.x} x2={stepTwoPointF.x} y1={stepTwoPointE.y} y2={stepTwoPointF.y} />
            <line className="sss-congruence__side sss-congruence__side--second" x1={stepTwoPointD.x} x2={stepTwoPointF.x} y1={stepTwoPointD.y} y2={stepTwoPointF.y} />
            <path className="sss-congruence__copied-angle" d={stepTwoAngleE.path} />

            <line className="sss-congruence__side sss-congruence__side--first" x1={stepTwoPointB.x} x2={stepTwoPointG.x} y1={stepTwoPointB.y} y2={stepTwoPointG.y} />
            <line className="sss-congruence__shared-base" x1={stepTwoPointB.x} x2={stepTwoPointC.x} y1={stepTwoPointB.y} y2={stepTwoPointC.y} />
            <line className="sss-congruence__side sss-congruence__side--second" x1={stepTwoPointG.x} x2={stepTwoPointC.x} y1={stepTwoPointG.y} y2={stepTwoPointC.y} />
            <path className="sss-congruence__copied-angle" d={stepTwoAngleB.path} />

            {segmentTicks(stepTwoPointD, stepTwoPointE, 1, "step2-de", blue)}
            {segmentTicks(stepTwoPointB, stepTwoPointG, 1, "step2-bg", blue)}
            {segmentTicks(stepTwoPointE, stepTwoPointF, 3, "step2-ef", green)}
            {segmentTicks(stepTwoPointB, stepTwoPointC, 3, "step2-bc", green)}

            {[
              { point: stepTwoPointD, label: "D", offset: { x: -2, y: 20 } },
              { point: stepTwoPointE, label: "E", offset: { x: -4, y: -12 } },
              { point: stepTwoPointF, label: "F", offset: { x: 6, y: -12 } },
              { point: stepTwoPointB, label: "B", offset: { x: -2, y: -12 } },
              { point: stepTwoPointC, label: "C", offset: { x: 6, y: -12 } },
              { point: stepTwoPointG, label: "G", offset: { x: -4, y: 20 }, isConstructed: true },
            ].map(({ point, label, offset, isConstructed }, index) => (
              <StaticPoint
                className={classNames(
                  "sss-congruence__point",
                  isConstructed && "sss-congruence__point--constructed",
                )}
                point={point}
                label={label}
                labelOffset={offset}
                key={`step2-point-${index}`}
                radius={4.5}
              />
            ))}

            <text className="sss-congruence__triangle-name" x="92" y="206">△DEF</text>
            <text className="sss-congruence__triangle-name" x="234" y="206">△GBC</text>
          </>
        ) : null}

        {!isExploring && proofStep >= 2 ? renderGuidedCommonBase() : null}
      </SvgCanvas>

      {isExploring ? (
        <div className="theorem-figure__summary sss-congruence__summary">
          <div className="theorem-measure theorem-measure--accent">
            <strong>SSS inputs</strong>
            <span>
              AB = {formatLength(freeAB)}, AC = {formatLength(freeAC)}, and BC = {formatLength(distance(freePointB, freePointC))}.
              These are copied as DE, DF, and EF.
            </span>
          </div>
          <div className="theorem-measure theorem-measure--secondary">
            <strong>Reconstructed result</strong>
            <span>
              DE = {formatLength(distance(freePointD, freePointE))}, DF = {formatLength(distance(freePointD, freePointF))}, and EF = {formatLength(distance(freePointE, freePointF))}.
            </span>
          </div>
        </div>
      ) : (
        <div className="theorem-measure sss-congruence__proof-summary">
          <strong>{currentStep.title}</strong>
          <span>{discovery.status}</span>
        </div>
      )}

      {!isExploring && proofStep === 1 ? (
        <div className="sss-congruence__copy-result" aria-label="SAS copy conclusion">
          <strong>△GBC ≅ △DEF by SAS</strong>
          <span>Therefore the remaining corresponding sides satisfy GC ≅ DF.</span>
        </div>
      ) : null}

      {!isExploring && proofStep === 4 ? (
        <div aria-label="Ray-order case equations" className="sss-congruence__cases" role="group">
          {caseCards.map((card) => (
            <button
              aria-pressed={card.id === selectedRayOrderCase}
              className={classNames(
                "sss-congruence__case-card",
                card.id === selectedRayOrderCase && "sss-congruence__case-card--shown",
              )}
              key={card.id}
              onClick={() => setSelectedRayOrderCase(card.id)}
              type="button"
            >
              <span className="sss-congruence__case-card-header">
                <strong>{card.title}</strong>
                {card.id === selectedRayOrderCase ? (
                  <span className="sss-congruence__case-badge">shown above</span>
                ) : null}
              </span>
              <span>{card.detail}</span>
              <code>{card.equationOne}</code>
              <code>{card.equationTwo}</code>
            </button>
          ))}
        </div>
      ) : null}

      {!isExploring && proofStep === 5 ? (
        <div className="sss-congruence__chain" aria-label="Final congruence chain">
          <strong>△ABC ≅ △GBC ≅ △DEF</strong>
          <span>The first link is SAS on the common-base construction; the second link came from Step 2.</span>
        </div>
      ) : null}

      {isExploring ? (
        <div className="sss-congruence__controls">
          <label className="sss-congruence__control" htmlFor={horizontalControlId}>
            <span>
              <strong>Move A left or right</strong>
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
          <label className="sss-congruence__control" htmlFor={heightControlId}>
            <span>
              <strong>Move A toward or away from BC</strong>
              <span>{heightLabel(height)}</span>
            </span>
            <input
              aria-valuetext={heightLabel(height)}
              id={heightControlId}
              max={maximumHeight}
              min={minimumHeight}
              onChange={(event) => setHeight(Number(event.target.value))}
              type="range"
              value={height}
            />
          </label>
        </div>
      ) : null}

      <p
        aria-live="polite"
        className={classNames(
          "sss-congruence__status",
          !isExploring && "sss-congruence__status--proof",
        )}
      >
        {discovery.status}
      </p>
    </div>
  );
}
