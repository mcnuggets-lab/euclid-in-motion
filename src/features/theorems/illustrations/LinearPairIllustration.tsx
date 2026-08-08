import { useEffect, useState } from "react";

import {
  clamp,
  dragHandle,
  getSvgCoordinates,
  pointLabel,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
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

function polarPoint(center: Point, radius: number, angleDegrees: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: center.x + Math.cos(radians) * radius,
    y: center.y - Math.sin(radians) * radius,
  };
}

function sectorPath(
  center: Point,
  radius: number,
  startDegrees: number,
  endDegrees: number,
) {
  const start = polarPoint(center, radius, startDegrees);
  const end = polarPoint(center, radius, endDegrees);
  return [
    `M ${center.x} ${center.y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export function LinearPairIllustration({
  activeStep,
  onDiscoveryChange,
}: LinearPairIllustrationProps) {
  const [coordinate, setCoordinate] = useState(68);
  const [isDragging, setIsDragging] = useState(false);
  const center = { x: 160, y: 154 };
  const rayEnd = polarPoint(center, 94, coordinate);
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
      insight: "Opposite rays OA and OC receive coordinates 0° and 180°, so together they form a straight angle.",
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
      labelPoint: polarPoint(center, 34, coordinate / 2),
      measure: angleOne,
      path: sectorPath(center, 48, 0, coordinate),
    },
    {
      fill: "rgba(194, 91, 42, 0.18)",
      label: 2,
      labelPoint: polarPoint(center, 34, coordinate + angleTwo / 2),
      measure: angleTwo,
      path: sectorPath(center, 48, coordinate, 180),
    },
  ];

  return (
    <div className="theorem-figure">
      <svg
        aria-label="Linear pair interactive figure"
        className="theorem-figure__svg"
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
          const nextCoordinate =
            (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
          setCoordinate(clamp(nextCoordinate, 8, 172));
        }}
        onPointerUp={() => setIsDragging(false)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {angles.map((angle) => (
          <g key={angle.label}>
            <path
              className={
                [
                  "theorem-figure__sector",
                  isExploring
                    ? ""
                    : currentStep.focusAngles.includes(angle.label)
                      ? "theorem-figure__sector--focused"
                      : "theorem-figure__sector--muted",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              d={angle.path}
              fill={angle.fill}
            />
            <text
              className="theorem-figure__label"
              x={angle.labelPoint.x}
              y={angle.labelPoint.y}
            >
              {degreeLabel(angle.measure)}
            </text>
          </g>
        ))}

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

        <line
          stroke="#555"
          strokeWidth="2"
          x1="28"
          x2="292"
          y1={center.y}
          y2={center.y}
        />
        <line
          stroke="#555"
          strokeWidth="2"
          x1={center.x}
          x2={rayEnd.x}
          y1={center.y}
          y2={rayEnd.y}
        />
        <text className="axiom-figure__label" x="250" y="184">
          0°
        </text>
        <text className="axiom-figure__label" x="44" y="184">
          180°
        </text>
        {pointLabel({ x: 280, y: center.y }, "A")}
        {pointLabel({ x: 40, y: center.y }, "C")}
        {pointLabel(center, "O")}
        {dragHandle(
          rayEnd,
          "B",
          (event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
          },
          "secondary",
        )}
      </svg>

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
