import { useEffect, useId, useState } from "react";
import "./styles/angle-addition.css";

import {
  AngleSector,
  DraggablePoint,
  RayLine,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import {
  clamp,
  polarPointRadians as polarPoint,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type AngleAdditionIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type FocusState = {
  coordinates: boolean;
  differences: boolean;
  interval: boolean;
  subtraction: boolean;
};

type AngleAdditionStep = TheoremDiscovery & {
  focus: FocusState;
};

const center = { x: 160, y: 164 };
const minimumEdgeCoordinate = 8;
const minimumPartMeasure = 24;
const maximumCoordinate = 180 - minimumEdgeCoordinate;
const outerRadius = 112;
const rayLength = 104;

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function arcPath(
  origin: Point,
  radius: number,
  startDegrees: number,
  endDegrees: number,
) {
  const start = polarPoint(origin, radius, (-startDegrees * Math.PI) / 180);
  const end = polarPoint(origin, radius, (-endDegrees * Math.PI) / 180);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

function panelClass(isExploring: boolean, isFocused: boolean) {
  if (isExploring || isFocused) {
    return "angle-addition__panel";
  }

  return "angle-addition__panel angle-addition__panel--muted";
}

export function AngleAdditionIllustration({
  activeStep,
  onDiscoveryChange,
}: AngleAdditionIllustrationProps) {
  const patternId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const [b, setB] = useState(52);
  const [c, setC] = useState(134);

  const firstPart = b;
  const secondPart = c - b;
  const whole = c;
  const isExploring = activeStep === null;

  const bRad = (b * Math.PI) / 180;
  const cRad = (c * Math.PI) / 180;

  const obEnd = polarPoint(center, rayLength, -bRad);
  const ocEnd = polarPoint(center, rayLength, -cRad);
  const coordinateB = polarPoint(center, outerRadius + 12, -bRad);
  const coordinateC = polarPoint(center, outerRadius + 22, -cRad);
  const firstLabelPoint = polarPoint(center, 43, -bRad / 2);
  const secondLabelPoint = polarPoint(center, 47, -bRad - ((cRad - bRad) / 2));

  const explorationStep: AngleAdditionStep = {
    focus: {
      coordinates: true,
      differences: true,
      interval: true,
      subtraction: true,
    },
    insight: `With b = ${degreeLabel(firstPart)} and c = ${degreeLabel(whole)}, the shared cut gives ∠AOB = ${degreeLabel(
      firstPart,
    )} and ∠BOC = ${degreeLabel(secondPart)}. Move OB to redistribute the parts, or move OC to change the whole angle.`,
    prompt:
      "Predict what stays fixed when you drag OB with OC held still, then predict what changes when you drag OC.",
    title: "Explore the figure",
  };

  const proofSteps: AngleAdditionStep[] = [
    {
      focus: {
        coordinates: true,
        differences: false,
        interval: false,
        subtraction: false,
      },
      insight: `Choose one degree scale with OA fixed at 0°. Because OB lies inside ∠AOC, the degree marks stay in order: 0 < ${b} < ${c} < 180.`,
      prompt:
        "Watch the semicircle labels and the condition badge: the theorem only applies because the three rays stay in order.",
      title: "Choose one degree scale",
    },
    {
      focus: {
        coordinates: false,
        differences: true,
        interval: false,
        subtraction: false,
      },
      insight: `Read the three angle sizes on the same scale: ∠AOB = ${degreeLabel(
        firstPart,
      )}, ∠BOC = ${degreeLabel(secondPart)}, and ∠AOC = ${degreeLabel(
        whole,
      )}.`,
      prompt:
        "Each angle size comes from subtracting degree marks on one scale, and the order 0 < b < c tells you which number is larger.",
      title: "Read the three angle sizes",
    },
    {
      focus: {
        coordinates: false,
        differences: true,
        interval: true,
        subtraction: false,
      },
      insight: `${degreeLabel(firstPart)} + (${degreeLabel(whole)} - ${degreeLabel(
        firstPart,
      )}) = ${degreeLabel(whole)}, so the +${degreeLabel(
        firstPart,
      )} and -${degreeLabel(firstPart)} cancel.`,
      prompt:
        "Line up 0 to b and b to c with 0 to c, then track the repeated middle value b in the expanded equation.",
      title: "Add and cancel the repeated value",
    },
    {
      focus: {
        coordinates: false,
        differences: false,
        interval: true,
        subtraction: true,
      },
      insight: `Subtract either part from the whole: ${degreeLabel(
        whole,
      )} - ${degreeLabel(firstPart)} = ${degreeLabel(
        secondPart,
      )} and ${degreeLabel(whole)} - ${degreeLabel(secondPart)} = ${degreeLabel(
        firstPart,
      )}.`,
      prompt:
        "These subtraction forms come from the same equality, not from a second rule.",
      title: "Recover either part by subtraction",
    },
  ];

  const currentStep = isExploring ? explorationStep : proofSteps[activeStep];
  const figureDescription = `Ray OA stays at 0 degrees. Ray OB points to ${b} degrees and lies inside angle AOC. Ray OC points to ${c} degrees. Angle AOB is ${firstPart} degrees, angle BOC is ${secondPart} degrees, and angle AOC is ${whole} degrees.`;
  const liveEquation = `Current equation: ${firstPart} degrees plus ${secondPart} degrees equals ${whole} degrees.`;
  const [announcedEquation, setAnnouncedEquation] = useState(liveEquation);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAnnouncedEquation(liveEquation);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [liveEquation]);

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [
    b,
    c,
    currentStep.insight,
    currentStep.prompt,
    currentStep.title,
    onDiscoveryChange,
    firstPart,
    secondPart,
    whole,
  ]);

  return (
    <div className="theorem-figure angle-addition">
      <div className={panelClass(isExploring, currentStep.focus.coordinates)}>
        <div className="angle-addition__badge">
          <strong>OB is inside ∠AOC</strong>
          <span>0° &lt; {b}° &lt; {c}° &lt; 180°</span>
        </div>
      </div>

      <SvgCanvas
        className="angle-addition__svg"
        description={figureDescription}
        descriptionId={descriptionId}
        title="Angle addition interactive figure"
        titleId={titleId}
      >
        <defs>
          <pattern
            height="8"
            id={patternId}
            patternTransform="rotate(35)"
            patternUnits="userSpaceOnUse"
            width="8"
          >
            <line
              stroke="rgba(194, 91, 42, 0.55)"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="8"
            />
          </pattern>
        </defs>

        <path
          className={
            isExploring || currentStep.focus.coordinates
              ? "angle-addition__protractor angle-addition__protractor--active"
              : "angle-addition__protractor"
          }
          d={arcPath(center, outerRadius, 0, 180)}
        />
        <path
          className="angle-addition__whole-angle"
          d={arcPath(center, 76, 0, c)}
        />

        <AngleSector
          endAngle={0}
          fill="rgba(31, 95, 191, 0.18)"
          radius={56}
          startAngle={-bRad}
          state={!isExploring && !currentStep.focus.differences ? "muted" : "normal"}
          tone="accent"
          vertex={center}
        />
        <AngleSector
          endAngle={-bRad}
          fill={`url(#${patternId})`}
          radius={56}
          startAngle={-cRad}
          state={!isExploring && !currentStep.focus.differences ? "muted" : "normal"}
          tone="secondary"
          vertex={center}
        />

        <path
          className={
            isExploring || currentStep.focus.differences
              ? "angle-addition__difference-arc angle-addition__difference-arc--active"
              : "angle-addition__difference-arc"
          }
          d={arcPath(center, 38, 0, b)}
        />
        <path
          className={
            isExploring || currentStep.focus.differences
              ? "angle-addition__difference-arc angle-addition__difference-arc--secondary angle-addition__difference-arc--active"
              : "angle-addition__difference-arc angle-addition__difference-arc--secondary"
          }
          d={arcPath(center, 46, b, c)}
        />
        <path
          className={
            isExploring || currentStep.focus.differences
              ? "angle-addition__difference-arc angle-addition__difference-arc--whole angle-addition__difference-arc--active"
              : "angle-addition__difference-arc angle-addition__difference-arc--whole"
          }
          d={arcPath(center, 66, 0, c)}
        />

        <RayLine angleDegrees={0} origin={center} reach={rayLength + 16} type="ray" />
        <RayLine angleDegrees={-b} origin={center} reach={rayLength} stroke="#1f5fbf" type="ray" />
        <RayLine angleDegrees={-c} origin={center} reach={rayLength} stroke="#c25b2a" type="ray" />

        <text className="angle-addition__coordinate-label" x="282" y="182">
          0°
        </text>
        <text className="angle-addition__coordinate-label" x="34" y="182">
          180°
        </text>
        <text
          className="angle-addition__coordinate-label"
          x={coordinateB.x}
          y={coordinateB.y - 10}
        >
          b = {b}°
        </text>
        <text
          className="angle-addition__coordinate-label"
          x={coordinateC.x}
          y={coordinateC.y - 14}
        >
          c = {c}°
        </text>

        <text className="angle-addition__measure-label" x={firstLabelPoint.x} y={firstLabelPoint.y}>
          {degreeLabel(firstPart)}
        </text>
        <text
          className="angle-addition__measure-label angle-addition__measure-label--secondary"
          x={secondLabelPoint.x}
          y={secondLabelPoint.y}
        >
          {degreeLabel(secondPart)}
        </text>

        <StaticPoint label="O" labelOffset={{ x: 0, y: 16 }} point={center} tone="accent" />
        <StaticPoint label="A" labelOffset={{ x: 10, y: -6 }} point={{ x: 294, y: 158 }} />

        <DraggablePoint
          ariaLabel="Ray OB"
          label="B"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(point) => {
            const raw = (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
            const nextCoordinate = Math.round(clamp(raw, 0, 180));
            setB(
              clamp(
                nextCoordinate,
                minimumEdgeCoordinate,
                c - minimumPartMeasure,
              ),
            );
          }}
          point={obEnd}
          tone="accent"
        />

        <DraggablePoint
          ariaLabel="Ray OC"
          label="C"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(point) => {
            const raw = (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
            const nextCoordinate = Math.round(clamp(raw, 0, 180));
            setC(
              clamp(
                nextCoordinate,
                b + minimumPartMeasure,
                maximumCoordinate,
              ),
            );
          }}
          point={ocEnd}
          tone="secondary"
        />
      </SvgCanvas>

      <div className="angle-addition__summary theorem-figure__summary">
        <div
          className={[
            "theorem-measure",
            "theorem-measure--accent",
            !isExploring && !currentStep.focus.differences
              ? "angle-addition__card--muted"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <strong>∠AOB</strong>
          <span>= {degreeLabel(firstPart)}</span>
        </div>
        <div
          className={[
            "theorem-measure",
            "theorem-measure--secondary",
            !isExploring && !currentStep.focus.differences
              ? "angle-addition__card--muted"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <strong>∠BOC</strong>
          <span>= {degreeLabel(secondPart)}</span>
        </div>
        <div className="theorem-measure">
          <strong>∠AOC</strong>
          <span>= {degreeLabel(whole)}</span>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcedEquation}
        </p>
      </div>

      <div className="angle-addition__controls">
        <div
          className={panelClass(
            isExploring,
            currentStep.focus.differences || currentStep.focus.interval,
          )}
        >
          <h3>1. Part + Part = Whole</h3>
          <p className="angle-addition__equation">
            ∠AOB + ∠BOC = ∠AOC
          </p>
          <p className="angle-addition__equation angle-addition__equation--values">
            {degreeLabel(firstPart)} + {degreeLabel(secondPart)} = {degreeLabel(whole)}
          </p>
        </div>

        <div className={panelClass(isExploring, currentStep.focus.subtraction)}>
          <h3>2. Whole − Part = Other Part</h3>
          <p className="angle-addition__equation">
            ∠AOC − ∠AOB = ∠BOC
          </p>
          <p className="angle-addition__equation angle-addition__equation--values">
            {degreeLabel(whole)} − {degreeLabel(firstPart)} = {degreeLabel(secondPart)}
          </p>
        </div>
      </div>
    </div>
  );
}
