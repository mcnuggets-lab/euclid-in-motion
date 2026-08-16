import { useEffect, useState } from "react";

import {
  AngleSector,
  DraggablePoint,
  SvgCanvas,
} from "@/features/geometry/components";
import {
  constrainLineSeparation,
  polarPointRadians as polarPoint,
  type Point,
} from "@/features/geometry/geometryPrimitives";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type Ray = {
  angle: number;
  tone: "accent" | "secondary";
};

type DiscoveryStep = {
  comparePair?: [number, number];
  focusLabels: number[];
  insight: string;
  prompt?: string;
  sharedAngle?: number;
  straightPair?: [number, number];
  title: string;
};

const minimumLineSeparation = 8;

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2;
  let normalized = angle % fullTurn;
  if (normalized < 0) {
    normalized += fullTurn;
  }

  return normalized;
}

function arcPath(center: Point, radius: number, start: number, end: number) {
  const startPoint = polarPoint(center, radius, start);
  const endPoint = polarPoint(center, radius, end);
  const largeArc = end - start > Math.PI ? 1 : 0;

  return [
    `M ${startPoint.x} ${startPoint.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`,
  ].join(" ");
}

function lineEndpoints(center: Point, angleDegrees: number, reach = 170) {
  const radians = (angleDegrees * Math.PI) / 180;
  const dx = Math.cos(radians) * reach;
  const dy = Math.sin(radians) * reach;

  return {
    x1: center.x - dx,
    x2: center.x + dx,
    y1: center.y - dy,
    y2: center.y + dy,
  };
}

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function namedAngle(label: number, value: number) {
  return `∠${label} = ${degreeLabel(value)}`;
}

type VerticalAnglesIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

export function VerticalAnglesIllustration({
  activeStep,
  onDiscoveryChange,
}: VerticalAnglesIllustrationProps) {
  const [center, setCenter] = useState<Point>({ x: 156, y: 112 });
  const [lineOneAngle, setLineOneAngle] = useState(18);
  const [lineTwoAngle, setLineTwoAngle] = useState(114);

  const lineOne = lineEndpoints(center, lineOneAngle);
  const lineTwo = lineEndpoints(center, lineTwoAngle);
  const lineOneRadians = (lineOneAngle * Math.PI) / 180;
  const lineTwoRadians = (lineTwoAngle * Math.PI) / 180;
  const lineOneHandle = polarPoint(center, 70, lineOneRadians);
  const lineTwoHandle = polarPoint(center, 70, lineTwoRadians);

  const rays: Ray[] = [
    { angle: normalizeAngle(lineOneRadians), tone: "accent" },
    { angle: normalizeAngle(lineOneRadians + Math.PI), tone: "secondary" },
    { angle: normalizeAngle(lineTwoRadians), tone: "secondary" },
    { angle: normalizeAngle(lineTwoRadians + Math.PI), tone: "accent" },
  ];
  rays.sort((first, second) => first.angle - second.angle);

  const sectors = rays.map((ray, index) => {
    const nextAngle =
      index === rays.length - 1 ? rays[0].angle + Math.PI * 2 : rays[index + 1].angle;
    const size = nextAngle - ray.angle;
    const tone: Ray["tone"] = index % 2 === 0 ? "accent" : "secondary";

    return {
      fill: tone === "accent" ? "rgba(31, 95, 191, 0.18)" : "rgba(194, 91, 42, 0.18)",
      number: index + 1,
      endAngle: nextAngle,
      measure: (size * 180) / Math.PI,
      startAngle: ray.angle,
      tone,
    };
  });
  const sectorsByNumber = new Map(sectors.map((sector) => [sector.number, sector]));

  const angle1 = sectors[0]?.measure ?? 0;
  const angle2 = sectors[1]?.measure ?? 0;
  const angle3 = sectors[2]?.measure ?? 0;
  const angle4 = sectors[3]?.measure ?? 0;
  const blueAngle = angle1;
  const orangeAngle = angle2;
  const explorationStep: DiscoveryStep = {
    focusLabels: [1, 2, 3, 4],
    insight:
      "All four angles are visible without proof highlighting. Look for equal opposite pairs and adjacent pairs that add to 180°.",
    title: "Explore the figure",
  };
  const discoverySteps: DiscoveryStep[] = [
    {
      comparePair: [1, 2],
      focusLabels: [1, 2],
      insight: `∠1 + ∠2 = 180°. Here, ${degreeLabel(angle1)} + ${degreeLabel(
        angle2,
      )} = ${degreeLabel(angle1 + angle2)}.`,
      prompt: "Move the lines and watch the top adjacent pair. Do they keep making a straight angle?",
      straightPair: [1, 2],
      title: "Step 1: Find a straight angle",
    },
    {
      comparePair: [2, 3],
      focusLabels: [2, 3],
      insight: `∠2 + ∠3 = 180°. Here, ${degreeLabel(angle2)} + ${degreeLabel(
        angle3,
      )} = ${degreeLabel(angle2 + angle3)}.`,
      prompt: "Now compare the next adjacent pair that shares angle 2. It also makes a straight angle.",
      straightPair: [2, 3],
      title: "Step 2: Find a second straight angle",
    },
    {
      comparePair: [1, 3],
      focusLabels: [1, 2, 3],
      insight: `∠1 + ∠2 = ∠2 + ∠3. Subtract the shared ∠2, so ∠1 ≅ ∠3.`,
      prompt: "Both sums equal 180°. Subtract the shared angle 2, then compare angles 1 and 3.",
      sharedAngle: 2,
      title: "Step 3: Compare the vertical pair",
    },
    {
      comparePair: [2, 4],
      focusLabels: [2, 3, 4],
      insight: `∠2 + ∠3 = ∠3 + ∠4. Subtract the shared ∠3, so ∠2 ≅ ∠4.`,
      prompt: "Repeat the same subtraction with the shared angle 3.",
      sharedAngle: 3,
      title: "Step 4: Finish the theorem",
    },
  ];
  const isExploring = activeStep === null;
  const currentStep = isExploring ? explorationStep : discoverySteps[activeStep];

  useEffect(() => {
    onDiscoveryChange({
      comparePair: currentStep.comparePair,
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      sharedAngle: currentStep.sharedAngle,
      straightPair: currentStep.straightPair,
      title: currentStep.title,
    });
  }, [activeStep, angle1, angle2, angle3, angle4, onDiscoveryChange]);

  const straightPairSectors = currentStep.straightPair
    ? [
        sectorsByNumber.get(currentStep.straightPair[0]),
        sectorsByNumber.get(currentStep.straightPair[1]),
      ]
    : [];
  const straightPairArc =
    straightPairSectors.length === 2 && straightPairSectors[0] && straightPairSectors[1]
      ? {
          endAngle: straightPairSectors[1].endAngle,
          labelPoint: polarPoint(
            center,
            70,
            straightPairSectors[0].startAngle +
              (straightPairSectors[1].endAngle - straightPairSectors[0].startAngle) / 2,
          ),
          path: arcPath(
            center,
            62,
            straightPairSectors[0].startAngle,
            straightPairSectors[1].endAngle,
          ),
          startAngle: straightPairSectors[0].startAngle,
        }
      : null;

  return (
    <div className="theorem-figure">
      <SvgCanvas aria-label="Vertical angles interactive figure">
        {sectors.map((sector) => {
          const isSectorFocused =
            !isExploring && currentStep.focusLabels.includes(sector.number);
          const isSectorShared =
            !isExploring && currentStep.sharedAngle === sector.number;
          const sectorState = isExploring
            ? "normal"
            : isSectorShared
              ? "shared"
              : isSectorFocused
                ? "focused"
                : "muted";

          return (
            <AngleSector
              key={`${sector.tone}-${sector.number}`}
              degreeLabel={degreeLabel(sector.measure)}
              endAngle={sector.endAngle}
              fill={sector.fill}
              indexLabel={sector.number}
              radius={44}
              startAngle={sector.startAngle}
              state={sectorState}
              tone={sector.tone}
              vertex={center}
            />
          );
        })}

        {straightPairArc ? (
          <g>
            <path className="theorem-figure__straight-arc" d={straightPairArc.path} />
            <text
              className="theorem-figure__straight-label"
              x={straightPairArc.labelPoint.x}
              y={straightPairArc.labelPoint.y}
            >
              180°
            </text>
          </g>
        ) : null}

        <line
          stroke="#555"
          strokeWidth="2"
          x1={lineOne.x1}
          x2={lineOne.x2}
          y1={lineOne.y1}
          y2={lineOne.y2}
        />
        <line
          stroke="#555"
          strokeWidth="2"
          x1={lineTwo.x1}
          x2={lineTwo.x2}
          y1={lineTwo.y1}
          y2={lineTwo.y2}
        />

        <DraggablePoint
          ariaLabel="Control line L"
          label="L"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => {
            const nextAngle =
              (Math.atan2(nextPoint.y - center.y, nextPoint.x - center.x) * 180) /
              Math.PI;
            setLineOneAngle(
              constrainLineSeparation(
                nextAngle,
                lineOneAngle,
                lineTwoAngle,
                minimumLineSeparation,
              ),
            );
          }}
          point={lineOneHandle}
          tone="accent"
        />

        <DraggablePoint
          ariaLabel="Control line M"
          label="M"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => {
            const nextAngle =
              (Math.atan2(nextPoint.y - center.y, nextPoint.x - center.x) * 180) /
              Math.PI;
            setLineTwoAngle(
              constrainLineSeparation(
                nextAngle,
                lineTwoAngle,
                lineOneAngle,
                minimumLineSeparation,
              ),
            );
          }}
          point={lineTwoHandle}
          tone="secondary"
        />

        <DraggablePoint
          ariaLabel="Intersection vertex O"
          bounds={{ maxX: 234, maxY: 164, minX: 86, minY: 60 }}
          label="O"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={setCenter}
          point={center}
          tone="accent"
        />
      </SvgCanvas>

      <div className="theorem-figure__summary">
        <div className="theorem-measure theorem-measure--accent">
          <strong>Blue opposite pair: ∠1 and ∠3</strong>
          <span>
            {namedAngle(1, blueAngle)} and {namedAngle(3, angle3)}
          </span>
        </div>
        <div className="theorem-measure theorem-measure--secondary">
          <strong>Orange opposite pair: ∠2 and ∠4</strong>
          <span>
            {namedAngle(2, orangeAngle)} and {namedAngle(4, angle4)}
          </span>
        </div>
      </div>

      <p className="theorem-figure__note">
        Drag O, L, or M directly while stepping through the discovery prompts. The
        live angle values should lead you to the proof, not just confirm it after
        the fact.
      </p>
    </div>
  );
}
