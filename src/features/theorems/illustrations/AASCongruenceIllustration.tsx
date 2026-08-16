import { useEffect, useId, useState } from "react";
import "./styles/aas-congruence.css";

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
  midpoint,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";
import { SvgCanvas, DraggablePoint } from "@/features/geometry/components";
import type { TheoremDiscovery } from "@/features/theorems/discovery";
import { TriangleApexControls } from "@/features/theorems/illustrations/TriangleApexControls";

type AASCongruenceIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type ProofStep = TheoremDiscovery & {
  status: string;
};

const green = "#23805a";

const baseY = 156;
const sourcePointB = { x: 24, y: baseY };
const sourcePointC = { x: 140, y: baseY };
const targetPointE = { x: 176, y: baseY };
const targetPointF = { x: 292, y: baseY };
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
      "The side pair BC and EF is not between the two marked angle pairs. That placement is what distinguishes AAS from ASA.",
    prompt:
      "Trace the correspondence A ↔ D and B ↔ E, then locate side BC and EF. Treat the triangle-congruence statement as the goal, not as information supplied by the drawing.",
    status: "∠BAC ≅ ∠EDF, ∠ABC ≅ ∠DEF, and BC ≅ EF. Prove △ABC ≅ △DEF.",
    title: "Name the AAS data",
  },
  {
    insight:
      "Each triangle has 180° in total. Removing two matching angle sizes from equal totals leaves matching third angle sizes.",
    prompt:
      "Follow the blue and orange given pairs into the two subtraction expressions. The purple dashed pair is a conclusion from Triangle Angle Sum, not a new given.",
    status: "Triangle Angle Sum and the two given angle pairs give ∠BCA ≅ ∠EFD.",
    title: "Recover the third angle",
  },
  {
    insight:
      "Once the third angles match, BC and EF sit between the angle pairs at B and C, and at E and F. The same side data are now included-side data for ASA.",
    prompt:
      "Focus on the purple derived pair, the blue original pair, and the green side pair. The orange pair has already done its job in deriving the third angles.",
    status: "∠ABC ≅ ∠DEF, BC ≅ EF, and ∠BCA ≅ ∠EFD are ASA data.",
    title: "Reframe the data as ASA",
  },
  {
    insight:
      "AAS finishes through an earlier theorem: the recovered angle pair converts the original information into ASA.",
    prompt:
      "Read the conclusion as one application of ASA. The reconstructed examples in free mode illustrate this rigidity, while these four guided states supply the proof.",
    status: "ASA gives △ABC ≅ △DEF.",
    title: "Apply ASA and finish",
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
          className={classNames("aas-congruence__angle", className)}
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
      className={classNames("aas-congruence__triangle", className)}
      points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
    />
  );
}

function FigurePoint({ label, point }: { label: string; point: Point }) {
  const labelAbove = point.y < 110 || point.y > 188;
  return (
    <g>
      <circle className="aas-congruence__point" cx={point.x} cy={point.y} r="4.5" />
      <text
        className="aas-congruence__point-label"
        x={point.x}
        y={point.y + (labelAbove ? -10 : 16)}
      >
        {label}
      </text>
    </g>
  );
}

function segmentTick(first: Point, second: Point, key: string) {
  return hatchMark(
    midpoint(first, second),
    { x: second.x - first.x, y: second.y - first.y },
    5,
    key,
    green,
  );
}

const guideA = { x: 66, y: 46 };
const guideB = { x: 36, y: 170 };
const guideC = { x: 136, y: 170 };
const guideD = { x: 216, y: 46 };
const guideE = { x: 186, y: 170 };
const guideF = { x: 286, y: 170 };

function GuidedTriangles({
  result = false,
  showDerived = false,
  showGivenSecond = true,
}: {
  result?: boolean;
  showDerived?: boolean;
  showGivenSecond?: boolean;
}) {
  return (
    <>
      <Triangle a={guideA} b={guideB} c={guideC} className={result ? "aas-congruence__triangle--result" : undefined} />
      <Triangle a={guideD} b={guideE} c={guideF} className={result ? "aas-congruence__triangle--result" : "aas-congruence__triangle--second"} />
      <AngleMarks center={guideB} className="aas-congruence__angle--first" count={1} first={guideA} second={guideC} />
      <AngleMarks center={guideE} className="aas-congruence__angle--first" count={1} first={guideD} second={guideF} />
      {showGivenSecond ? (
        <>
          <AngleMarks center={guideA} className="aas-congruence__angle--second" count={2} first={guideB} second={guideC} />
          <AngleMarks center={guideD} className="aas-congruence__angle--second" count={2} first={guideE} second={guideF} />
        </>
      ) : null}
      {showDerived ? (
        <>
          <AngleMarks center={guideC} className="aas-congruence__angle--derived" count={1} first={guideB} second={guideA} />
          <AngleMarks center={guideF} className="aas-congruence__angle--derived" count={1} first={guideE} second={guideD} />
        </>
      ) : null}
      {segmentTick(guideB, guideC, "guide-bc")}
      {segmentTick(guideE, guideF, "guide-ef")}
      <FigurePoint label="A" point={guideA} />
      <FigurePoint label="B" point={guideB} />
      <FigurePoint label="C" point={guideC} />
      <FigurePoint label="D" point={guideD} />
      <FigurePoint label="E" point={guideE} />
      <FigurePoint label="F" point={guideF} />
    </>
  );
}

function renderGuidedStep(step: number) {
  if (step === 0) {
    return (
      <>
        <text className="aas-congruence__panel-label" x="86" y="24">△ABC</text>
        <text className="aas-congruence__panel-label" x="236" y="24">△DEF</text>
        <GuidedTriangles />
        <text className="aas-congruence__bridge-label" x="160" y="207">The green side is not between the blue and orange angles</text>
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <text className="aas-congruence__panel-label" x="86" y="24">180° − ∠A − ∠B = ∠C</text>
        <text className="aas-congruence__panel-label" x="236" y="24">180° − ∠D − ∠E = ∠F</text>
        <GuidedTriangles showDerived />
        <text className="aas-congruence__bridge-label" x="160" y="207">Matching subtractions give the purple dashed angle pair</text>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <text className="aas-congruence__panel-label" x="86" y="24">ASA data in △ABC</text>
        <text className="aas-congruence__panel-label" x="236" y="24">ASA data in △DEF</text>
        <GuidedTriangles showDerived showGivenSecond={false} />
        <text className="aas-congruence__included-label" x="86" y="208">BC lies between ∠B and ∠C</text>
        <text className="aas-congruence__included-label" x="236" y="208">EF lies between ∠E and ∠F</text>
      </>
    );
  }

  return (
    <>
      <text className="aas-congruence__panel-label" x="86" y="24">△ABC</text>
      <text className="aas-congruence__panel-label" x="236" y="24">△DEF</text>
      <GuidedTriangles result showDerived showGivenSecond={false} />
      <text className="aas-congruence__bridge-label aas-congruence__bridge-label--result" x="160" y="207">ASA gives △ABC ≅ △DEF</text>
    </>
  );
}

function formatMeasure(value: number) {
  return formatDisplayNumber(value, 1);
}

export function AASCongruenceIllustration({
  activeStep,
  onDiscoveryChange,
}: AASCongruenceIllustrationProps) {
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
  const sourcePointA = { x: apexX, y: baseY - height };
  const directionED = {
    x: sourcePointA.x - sourcePointB.x,
    y: sourcePointA.y - sourcePointB.y,
  };
  const directionFD = {
    x: sourcePointA.x - sourcePointC.x,
    y: sourcePointA.y - sourcePointC.y,
  };
  const targetPointD =
    intersectRays(targetPointE, directionED, targetPointF, directionFD)?.point ?? {
      x: targetPointE.x + directionED.x,
      y: targetPointE.y + directionED.y,
    };

  const angleA = angleBetweenPoints(sourcePointA, sourcePointB, sourcePointC);
  const angleB = angleBetweenPoints(sourcePointB, sourcePointA, sourcePointC);
  const angleC = angleBetweenPoints(sourcePointC, sourcePointA, sourcePointB);
  const explorationDiscovery: ProofStep = {
    insight:
      "The orange and blue angles plus green base are the AAS inputs. The purple dashed angle is first derived from the 180° total; only then can rays from E and F reconstruct D as an ASA triangle.",
    prompt:
      "Drag A or use the sliders. Watch the derived angle change, then follow the copied given-angle ray and derived-angle ray to their intersection at D.",
    status: `The AAS inputs determine a ${formatMeasure(angleC)}° third angle. The two rays meet once in the shown chosen half-plane; the opposite half-plane would give the congruent mirror image. This reconstruction illustrates the theorem; the guided states prove it through Triangle Angle Sum and ASA.`,
    title: "Turn AAS inputs into an ASA reconstruction",
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
    const nextApex = constrainApexToBounds(point, baseY, apexBounds);
    setApexX(nextApex.x);
    setHeight(nextApex.height);
  };

  const figureDescription = isExploring
    ? "AAS free exploration. Triangle ABC has draggable upper point A above fixed base BC. Angles at A and B and non-included side BC are copied to the second triangle. The missing angle at F is derived from the 180 degree total, and its ray meets the copied angle ray from E at D in the shown chosen half-plane. The opposite half-plane would give the congruent mirror image."
    : proofStep === 0
      ? "AAS proof step 1. Two triangles show two corresponding angle pairs and one corresponding non-included side as the givens."
      : proofStep === 1
        ? "AAS proof step 2. The original angle pairs remain marked while a purple dashed third-angle pair is derived from the 180 degree totals."
        : proofStep === 2
          ? "AAS proof step 3. The derived purple angle pair, original blue angle pair, and the side between them are highlighted as ASA data."
          : "AAS proof step 4. The two triangles are congruent by ASA after the third angle pair has been derived.";

  return (
    <div className="theorem-figure aas-congruence">
      <SvgCanvas
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg aas-congruence__svg"
        description={figureDescription}
        descriptionId={descriptionId}
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
        title={isExploring ? "AAS Congruence reconstruction" : `AAS Congruence: ${currentStep.title}`}
        titleId={titleId}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {isExploring ? (
          <>
            <text className="aas-congruence__panel-label" x="82" y="18">Choose △ABC</text>
            <text className="aas-congruence__panel-label" x="234" y="18">Reconstruct △DEF</text>
            <Triangle a={sourcePointA} b={sourcePointB} c={sourcePointC} />
            <Triangle a={targetPointD} b={targetPointE} c={targetPointF} className="aas-congruence__triangle--result" />
            <AngleMarks center={sourcePointB} className="aas-congruence__angle--first" count={1} first={sourcePointA} second={sourcePointC} />
            <AngleMarks center={targetPointE} className="aas-congruence__angle--first" count={1} first={targetPointD} second={targetPointF} />
            <AngleMarks center={sourcePointA} className="aas-congruence__angle--second" count={2} first={sourcePointB} second={sourcePointC} />
            <AngleMarks center={targetPointD} className="aas-congruence__angle--second" count={2} first={targetPointE} second={targetPointF} />
            <AngleMarks center={sourcePointC} className="aas-congruence__angle--derived" count={1} first={sourcePointB} second={sourcePointA} />
            <AngleMarks center={targetPointF} className="aas-congruence__angle--derived" count={1} first={targetPointE} second={targetPointD} />
            {segmentTick(sourcePointB, sourcePointC, "free-bc")}
            {segmentTick(targetPointE, targetPointF, "free-ef")}
            <FigurePoint label="A" point={sourcePointA} />
            <FigurePoint label="B" point={sourcePointB} />
            <FigurePoint label="C" point={sourcePointC} />
            <FigurePoint label="D" point={targetPointD} />
            <FigurePoint label="E" point={targetPointE} />
            <FigurePoint label="F" point={targetPointF} />
            <DraggablePoint
              hitRadius={handleRadius}
              label="A"
              onDrag={(p) => updateApex(p)}
              onDragEnd={() => setIsDragging(false)}
              onDragStart={() => setIsDragging(true)}
              point={sourcePointA}
              radius={7}
              showLabel={false}
            />
          </>
        ) : (
          renderGuidedStep(proofStep)
        )}
      </SvgCanvas>

      {isExploring ? (
        <>
          <div className="theorem-figure__summary aas-congruence__summary">
            <div className="theorem-measure theorem-measure--accent">
              <strong>AAS inputs</strong>
              <span>∠A and ∠D: {formatMeasure(angleA)}° · ∠B and ∠E: {formatMeasure(angleB)}° · BC and EF: {formatMeasure(distance(sourcePointB, sourcePointC))}</span>
            </div>
            <div className="theorem-measure aas-congruence__derived-card">
              <strong>Derived for ASA</strong>
              <span>∠C and ∠F: 180° − {formatMeasure(angleA)}° − {formatMeasure(angleB)}° = {formatMeasure(angleC)}°</span>
            </div>
            <div className="theorem-measure theorem-measure--secondary aas-congruence__result-card">
              <strong>Reconstructed result</strong>
              <span>AB and DE: {formatMeasure(distance(sourcePointA, sourcePointB))} · AC and DF: {formatMeasure(distance(sourcePointA, sourcePointC))}</span>
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
          <div className="theorem-measure aas-congruence__proof-summary">
            <strong>{currentStep.title}</strong>
            <span>{currentStep.status}</span>
          </div>
          {proofStep === 1 ? (
            <div className="aas-congruence__proof-result aas-congruence__proof-result--derived">
              <strong>Third Angle result</strong>
              <span>The purple dashed angles are derived from equal 180° totals.</span>
            </div>
          ) : null}
          {proofStep === 2 ? (
            <div className="aas-congruence__proof-result">
              <strong>Derived angle + given side + given angle</strong>
              <span>BC and EF are included sides for this new choice of angle pairs.</span>
            </div>
          ) : null}
          {proofStep === 3 ? (
            <div className="aas-congruence__proof-result aas-congruence__proof-result--final">
              <strong>△ABC ≅ △DEF</strong>
              <span>AAS has been reduced to ASA.</span>
            </div>
          ) : null}
        </>
      )}

      <p aria-live="polite" className={classNames("aas-congruence__status", !isExploring && "aas-congruence__status--proof")}>
        {discovery.status}
      </p>
    </div>
  );
}
