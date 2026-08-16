import { useEffect, useId, useState } from "react";
import "./styles/supporting-figures.css";

import {
  AngleSector,
  DraggablePoint,
  RayLine,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import {
  polarPointRadians as polarPoint,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type AroundPointStep = TheoremDiscovery & {
  focusSectors: string[];
  showAuxiliaryRay?: boolean;
  showLowerHalf?: boolean;
  showUpperHalf?: boolean;
};

type OrderedRay = {
  angle: number;
  label: string;
  sourceIndex: number;
};

type OriginalSector = {
  end: number;
  fill: string;
  key: string;
  measure: number;
  name: string;
  start: number;
  startLabel: string;
  endLabel: string;
};

const center = { x: 160, y: 110 };
const rayLength = 96;
const rayLabels = ["A", "B", "C", "D", "E"];
const initialRayAngles: Record<number, number[]> = {
  3: [0, 92, 246],
  4: [0, 52, 128, 244],
  5: [0, 36, 102, 232, 301],
};
const sectorFills = [
  "rgba(31, 95, 191, 0.18)",
  "rgba(45, 125, 85, 0.18)",
  "rgba(194, 91, 42, 0.18)",
  "rgba(177, 130, 30, 0.18)",
  "rgba(95, 95, 95, 0.14)",
];

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function normalizeDegrees(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function signedAngleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function avoidCoincidingRay(
  candidate: number,
  current: number,
  occupiedAngles: Set<number>,
) {
  if (!occupiedAngles.has(candidate)) {
    return candidate;
  }

  const direction = signedAngleDelta(current, candidate) < 0 ? -1 : 1;
  let available = candidate;
  do {
    available = normalizeDegrees(available + direction);
  } while (occupiedAngles.has(available));
  return available;
}

function arcPath(radius: number, startDegrees: number, endDegrees: number) {
  const start = polarPoint(center, radius, (-startDegrees * Math.PI) / 180);
  const end = polarPoint(center, radius, (-endDegrees * Math.PI) / 180);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`;
}

function angleName(startLabel: string, endLabel: string) {
  return `∠${startLabel}O${endLabel}`;
}

function equation(names: string[], values: number[]) {
  return `${names.join(" + ")} = ${values.map(degreeLabel).join(" + ")} = 180°.`;
}

export function AnglesAroundPointIllustration({
  activeStep,
  onDiscoveryChange,
}: {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
}) {
  const sliderId = useId();
  const [rayAngles, setRayAngles] = useState(() => [...initialRayAngles[4]]);

  const angleCount = rayAngles.length;
  const orderedRays: OrderedRay[] = rayAngles
    .map((angle, sourceIndex) => ({
      angle,
      label: rayLabels[sourceIndex],
      sourceIndex,
    }))
    .sort((first, second) => first.angle - second.angle);

  const originalSectors: OriginalSector[] = orderedRays.map((ray, index) => {
    const nextRay = orderedRays[(index + 1) % angleCount];
    const end = nextRay.angle + (index === angleCount - 1 ? 360 : 0);
    return {
      end,
      endLabel: nextRay.label,
      fill: sectorFills[index],
      key: `${ray.label}-${nextRay.label}`,
      measure: end - ray.angle,
      name: angleName(ray.label, nextRay.label),
      start: ray.angle,
      startLabel: ray.label,
    };
  });

  const coincidentRayIndex = orderedRays.findIndex((ray) => ray.angle === 180);
  const splitSectorIndex =
    coincidentRayIndex === -1
      ? originalSectors.findIndex((sector) => sector.start < 180 && sector.end > 180)
      : -1;
  const splitSector =
    splitSectorIndex === -1 ? null : originalSectors[splitSectorIndex];
  const upperPieceName = splitSector ? angleName(splitSector.startLabel, "X") : "";
  const lowerPieceName = splitSector ? angleName("X", splitSector.endLabel) : "";
  const upperPieceMeasure = splitSector ? 180 - splitSector.start : 0;
  const lowerPieceMeasure = splitSector ? splitSector.end - 180 : 0;
  const fullTotal = originalSectors.reduce(
    (total, sector) => total + sector.measure,
    0,
  );

  const sectorPieces = originalSectors.flatMap((sector, index) => {
    if (index !== splitSectorIndex) {
      return [sector];
    }
    return [
      { ...sector, end: 180, key: `${sector.key}-upper` },
      { ...sector, key: `${sector.key}-lower`, start: 180 },
    ];
  });
  const allSectorKeys = sectorPieces.map((sector) => sector.key);

  let upperNames: string[];
  let upperValues: number[];
  let upperSectorKeys: string[];
  let lowerNames: string[];
  let lowerValues: number[];
  let lowerSectorKeys: string[];

  if (splitSector) {
    const upperSectors = originalSectors.slice(0, splitSectorIndex);
    const lowerSectors = originalSectors.slice(splitSectorIndex + 1);
    upperNames = [...upperSectors.map((sector) => sector.name), upperPieceName];
    upperValues = [
      ...upperSectors.map((sector) => sector.measure),
      upperPieceMeasure,
    ];
    upperSectorKeys = [
      ...upperSectors.map((sector) => sector.key),
      `${splitSector.key}-upper`,
    ];
    lowerNames = [lowerPieceName, ...lowerSectors.map((sector) => sector.name)];
    lowerValues = [
      lowerPieceMeasure,
      ...lowerSectors.map((sector) => sector.measure),
    ];
    lowerSectorKeys = [
      `${splitSector.key}-lower`,
      ...lowerSectors.map((sector) => sector.key),
    ];
  } else {
    const upperSectors = originalSectors.slice(0, coincidentRayIndex);
    const lowerSectors = originalSectors.slice(coincidentRayIndex);
    upperNames = upperSectors.map((sector) => sector.name);
    upperValues = upperSectors.map((sector) => sector.measure);
    upperSectorKeys = upperSectors.map((sector) => sector.key);
    lowerNames = lowerSectors.map((sector) => sector.name);
    lowerValues = lowerSectors.map((sector) => sector.measure);
    lowerSectorKeys = lowerSectors.map((sector) => sector.key);
  }

  const constructionInsight = splitSector
    ? `Construct OX opposite OA. Use OA → OX and OX → OA as two Protractor scales from 0° to 180°. The auxiliary ray splits ${splitSector.name} into coordinate differences ${upperPieceName} = ${degreeLabel(upperPieceMeasure)} and ${lowerPieceName} = ${degreeLabel(lowerPieceMeasure)}.`
    : `Ray O${orderedRays[coincidentRayIndex].label} is already opposite OA, so the two Protractor scales already use an original boundary ray.`;
  const conclusionInsight = splitSector
    ? `The successive coordinate differences telescope to 180° on each side. On a Protractor scale starting at the first side of ${splitSector.name}, OX has coordinate x° and the other side has coordinate y°, so the pieces x° and (y − x)° add to the original y°. Therefore ${originalSectors.map((sector) => sector.name).join(" + ")} = 180° + 180° = ${degreeLabel(fullTotal)}.`
    : `The successive coordinate differences telescope to 180° on each side. Therefore ${originalSectors.map((sector) => sector.name).join(" + ")} = 180° + 180° = ${degreeLabel(fullTotal)}.`;

  const explorationStep: AroundPointStep = {
    focusSectors: allSectorKeys,
    insight: `${originalSectors
      .map((sector) => `${sector.name} = ${degreeLabel(sector.measure)}`)
      .join(", ")}. The total of all ${angleCount} angles is ${degreeLabel(fullTotal)}.`,
    title: "Explore the figure",
  };

  const proofSteps: AroundPointStep[] = [
    {
      focusSectors: allSectorKeys,
      insight: constructionInsight,
      prompt: "Dashed ray OX supplies the 180° endpoint for the two Protractor coordinate scales.",
      showAuxiliaryRay: true,
      title: "Step 1: Set the two degree scales",
    },
    {
      focusSectors: upperSectorKeys,
      insight: equation(upperNames, upperValues),
      prompt: "Read the highlighted sizes as successive coordinate differences; every interior coordinate cancels in their sum.",
      showAuxiliaryRay: true,
      showUpperHalf: true,
      title: "Step 2: Telescope the upper scale",
    },
    {
      focusSectors: lowerSectorKeys,
      insight: equation(lowerNames, lowerValues),
      prompt: "The same cancellation runs from coordinate 0° to coordinate 180° on the other side.",
      showAuxiliaryRay: true,
      showLowerHalf: true,
      title: "Step 3: Telescope the lower scale",
    },
    {
      focusSectors: allSectorKeys,
      insight: conclusionInsight,
      prompt: `If OX split an original angle, verify x + (y − x) = y on a scale based at that angle's first side before recovering the ${angleCount} original angles.`,
      showAuxiliaryRay: true,
      showLowerHalf: true,
      showUpperHalf: true,
      title: "Step 4: Recover the original full turn",
    },
  ];

  const isExploring = activeStep === null;
  const currentStep = isExploring ? explorationStep : proofSteps[activeStep];

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [activeStep, onDiscoveryChange, rayAngles]);

  const angleLabels = originalSectors.map((sector, index) => ({
    labelPoint: polarPoint(
      center,
      36,
      (-((sector.start + sector.measure / 2) % 360) * Math.PI) / 180,
    ),
    namePoint: polarPoint(
      center,
      24,
      (-((sector.start + sector.measure / 2) % 360) * Math.PI) / 180,
    ),
    number: index + 1,
  }));

  const upperPieceLabel = splitSector
    ? polarPoint(center, 38, (-((splitSector.start + 180) / 2) * Math.PI) / 180)
    : null;
  const lowerPieceLabel = splitSector
    ? polarPoint(center, 38, (-((180 + splitSector.end) / 2) * Math.PI) / 180)
    : null;

  const handles = rayAngles.map((angle) =>
    polarPoint(center, rayLength, (-angle * Math.PI) / 180),
  );

  return (
    <div className="theorem-figure">
      <SvgCanvas
        aria-label={`Interactive figure with ${angleCount} angles around a point`}
        className="theorem-figure__svg"
      >
        {sectorPieces.map((sector) => {
          const isFocused =
            !isExploring && currentStep.focusSectors.includes(sector.key);
          const state = isExploring ? "normal" : isFocused ? "focused" : "muted";

          return (
            <AngleSector
              key={sector.key}
              endAngle={(-sector.start * Math.PI) / 180}
              fill={sector.fill}
              radius={48}
              startAngle={(-sector.end * Math.PI) / 180}
              state={state}
              vertex={center}
            />
          );
        })}

        {angleLabels.map((angle, index) => (
          <g key={originalSectors[index].key}>
            {currentStep.showAuxiliaryRay && index === splitSectorIndex ? null : (
              <text
                className="theorem-figure__label"
                x={angle.labelPoint.x}
                y={angle.labelPoint.y}
              >
                {degreeLabel(originalSectors[index].measure)}
              </text>
            )}
            <text
              className="theorem-figure__index"
              x={angle.namePoint.x}
              y={angle.namePoint.y}
            >
              {angle.number}
            </text>
          </g>
        ))}

        {currentStep.showAuxiliaryRay && splitSector && upperPieceLabel && lowerPieceLabel ? (
          <>
            <text
              className="theorem-figure__label"
              x={upperPieceLabel.x}
              y={upperPieceLabel.y}
            >
              {degreeLabel(upperPieceMeasure)}
            </text>
            <text
              className="theorem-figure__label"
              x={lowerPieceLabel.x}
              y={lowerPieceLabel.y}
            >
              {degreeLabel(lowerPieceMeasure)}
            </text>
          </>
        ) : null}

        {currentStep.showUpperHalf ? (
          <g>
            <path className="theorem-figure__straight-arc" d={arcPath(64, 0, 180)} />
            <text className="theorem-figure__straight-label" x="160" y="20">
              180°
            </text>
          </g>
        ) : null}
        {currentStep.showLowerHalf ? (
          <g>
            <path className="theorem-figure__straight-arc" d={arcPath(64, 180, 360)} />
            <text className="theorem-figure__straight-label" x="160" y="212">
              180°
            </text>
          </g>
        ) : null}

        <RayLine origin={center} through={{ x: 276, y: 110 }} type="ray" />
        {rayAngles.slice(1).map((_, index) => {
          const rayIndex = index + 1;
          return (
            <RayLine
              key={rayLabels[rayIndex]}
              origin={center}
              through={handles[rayIndex]}
              type="ray"
            />
          );
        })}

        {currentStep.showAuxiliaryRay ? (
          <g>
            <line
              className="angles-around-point__auxiliary"
              x1={center.x}
              x2="44"
              y1={center.y}
              y2="110"
            />
            <StaticPoint
              label="X"
              labelOffset={{ x: 8, y: -8 }}
              point={{ x: 44, y: 110 }}
              radius={5}
              tone="constructed"
            />
          </g>
        ) : null}

        <StaticPoint label="A" labelOffset={{ x: 8, y: -8 }} point={{ x: 276, y: 110 }} />
        {rayAngles.slice(1).map((_, index) => {
          const rayIndex = index + 1;
          return (
            <DraggablePoint
              key={rayLabels[rayIndex]}
              ariaLabel={`Ray O${rayLabels[rayIndex]}`}
              label={rayLabels[rayIndex]}
              labelOffset={{ x: 10, y: -10 }}
              onDrag={(point) => {
                const pointerAngle = normalizeDegrees(
                  Math.round(
                    (Math.atan2(center.y - point.y, point.x - center.x) * 180) /
                      Math.PI,
                  ),
                );
                setRayAngles((angles) => {
                  const occupiedAngles = new Set(
                    angles.filter((_, idx) => idx !== rayIndex),
                  );
                  const nextAngle = avoidCoincidingRay(
                    pointerAngle,
                    angles[rayIndex],
                    occupiedAngles,
                  );
                  return angles.map((angle, idx) =>
                    idx === rayIndex ? nextAngle : angle,
                  );
                });
              }}
              point={handles[rayIndex]}
              tone="accent"
            />
          );
        })}
        <StaticPoint label="O" labelOffset={{ x: 8, y: -8 }} point={center} tone="accent" />
      </SvgCanvas>

      <div className="angles-around-point__controls">
        <label htmlFor={sliderId}>
          <span>Number of angles</span>
          <strong>{angleCount}</strong>
        </label>
        <input
          aria-valuetext={`${angleCount} angles`}
          id={sliderId}
          max="5"
          min="3"
          onChange={(event) => {
            const nextCount = Number(event.target.value);
            setRayAngles([...initialRayAngles[nextCount]]);
          }}
          step="1"
          type="range"
          value={angleCount}
        />
      </div>

      <div className="theorem-figure__summary angles-around-point__summary">
        {originalSectors.map((sector) => (
          <div className="theorem-measure" key={sector.key}>
            <strong>{sector.name}</strong>
            <span>{degreeLabel(sector.measure)}</span>
          </div>
        ))}
        <div className="theorem-measure angles-around-point__total">
          <strong>All {angleCount} angles</strong>
          <span>Total = {degreeLabel(fullTotal)}</span>
        </div>
      </div>

      <p className="theorem-figure__note">
        Solid rays may pass one another and cross either direction of line AX.
        Dashed ray OX appears only as an auxiliary proof construction.
      </p>
    </div>
  );
}
