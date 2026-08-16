import { useEffect, useState } from "react";

import {
  AngleSector,
  DraggablePoint,
  RayLine,
  Segment,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { clamp, polarPointRadians as polarPoint } from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type LinearPairIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type LinearPairStep = TheoremDiscovery & {
  focusAngles: number[];
  showStraightAngle?: boolean;
};

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

export function LinearPairIllustration({
  activeStep,
  onDiscoveryChange,
}: LinearPairIllustrationProps) {
  const [coordinate, setCoordinate] = useState(68);
  const center = { x: 160, y: 154 };
  const pointA = { x: 280, y: center.y };
  const pointC = { x: 40, y: center.y };
  const coordinateRad = (coordinate * Math.PI) / 180;
  const rayEnd = polarPoint(center, 94, -coordinateRad);

  const angleOne = coordinate;
  const angleTwo = 180 - coordinate;
  const isExploring = activeStep === null;

  const explorationStep: LinearPairStep = {
    focusAngles: [1, 2],
    insight: `∠AOB = ${degreeLabel(angleOne)} and ∠BOC = ${degreeLabel(
      angleTwo,
    )}. Their total remains 180° as ray OB moves.`,
    title: "Explore the figure",
  };

  const proofSteps: LinearPairStep[] = [
    {
      focusAngles: [],
      insight:
        "Opposite rays OA and OC receive coordinates 0° and 180°, so together they form a straight angle.",
      prompt: "Identify the opposite rays that bound the 0°–180° half-plane.",
      showStraightAngle: true,
      title: "Step 1: Set the straight-angle coordinates",
    },
    {
      focusAngles: [1, 2],
      insight: `The coordinate differences give ∠AOB = ${degreeLabel(
        angleOne,
      )} and ∠BOC = ${degreeLabel(angleTwo)}.`,
      prompt: "Read each angle as the difference between the coordinates of its sides.",
      title: "Step 2: Read the two differences",
    },
    {
      focusAngles: [1, 2],
      insight: `${degreeLabel(angleOne)} + ${degreeLabel(angleTwo)} = 180°, so the linear pair is supplementary.`,
      prompt: "Add the two coordinate differences and simplify.",
      title: "Step 3: Add the adjacent angles",
    },
  ];

  const currentStep = isExploring ? explorationStep : proofSteps[activeStep];

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [activeStep, angleOne, angleTwo, onDiscoveryChange]);

  const angles = [
    {
      fill: "rgba(31, 95, 191, 0.18)",
      label: 1,
      measure: angleOne,
      startAngle: -coordinateRad,
      endAngle: 0,
      tone: "accent" as const,
    },
    {
      fill: "rgba(194, 91, 42, 0.18)",
      label: 2,
      measure: angleTwo,
      startAngle: -Math.PI,
      endAngle: -coordinateRad,
      tone: "secondary" as const,
    },
  ];

  return (
    <div className="theorem-figure">
      <SvgCanvas aria-label="Linear pair interactive figure" className="theorem-figure__svg">
        {angles.map((angle) => {
          const isFocused =
            !isExploring && currentStep.focusAngles.includes(angle.label);
          const state = isExploring ? "normal" : isFocused ? "focused" : "muted";

          return (
            <AngleSector
              key={angle.label}
              degreeLabel={degreeLabel(angle.measure)}
              endAngle={angle.endAngle}
              fill={angle.fill}
              radius={48}
              startAngle={angle.startAngle}
              state={state}
              tone={angle.tone}
              vertex={center}
            />
          );
        })}

        {currentStep.showStraightAngle ? (
          <g>
            <path
              className="theorem-figure__straight-arc"
              d={`M 272 ${center.y} A 112 112 0 0 0 48 ${center.y}`}
            />
            <text className="theorem-figure__straight-label" x="160" y="32">
              180°
            </text>
          </g>
        ) : null}

        <RayLine origin={pointC} through={pointA} type="line" />
        <Segment end={rayEnd} start={center} />

        <text className="axiom-figure__label" x="250" y="184">
          0°
        </text>
        <text className="axiom-figure__label" x="44" y="184">
          180°
        </text>

        <StaticPoint label="A" labelOffset={{ x: 0, y: 16 }} point={pointA} />
        <StaticPoint label="C" labelOffset={{ x: 0, y: 16 }} point={pointC} />
        <StaticPoint label="O" labelOffset={{ x: 0, y: 16 }} point={center} />

        <DraggablePoint
          ariaLabel="Ray endpoint B"
          label="B"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(point) => {
            const nextCoordinate =
              (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
            setCoordinate(clamp(nextCoordinate, 8, 172));
          }}
          point={rayEnd}
          tone="secondary"
        />
      </SvgCanvas>

      <div className="linear-pair-summary">
        <div className="theorem-measure theorem-measure--accent">
          <strong>∠AOB</strong>
          <span>{degreeLabel(angleOne)}</span>
        </div>
        <div className="theorem-measure theorem-measure--secondary">
          <strong>∠BOC</strong>
          <span>{degreeLabel(angleTwo)}</span>
        </div>
        <div className="theorem-measure">
          <strong>Total</strong>
          <span>{degreeLabel(angleOne + angleTwo)}</span>
        </div>
      </div>

      <p className="theorem-figure__note">
        The two adjacent angles change, but together they remain 180°.
      </p>
    </div>
  );
}
