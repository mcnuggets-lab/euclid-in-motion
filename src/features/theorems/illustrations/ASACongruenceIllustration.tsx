import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/asa-congruence.css";

import {
  angleBetweenPoints,
  constrainApexToBounds,
  intersectRays,
  minorArcPath,
  type Point,
} from "@/features/geometry/geometryPrimitives";
import {
  classNames,
  distance,
  formatDisplayNumber,
  getSvgCoordinates,
  hatchMark,
  lineEndpointsFromPoints,
  midpoint,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";
import { TriangleApexControls } from "@/features/theorems/illustrations/TriangleApexControls";

type ASACongruenceIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ProofStep = TheoremDiscovery & {
  status: string;
};

const blue = "#1f5fbf";
const green = "#23805a";

const freeBaseY = 156;
const sourcePointB = { x: 24, y: freeBaseY };
const sourcePointC = { x: 140, y: freeBaseY };
const sourceBaseLength = distance(sourcePointB, sourcePointC);
const targetPointE = { x: 176, y: freeBaseY };
const targetPointF = { x: 292, y: freeBaseY };

const apexBounds = {
  maximumHeight: 108,
  maximumX: 148,
  minimumHeight: 54,
  minimumX: 16,
};
const initialApexX = 82;
const initialHeight = 88;
const handleRadius = 24;

const proofSteps: ProofStep[] = [
  {
    insight:
      "The two angle pairs and the side between them are the only givens. The unmarked sides are conclusions to be proved, not measurements to trust from the drawing.",
    prompt:
      "Match the one-arc angles, the two-arc angles, and the green included sides. Read the ordered correspondence A ↔ D, B ↔ E, C ↔ F.",
    status: "∠ABC ≅ ∠DEF, BC ≅ EF, and ∠ACB ≅ ∠DFE. Prove △ABC ≅ △DEF.",
    title: "Name the ASA data",
  },
  {
    insight:
      "Copying DE onto ray BA creates BG. Those copied sides and the included angle certify triangle GBC as a SAS copy of triangle DEF.",
    prompt:
      "Follow only the marked SAS premises: BG ↔ DE, BC ↔ EF, and ∠GBC ↔ ∠DEF. The remaining sides are not premises.",
    status: "BG ≅ DE, BC ≅ EF, and ∠GBC ≅ ∠DEF, so △GBC ≅ △DEF by SAS.",
    title: "Make a SAS copy on ray BA",
  },
  {
    insight:
      "SAS transfers the angle at F to ∠GCB. The original ASA data transfer that same angle at F to ∠ACB, so the two angles at C are congruent.",
    prompt:
      "Read the purple dashed SAS result and the orange given angle as a transitive chain through ∠DFE; the picture records the proved relation rather than estimating it.",
    status: "∠GCB ≅ ∠DFE and ∠ACB ≅ ∠DFE, so ∠GCB ≅ ∠ACB.",
    title: "Match the angle at C",
  },
  {
    insight:
      "Both candidate rays start at C, share baseline ray CB, and lie in the same chosen half-plane. The angle-copy uniqueness axiom therefore permits only one ray.",
    prompt:
      "The single purple ray carries both names, CA and CG. Its coincidence is the conclusion of uniqueness, not an assumption from visual alignment.",
    status: "In the chosen half-plane, rays CA and CG make the same angle with CB, so they are the same ray.",
    title: "Use the unique angle copy",
  },
  {
    insight:
      "G lies on line AB by construction and on line AC by the unique-ray step. Those distinct lines already meet at A, so their only common point is A.",
    prompt:
      "Read the highlighted intersection as A and G naming the same point. Replace the SAS copy GBC by the original triangle ABC only after this step.",
    status: "A and G are the same point; therefore △GBC is △ABC, and △ABC ≅ △DEF.",
    title: "Identify the vertex and finish",
  },
];

function AngleMarks({
  center,
  className,
  count,
  first,
  second,
}: {
  center: Point;
  className: string;
  count: 1 | 2;
  first: Point;
  second: Point;
}) {
  const radii = count === 1 ? [16] : [13, 19];
  return (
    <>
      {radii.map((radius) => (
        <path
          className={classNames("asa-congruence__angle", className)}
          d={minorArcPath(center, first, second, radius)}
          key={radius}
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
      className={classNames("asa-congruence__triangle", className)}
      points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
    />
  );
}

function FigurePoint({
  label,
  point,
  tone,
}: {
  label: string;
  point: Point;
  tone?: "constructed" | "result";
}) {
  const labelAbove = point.y < 110 || point.y > 188;
  return (
    <g>
      <circle
        className={classNames(
          "asa-congruence__point",
          tone && `asa-congruence__point--${tone}`,
        )}
        cx={point.x}
        cy={point.y}
        r="4.5"
      />
      <text
        className="asa-congruence__point-label"
        x={point.x}
        y={point.y + (labelAbove ? -11 : 16)}
      >
        {label}
      </text>
    </g>
  );
}

function segmentTick(first: Point, second: Point, key: string, stroke = green) {
  return hatchMark(
    midpoint(first, second),
    { x: second.x - first.x, y: second.y - first.y },
    5,
    key,
    stroke,
  );
}

function formatMeasure(value: number) {
  return formatDisplayNumber(value, 1);
}

function renderGuidedStep(step: number) {
  const stepOneA = { x: 66, y: 46 };
  const stepOneB = { x: 36, y: 170 };
  const stepOneC = { x: 136, y: 170 };
  const stepOneD = { x: 216, y: 46 };
  const stepOneE = { x: 186, y: 170 };
  const stepOneF = { x: 286, y: 170 };

  if (step === 0) {
    return (
      <>
        <text className="asa-congruence__panel-label" x="86" y="24">△ABC</text>
        <text className="asa-congruence__panel-label" x="236" y="24">△DEF</text>
        <Triangle a={stepOneA} b={stepOneB} c={stepOneC} />
        <Triangle a={stepOneD} b={stepOneE} c={stepOneF} className="asa-congruence__triangle--second" />
        <AngleMarks center={stepOneB} className="asa-congruence__angle--first" count={1} first={stepOneA} second={stepOneC} />
        <AngleMarks center={stepOneE} className="asa-congruence__angle--first" count={1} first={stepOneD} second={stepOneF} />
        <AngleMarks center={stepOneC} className="asa-congruence__angle--second" count={2} first={stepOneA} second={stepOneB} />
        <AngleMarks center={stepOneF} className="asa-congruence__angle--second" count={2} first={stepOneD} second={stepOneE} />
        {segmentTick(stepOneB, stepOneC, "step1-bc")}
        {segmentTick(stepOneE, stepOneF, "step1-ef")}
        <FigurePoint label="A" point={stepOneA} />
        <FigurePoint label="B" point={stepOneB} />
        <FigurePoint label="C" point={stepOneC} />
        <FigurePoint label="D" point={stepOneD} />
        <FigurePoint label="E" point={stepOneE} />
        <FigurePoint label="F" point={stepOneF} />
      </>
    );
  }

  const copyD = { x: 62, y: 48 };
  const copyE = { x: 32, y: 170 };
  const copyF = { x: 132, y: 170 };
  const copyG = { x: 222, y: 48 };
  const copyB = { x: 192, y: 170 };
  const copyC = { x: 292, y: 170 };

  if (step === 1) {
    return (
      <>
        <text className="asa-congruence__panel-label" x="82" y="24">Given △DEF</text>
        <text className="asa-congruence__panel-label" x="242" y="24">SAS copy △GBC</text>
        <Triangle a={copyD} b={copyE} c={copyF} />
        <Triangle a={copyG} b={copyB} c={copyC} className="asa-congruence__triangle--constructed" />
        <AngleMarks center={copyE} className="asa-congruence__angle--first" count={1} first={copyD} second={copyF} />
        <AngleMarks center={copyB} className="asa-congruence__angle--first" count={1} first={copyG} second={copyC} />
        {segmentTick(copyD, copyE, "step2-de", blue)}
        {segmentTick(copyG, copyB, "step2-gb", blue)}
        {segmentTick(copyE, copyF, "step2-ef")}
        {segmentTick(copyB, copyC, "step2-bc")}
        <FigurePoint label="D" point={copyD} />
        <FigurePoint label="E" point={copyE} />
        <FigurePoint label="F" point={copyF} />
        <FigurePoint label="G" point={copyG} tone="constructed" />
        <FigurePoint label="B" point={copyB} />
        <FigurePoint label="C" point={copyC} />
      </>
    );
  }

  if (step === 2) {
    const angleMatchG = copyD;
    const angleMatchFirstB = copyE;
    const angleMatchFirstC = copyF;
    const angleMatchA = copyG;
    const angleMatchSecondB = copyB;
    const angleMatchSecondC = copyC;

    return (
      <>
        <text className="asa-congruence__panel-label" x="82" y="24">From SAS: ∠GCB</text>
        <text className="asa-congruence__panel-label" x="242" y="24">From the given: ∠ACB</text>
        <Triangle a={angleMatchG} b={angleMatchFirstB} c={angleMatchFirstC} className="asa-congruence__triangle--constructed" />
        <Triangle a={angleMatchA} b={angleMatchSecondB} c={angleMatchSecondC} />
        <AngleMarks center={angleMatchFirstC} className="asa-congruence__angle--derived" count={2} first={angleMatchG} second={angleMatchFirstB} />
        <AngleMarks center={angleMatchSecondC} className="asa-congruence__angle--second" count={2} first={angleMatchA} second={angleMatchSecondB} />
        <FigurePoint label="G" point={angleMatchG} tone="constructed" />
        <FigurePoint label="B" point={angleMatchFirstB} />
        <FigurePoint label="C" point={angleMatchFirstC} />
        <FigurePoint label="A" point={angleMatchA} />
        <FigurePoint label="B" point={angleMatchSecondB} />
        <FigurePoint label="C" point={angleMatchSecondC} />
        <text className="asa-congruence__bridge-label" x="160" y="204">Both are congruent to ∠DFE</text>
      </>
    );
  }

  const uniqueC = { x: 220, y: 168 };
  const uniqueB = { x: 70, y: 168 };
  const uniqueAG = { x: 150, y: 52 };

  if (step === 3) {
    return (
      <>
        <polygon className="asa-congruence__half-plane" points="28,28 292,28 292,168 28,168" />
        <line className="asa-congruence__baseline" x1="28" x2="292" y1="168" y2="168" />
        <line className="asa-congruence__ray" x1={uniqueC.x} x2={uniqueAG.x} y1={uniqueC.y} y2={uniqueAG.y} />
        <AngleMarks center={uniqueC} className="asa-congruence__angle--unique" count={2} first={uniqueAG} second={uniqueB} />
        <FigurePoint label="C" point={uniqueC} />
        <FigurePoint label="B" point={uniqueB} />
        <FigurePoint label="A / G" point={uniqueAG} tone="result" />
        <text className="asa-congruence__half-plane-label" x="72" y="48">same chosen half-plane</text>
        <text className="asa-congruence__ray-label" x="178" y="92">CA and CG are one ray</text>
      </>
    );
  }

  const finalA = { x: 160, y: 48 };
  const finalB = { x: 130, y: 170 };
  const finalC = { x: 230, y: 170 };
  const lineAB = lineEndpointsFromPoints(finalA, finalB);
  const lineAC = lineEndpointsFromPoints(finalA, finalC);
  return (
    <>
      <line className="asa-congruence__intersection-line" {...lineAB} />
      <line className="asa-congruence__intersection-line" {...lineAC} />
      <Triangle a={finalA} b={finalB} c={finalC} className="asa-congruence__triangle--result" />
      <circle className="asa-congruence__intersection-ring" cx={finalA.x} cy={finalA.y} r="12" />
      <FigurePoint label="A / G" point={finalA} tone="result" />
      <FigurePoint label="B" point={finalB} />
      <FigurePoint label="C" point={finalC} />
      <text className="asa-congruence__line-label" x="126" y="104">line AB</text>
      <text className="asa-congruence__line-label" x="208" y="104">line AC</text>
      <text className="asa-congruence__bridge-label" x="160" y="207">The two distinct lines have one common point</text>
    </>
  );
}

export function ASACongruenceIllustration({
  activeStep,
  onDiscoveryChange,
}: ASACongruenceIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const horizontalControlId = useId();
  const heightControlId = useId();
  const [apexX, setApexX] = useState(initialApexX);
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const currentStep = proofSteps[proofStep] ?? proofSteps[0];
  const pointA = { x: apexX, y: sourcePointB.y - height };
  const directionED = {
    x: pointA.x - sourcePointB.x,
    y: pointA.y - sourcePointB.y,
  };
  const directionFD = {
    x: pointA.x - sourcePointC.x,
    y: pointA.y - sourcePointC.y,
  };
  const intersection = intersectRays(
    targetPointE,
    directionED,
    targetPointF,
    directionFD,
  );
  const pointD = intersection?.point ?? {
    x: (targetPointE.x + targetPointF.x) / 2,
    y: 56,
  };
  const angleB = angleBetweenPoints(sourcePointB, pointA, sourcePointC);
  const angleC = angleBetweenPoints(sourcePointC, pointA, sourcePointB);
  const lengthAB = distance(pointA, sourcePointB);
  const lengthAC = distance(pointA, sourcePointC);
  const lengthDE = distance(pointD, targetPointE);
  const lengthDF = distance(pointD, targetPointF);

  const explorationDiscovery: ProofStep = {
    insight:
      "D is located by intersecting two copied angle rays from the endpoints of EF. Only the two angles and included side are construction inputs; the other side matches are reconstructed results.",
    prompt:
      "Drag A or use the sliders. Watch D move as the two copied angle rays meet above the congruent base.",
    status: "The copied rays meet once in the shown chosen half-plane. The opposite half-plane would give the congruent mirror image. These examples illustrate ASA rigidity; start the proof for the SAS-and-uniqueness argument.",
    title: "Reconstruct from two angles and their included side",
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
    const nextApex = constrainApexToBounds(point, sourcePointB.y, apexBounds);
    setApexX(nextApex.x);
    setHeight(nextApex.height);
  };

  const beginDrag = (event: PointerEvent<SVGCircleElement>) => {
    if (!isExploring) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateApex(getSvgCoordinates(event.currentTarget.ownerSVGElement!, event));
  };

  const figureDescription = isExploring
    ? "ASA free exploration. Triangle ABC has draggable upper point A above fixed base BC. Base EF is congruent to BC. Rays from E and F copy the two endpoint angles and meet at D in the shown chosen half-plane. The opposite half-plane would give the congruent mirror image."
    : proofStep === 0
      ? "ASA proof step 1. Triangles ABC and DEF show exactly two corresponding angle pairs and the included side pair as givens."
      : proofStep === 1
        ? "ASA proof step 2. Triangle GBC is constructed beside DEF with two corresponding sides and their included angles marked for SAS."
        : proofStep === 2
          ? "ASA proof step 3. Two diagrams highlight angles GCB and ACB, each congruent to angle DFE."
          : proofStep === 3
            ? "ASA proof step 4. In one chosen half-plane, rays CA and CG coincide because they copy the same angle from baseline ray CB."
            : "ASA proof step 5. Extended lines AB and AC meet at the single point labelled A and G, so the SAS copy is the original triangle.";

  return (
    <div className="theorem-figure asa-congruence">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg asa-congruence__svg"
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
          {isExploring ? "ASA Congruence reconstruction" : `ASA Congruence: ${currentStep.title}`}
        </title>
        <desc id={descriptionId}>{figureDescription}</desc>

        {isExploring ? (
          <>
            <text className="asa-congruence__panel-label" x="82" y="18">Choose △ABC</text>
            <text className="asa-congruence__panel-label" x="234" y="18">Reconstruct △DEF</text>
            <Triangle a={pointA} b={sourcePointB} c={sourcePointC} />
            <Triangle a={pointD} b={targetPointE} c={targetPointF} className="asa-congruence__triangle--result" />
            <AngleMarks center={sourcePointB} className="asa-congruence__angle--first" count={1} first={pointA} second={sourcePointC} />
            <AngleMarks center={targetPointE} className="asa-congruence__angle--first" count={1} first={pointD} second={targetPointF} />
            <AngleMarks center={sourcePointC} className="asa-congruence__angle--second" count={2} first={pointA} second={sourcePointB} />
            <AngleMarks center={targetPointF} className="asa-congruence__angle--second" count={2} first={pointD} second={targetPointE} />
            {segmentTick(sourcePointB, sourcePointC, "free-bc")}
            {segmentTick(targetPointE, targetPointF, "free-ef")}
            <FigurePoint label="A" point={pointA} />
            <FigurePoint label="B" point={sourcePointB} />
            <FigurePoint label="C" point={sourcePointC} />
            <FigurePoint label="D" point={pointD} tone="result" />
            <FigurePoint label="E" point={targetPointE} />
            <FigurePoint label="F" point={targetPointF} />
            <circle className="asa-congruence__handle-target" cx={pointA.x} cy={pointA.y} onPointerDown={beginDrag} r={handleRadius} />
            <circle className={classNames("asa-congruence__handle", isDragging && "asa-congruence__handle--active")} cx={pointA.x} cy={pointA.y} r="7" />
          </>
        ) : (
          renderGuidedStep(proofStep)
        )}
      </svg>

      {isExploring ? (
        <>
          <div className="theorem-figure__summary asa-congruence__summary">
            <div className="theorem-measure theorem-measure--accent">
              <strong>ASA inputs</strong>
              <span>∠B and ∠E: {formatMeasure(angleB)}° · ∠C and ∠F: {formatMeasure(angleC)}° · BC and EF: {formatMeasure(sourceBaseLength)}</span>
            </div>
            <div className="theorem-measure theorem-measure--secondary asa-congruence__result-card">
              <strong>Reconstructed result</strong>
              <span>AB and DE: {formatMeasure(lengthAB)} / {formatMeasure(lengthDE)} · AC and DF: {formatMeasure(lengthAC)} / {formatMeasure(lengthDF)}</span>
            </div>
          </div>
          <TriangleApexControls
            apexX={apexX}
            bounds={apexBounds}
            height={height}
            heightControlId={heightControlId}
            horizontalControlId={horizontalControlId}
            onApexXChange={setApexX}
            onHeightChange={setHeight}
          />
        </>
      ) : (
        <>
          <div className="theorem-measure asa-congruence__proof-summary">
            <strong>{currentStep.title}</strong>
            <span>{currentStep.status}</span>
          </div>
          {proofStep === 1 ? (
            <div className="asa-congruence__proof-result">
              <strong>△GBC ≅ △DEF by SAS</strong>
              <span>The third side is a result of SAS, not an extra premise.</span>
            </div>
          ) : null}
          {proofStep === 3 ? (
            <div className="asa-congruence__proof-result">
              <strong>One baseline + one half-plane + one angle size = one ray</strong>
              <span>Angle-copy uniqueness forces CA and CG to coincide.</span>
            </div>
          ) : null}
          {proofStep === 4 ? (
            <div className="asa-congruence__proof-result asa-congruence__proof-result--final">
              <strong>A and G are the same point</strong>
              <span>Therefore △GBC is △ABC, so △ABC ≅ △DEF.</span>
            </div>
          ) : null}
        </>
      )}

      <p aria-live="polite" className={classNames("asa-congruence__status", !isExploring && "asa-congruence__status--proof")}>
        {discovery.status}
      </p>
    </div>
  );
}

export function IsoscelesBaseAnglesConverseIllustration() {
  const titleId = useId();
  const descriptionId = useId();
  const pointB = { x: 66, y: 172 };
  const pointC = { x: 270, y: 152 };
  const baseCenter = midpoint(pointB, pointC);
  const baseDirection = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };
  const baseLength = Math.hypot(baseDirection.x, baseDirection.y);
  const pointA = {
    x: baseCenter.x + (baseDirection.y / baseLength) * 130,
    y: baseCenter.y - (baseDirection.x / baseLength) * 130,
  };

  return (
    <div className="theorem-figure asa-congruence asa-congruence--corollary">
      <svg aria-describedby={descriptionId} aria-labelledby={titleId} className="theorem-figure__svg" role="img" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <title id={titleId}>Converse of the Isosceles Base-Angles Theorem</title>
        <desc id={descriptionId}>Triangle ABC has congruent base angles at B and C as the given information. ASA compares triangle ABC with the reversed naming ACB, using common side BC, and concludes that sides AB and AC are congruent.</desc>
        <Triangle a={pointA} b={pointB} c={pointC} className="asa-congruence__triangle--result" />
        <AngleMarks center={pointB} className="asa-congruence__angle--first" count={1} first={pointA} second={pointC} />
        <AngleMarks center={pointC} className="asa-congruence__angle--first" count={1} first={pointA} second={pointB} />
        {segmentTick(pointA, pointB, "corollary-ab", blue)}
        {segmentTick(pointA, pointC, "corollary-ac", blue)}
        <FigurePoint label="A" point={pointA} />
        <FigurePoint label="B" point={pointB} />
        <FigurePoint label="C" point={pointC} />
        <text className="asa-congruence__corollary-given" x="160" y="204">Given equal base angles · ASA derives equal legs</text>
      </svg>
    </div>
  );
}
