import { useEffect, useId, useState, type PointerEvent } from "react";
import "./styles/segment-angle-comparison.css";

import {
  clamp,
  getSvgCoordinates,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { SvgCanvas, StaticPoint, DraggablePoint } from "@/features/geometry/components";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type SegmentAngleComparisonIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type DragTarget = "first-angle" | "second-angle" | "segment" | null;

type ComparisonStep = TheoremDiscovery & {
  focus: "all" | "angle" | "remainder" | "segment" | "substitution";
};

const segmentStart = 52;
const segmentEnd = 198;
const segmentLengthMin = 48;
const segmentLengthMax = 206;
const angleMin = 12;
const angleMax = 168;

const firstAngleCenter = { x: 82, y: 168 };
const secondAngleCenter = { x: 238, y: 168 };
const angleRadius = 76;
const angleMarkRadius = 52;

function polarPoint(center: Point, radius: number, degrees: number): Point {
  const radians = (-degrees * Math.PI) / 180;
  return {
    x: center.x + Math.cos(radians) * radius,
    y: center.y + Math.sin(radians) * radius,
  };
}

function sectorPath(center: Point, radius: number, degrees: number) {
  const start = polarPoint(center, radius, 0);
  const end = polarPoint(center, radius, degrees);
  return `M ${center.x} ${center.y} L ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y} Z`;
}

function arcPath(center: Point, radius: number, startDegrees: number, endDegrees: number) {
  const start = polarPoint(center, radius, startDegrees);
  const end = polarPoint(center, radius, endDegrees);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`;
}

function degreeLabel(value: number) {
  return `${value}°`;
}

function segmentRelation(length: number) {
  if (length === segmentEnd - segmentStart) {
    return "AB is congruent to CD";
  }

  return length < segmentEnd - segmentStart
    ? "AB is shorter than CD"
    : "CD is shorter than AB";
}

function angleRelation(first: number, second: number) {
  if (first === second) {
    return "∠AOB is congruent to ∠COD";
  }

  return first < second
    ? "∠AOB has a smaller angle size than ∠COD"
    : "∠COD has a smaller angle size than ∠AOB";
}

function segmentControlLabel(length: number) {
  if (length === segmentEnd - segmentStart) {
    return "congruent to CD";
  }

  return length < segmentEnd - segmentStart ? "shorter than CD" : "longer than CD";
}

export function SegmentAngleComparisonIllustration({
  activeStep,
  onDiscoveryChange,
}: SegmentAngleComparisonIllustrationProps) {
  const [segmentLength, setSegmentLength] = useState(92);
  const [firstAngle, setFirstAngle] = useState(54);
  const [secondAngle, setSecondAngle] = useState(118);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [announcedStatus, setAnnouncedStatus] = useState("");
  const svgId = useId();
  const isExploring = activeStep === null;
  const copyPoint = { x: segmentStart + segmentLength, y: 142 };
  const segmentPointB = { x: segmentStart + segmentLength, y: 68 };
  const firstAngleEnd = polarPoint(firstAngleCenter, angleRadius, firstAngle);
  const secondAngleEnd = polarPoint(secondAngleCenter, angleRadius, secondAngle);
  const largerAngle = Math.max(firstAngle, secondAngle);
  const smallerAngle = Math.min(firstAngle, secondAngle);
  const remainder = largerAngle - smallerAngle;
  const segmentStatus = segmentRelation(segmentLength);
  const angleStatus = angleRelation(firstAngle, secondAngle);

  const exploreStep: ComparisonStep = {
    focus: "all",
    insight: `${segmentStatus}. ${angleStatus}. In both panels, exactly one of the three relations is true.`,
    prompt:
      "Change a segment or an angle. Can you make each panel show shorter, congruent, and longer?",
    title: "Explore the comparisons",
  };
  const proofSteps: ComparisonStep[] = [
    {
      focus: "segment",
      insight: `Point E is the unique point on ray CD for which CE is congruent to AB. ${segmentStatus}.`,
      prompt:
        "Track the copied endpoint E rather than looking for a numerical length. The copy makes both segments comparable on one ray.",
      title: "Lay off one segment on the other",
    },
    {
      focus: "segment",
      insight:
        segmentLength === segmentEnd - segmentStart
          ? "E is D, so CE is congruent to CD and AB is congruent to CD."
          : segmentLength < segmentEnd - segmentStart
            ? "E lies between C and D, so CE is a proper part of CD and AB is shorter than CD."
            : "D lies between C and E, so CD is a proper part of CE and CD is shorter than AB.",
      prompt:
        "There are only three places for E relative to C and D: at D, between C and D, or beyond D.",
      title: "Read the three segment cases",
    },
    {
      focus: "substitution",
      insight:
        "The second ray is a congruent copy. Copying the short part and the remaining part preserves the same endpoint order, so a strict comparison survives congruent replacement.",
      prompt:
        "The patterned tick marks stand for congruent copied parts. Follow their order, not their drawn pixel lengths.",
      title: "Preserve a segment comparison",
    },
    {
      focus: "angle",
      insight: `${degreeLabel(firstAngle)} and ${degreeLabel(secondAngle)} are on Protractor scales. ${angleStatus}.`,
      prompt:
        "Read both openings from the same 0° through 180° scale. Equal degree values mean congruent angles.",
      title: "Read two angle sizes on one scale",
    },
    {
      focus: "remainder",
      insight:
        remainder === 0
          ? "The two degree values are equal, so the angles are congruent and their difference is zero."
          : `${degreeLabel(largerAngle)} − ${degreeLabel(smallerAngle)} = ${degreeLabel(remainder)}. The positive difference certifies which Protractor value is larger.`,
      prompt:
        "Compare the numerical degree values directly. The argument does not place either geometric angle inside the other.",
      title: "Read the positive difference",
    },
    {
      focus: "substitution",
      insight:
        "Congruent angles have the same degree value. Replacing either angle with a congruent one therefore leaves the smaller-or-larger relation unchanged.",
      prompt:
        "Read the relation card after the congruent-copy labels appear: equal degree values can replace one another in a strict comparison.",
      title: "Preserve an angle comparison",
    },
  ];
  const currentStep = isExploring ? exploreStep : proofSteps[activeStep];
  const segmentFocused = currentStep.focus === "all" || currentStep.focus === "segment" || currentStep.focus === "substitution";
  const angleFocused = currentStep.focus === "all" || currentStep.focus === "angle" || currentStep.focus === "remainder" || currentStep.focus === "substitution";
  const showTransport = currentStep.focus === "substitution";
  const showRemainder = currentStep.focus === "all" || currentStep.focus === "remainder";
  const figureStatus = `${segmentStatus}. ${angleStatus}.`;

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [
    currentStep.insight,
    currentStep.prompt,
    currentStep.title,
    onDiscoveryChange,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAnnouncedStatus(figureStatus);
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [figureStatus]);

  function updateDrag(event: PointerEvent<SVGSVGElement>) {
    if (!dragTarget) {
      return;
    }

    const point = getSvgCoordinates(event.currentTarget, event);
    if (dragTarget === "segment") {
      setSegmentLength(clamp(Math.round(point.x - segmentStart), segmentLengthMin, segmentLengthMax));
      return;
    }

    const center = dragTarget === "first-angle" ? firstAngleCenter : secondAngleCenter;
    const radians = Math.atan2(center.y - point.y, point.x - center.x);
    const degrees = (radians * 180) / Math.PI;
    const nextAngle = clamp(Math.round(degrees), angleMin, angleMax);
    if (dragTarget === "first-angle") {
      setFirstAngle(nextAngle);
    } else {
      setSecondAngle(nextAngle);
    }
  }

  return (
    <div className="theorem-figure segment-angle-comparison">
      <section
        className={
          segmentFocused
            ? "segment-angle-comparison__panel"
            : "segment-angle-comparison__panel segment-angle-comparison__panel--muted"
        }
      >
        <div className="segment-angle-comparison__heading">
          <div>
            <strong>Compare segments by copying</strong>
            <span>A congruent copy of AB ends at E on ray CD.</span>
          </div>
          <span className="segment-angle-comparison__relation">{segmentStatus}</span>
        </div>

        <SvgCanvas
          descriptionId={`${svgId}-segment-description`}
          description={`Segment AB is copied from C to E on ray CD. ${segmentStatus}.`}
          titleId={`${svgId}-segment-title`}
          title="Segment comparison by copying AB onto ray CD"
          className="segment-angle-comparison__svg"
          onPointerCancel={() => setDragTarget(null)}
          onPointerMove={updateDrag}
          onPointerUp={() => setDragTarget(null)}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <line className="segment-angle-comparison__segment" x1={segmentStart} x2={segmentPointB.x} y1="68" y2="68" />
          <StaticPoint className="segment-angle-comparison__fixed-point" point={{ x: segmentStart, y: 68 }} label="A" labelOffset={{ x: -10, y: -12 }} />
          <DraggablePoint
            hitRadius={20}
            label="B"
            labelOffset={{ x: 10, y: -12 }}
            onDrag={(p) => setSegmentLength(clamp(Math.round(p.x - segmentStart), segmentLengthMin, segmentLengthMax))}
            onDragEnd={() => setDragTarget(null)}
            onDragStart={() => setDragTarget("segment")}
            point={{ x: segmentPointB.x, y: 68 }}
            radius={6}
            className="segment-angle-comparison__draggable-point"
            showLabel={true}
          />
          <text className="segment-angle-comparison__figure-note" x="160" y="98">Drag B to change AB</text>

          <line className="segment-angle-comparison__ray" x1={segmentStart} x2="302" y1="142" y2="142" />
          <line className="segment-angle-comparison__ray-extension" x1={segmentEnd} x2="302" y1="142" y2="142" />
          <StaticPoint className="segment-angle-comparison__fixed-point" point={{ x: segmentStart, y: 142 }} label="C" labelOffset={{ x: -10, y: 20 }} />
          <StaticPoint className="segment-angle-comparison__comparison-point" point={{ x: segmentEnd, y: 142 }} label="D" labelOffset={{ x: 0, y: 20 }} radius={5.5} />
          <StaticPoint className="segment-angle-comparison__copy-point" point={copyPoint} label="E" labelOffset={{ x: 0, y: -12 }} radius={5.5} />
          <text className="segment-angle-comparison__figure-note" x="160" y="193">CE ≅ AB</text>

          {showTransport ? (
            <g className="segment-angle-comparison__transport">
              <line x1="80" x2="258" y1="211" y2="211" />
              <line x1="80" x2="154" y1="211" y2="211" />
              <StaticPoint point={{ x: 80, y: 211 }} label="C′" labelOffset={{ x: 0, y: -4 }} radius={3.5} />
              <StaticPoint point={{ x: 154, y: 211 }} label="E′" labelOffset={{ x: 0, y: -4 }} radius={3.5} />
              <StaticPoint point={{ x: 258, y: 211 }} label="D′" labelOffset={{ x: 0, y: -4 }} radius={3.5} />
            </g>
          ) : null}
        </SvgCanvas>

        <label className="segment-angle-comparison__control" htmlFor="segment-angle-comparison-segment">
          <span><strong>Change segment AB</strong><span>{segmentControlLabel(segmentLength)}</span></span>
          <input
            aria-valuetext={segmentStatus}
            id="segment-angle-comparison-segment"
            max={segmentLengthMax}
            min={segmentLengthMin}
            onChange={(event) => setSegmentLength(Number(event.target.value))}
            type="range"
            value={segmentLength}
          />
        </label>
      </section>

      <section
        className={
          angleFocused
            ? "segment-angle-comparison__panel"
            : "segment-angle-comparison__panel segment-angle-comparison__panel--muted"
        }
      >
        <div className="segment-angle-comparison__heading">
          <div>
            <strong>Compare angles on a Protractor scale</strong>
            <span>Degree values make the three angle cases explicit.</span>
          </div>
          <span className="segment-angle-comparison__relation">{angleStatus}</span>
        </div>

        <SvgCanvas
          descriptionId={`${svgId}-angle-description`}
          description={`Angle AOB is ${degreeLabel(firstAngle)} and angle COD is ${degreeLabel(secondAngle)}. ${angleStatus}.`}
          titleId={`${svgId}-angle-title`}
          title="Angle comparison on two Protractor scales"
          className="segment-angle-comparison__svg"
          onPointerCancel={() => setDragTarget(null)}
          onPointerMove={updateDrag}
          onPointerUp={() => setDragTarget(null)}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <path className="segment-angle-comparison__protractor" d={arcPath(firstAngleCenter, angleRadius, 0, 180)} />
          <path className="segment-angle-comparison__protractor" d={arcPath(secondAngleCenter, angleRadius, 0, 180)} />
          <path className="segment-angle-comparison__angle-sector segment-angle-comparison__angle-sector--accent" d={sectorPath(firstAngleCenter, angleMarkRadius, firstAngle)} />
          <path className="segment-angle-comparison__angle-sector segment-angle-comparison__angle-sector--secondary" d={sectorPath(secondAngleCenter, angleMarkRadius, secondAngle)} />
          {showRemainder && remainder > 0 ? (
            <path
              className="segment-angle-comparison__remainder"
              d={arcPath(
                firstAngle >= secondAngle ? firstAngleCenter : secondAngleCenter,
                angleMarkRadius - 14,
                smallerAngle,
                largerAngle,
              )}
            />
          ) : null}
          <line className="segment-angle-comparison__angle-ray" x1={firstAngleCenter.x} x2={firstAngleCenter.x + angleRadius} y1={firstAngleCenter.y} y2={firstAngleCenter.y} />
          <line className="segment-angle-comparison__angle-ray segment-angle-comparison__angle-ray--accent" x1={firstAngleCenter.x} x2={firstAngleEnd.x} y1={firstAngleCenter.y} y2={firstAngleEnd.y} />
          <line className="segment-angle-comparison__angle-ray" x1={secondAngleCenter.x} x2={secondAngleCenter.x + angleRadius} y1={secondAngleCenter.y} y2={secondAngleCenter.y} />
          <line className="segment-angle-comparison__angle-ray segment-angle-comparison__angle-ray--secondary" x1={secondAngleCenter.x} x2={secondAngleEnd.x} y1={secondAngleCenter.y} y2={secondAngleEnd.y} />
          <StaticPoint className="segment-angle-comparison__fixed-point" point={firstAngleCenter} showLabel={false} />
          <StaticPoint className="segment-angle-comparison__fixed-point" point={secondAngleCenter} showLabel={false} />
          <DraggablePoint
            hitRadius={20}
            onDrag={(p) => {
              const radians = Math.atan2(firstAngleCenter.y - p.y, p.x - firstAngleCenter.x);
              const degrees = (radians * 180) / Math.PI;
              setFirstAngle(clamp(Math.round(degrees), angleMin, angleMax));
            }}
            onDragEnd={() => setDragTarget(null)}
            onDragStart={() => setDragTarget("first-angle")}
            point={firstAngleEnd}
            radius={5.5}
            className="segment-angle-comparison__draggable-point"
            showLabel={false}
          />
          <DraggablePoint
            hitRadius={20}
            onDrag={(p) => {
              const radians = Math.atan2(secondAngleCenter.y - p.y, p.x - secondAngleCenter.x);
              const degrees = (radians * 180) / Math.PI;
              setSecondAngle(clamp(Math.round(degrees), angleMin, angleMax));
            }}
            onDragEnd={() => setDragTarget(null)}
            onDragStart={() => setDragTarget("second-angle")}
            point={secondAngleEnd}
            radius={5.5}
            className="segment-angle-comparison__draggable-point segment-angle-comparison__draggable-point--secondary"
            showLabel={false}
          />
          <text className="segment-angle-comparison__scale-label" x={firstAngleCenter.x} y="203">0°</text>
          <text className="segment-angle-comparison__scale-label" x={secondAngleCenter.x} y="203">0°</text>
          <text className="segment-angle-comparison__angle-label" x={firstAngleCenter.x} y="36">∠AOB = {degreeLabel(firstAngle)}</text>
          <text className="segment-angle-comparison__angle-label" x={secondAngleCenter.x} y="36">∠COD = {degreeLabel(secondAngle)}</text>
          {currentStep.focus === "substitution" ? (
            <text className="segment-angle-comparison__figure-note" x="160" y="58">Congruent angles keep the same degree value.</text>
          ) : null}
        </SvgCanvas>

        <div className="segment-angle-comparison__controls">
          <label className="segment-angle-comparison__control" htmlFor="segment-angle-comparison-first-angle">
            <span><strong>Change ∠AOB</strong><span>{degreeLabel(firstAngle)}</span></span>
            <input
              id="segment-angle-comparison-first-angle"
              max={angleMax}
              min={angleMin}
              onChange={(event) => setFirstAngle(Number(event.target.value))}
              type="range"
              value={firstAngle}
            />
          </label>
          <label className="segment-angle-comparison__control" htmlFor="segment-angle-comparison-second-angle">
            <span><strong>Change ∠COD</strong><span>{degreeLabel(secondAngle)}</span></span>
            <input
              id="segment-angle-comparison-second-angle"
              max={angleMax}
              min={angleMin}
              onChange={(event) => setSecondAngle(Number(event.target.value))}
              type="range"
              value={secondAngle}
            />
          </label>
        </div>
      </section>

      <span aria-atomic="true" aria-live="polite" className="visually-hidden" role="status">
        {announcedStatus}
      </span>
    </div>
  );
}
