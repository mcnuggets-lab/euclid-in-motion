import { useEffect, useId, useState } from "react";
import "./styles/angle-addition.css";

import {
  clamp,
  getSvgCoordinates,
  pointLabel,
  svgHeight,
  svgWidth,
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
const handleRadius = 22;
const minimumEdgeCoordinate = 8;
const minimumPartMeasure = 24;
const maximumCoordinate = 180 - minimumEdgeCoordinate;
const outerRadius = 112;
const rayLength = 104;

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function polarPoint(origin: Point, radius: number, angleDegrees: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: origin.x + Math.cos(radians) * radius,
    y: origin.y - Math.sin(radians) * radius,
  };
}

function sectorPath(
  origin: Point,
  radius: number,
  startDegrees: number,
  endDegrees: number,
) {
  const start = polarPoint(origin, radius, startDegrees);
  const end = polarPoint(origin, radius, endDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;

  return [
    `M ${origin.x} ${origin.y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function arcPath(
  origin: Point,
  radius: number,
  startDegrees: number,
  endDegrees: number,
) {
  const start = polarPoint(origin, radius, startDegrees);
  const end = polarPoint(origin, radius, endDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

function coordinateFromPointer(point: Point) {
  const raw =
    (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
  return Math.round(clamp(raw, 0, 180));
}

function panelClass(isExploring: boolean, isFocused: boolean) {
  if (isExploring || isFocused) {
    return "angle-addition__panel";
  }

  return "angle-addition__panel angle-addition__panel--muted";
}

function handleClass(isDragging: boolean, tone: "accent" | "secondary") {
  return [
    "angle-addition__handle",
    tone === "accent"
      ? "angle-addition__handle--accent"
      : "angle-addition__handle--secondary",
    isDragging ? "angle-addition__handle--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
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
  const [dragTarget, setDragTarget] = useState<"b" | "c" | null>(null);

  const firstPart = b;
  const secondPart = c - b;
  const whole = c;
  const isExploring = activeStep === null;
  const obEnd = polarPoint(center, rayLength, b);
  const ocEnd = polarPoint(center, rayLength, c);
  const coordinateB = polarPoint(center, outerRadius + 12, b);
  const coordinateC = polarPoint(center, outerRadius + 22, c);
  const firstLabelPoint = polarPoint(center, 43, b / 2);
  const secondLabelPoint = polarPoint(center, 47, b + secondPart / 2);

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

      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg angle-addition__svg"
        onPointerCancel={() => setDragTarget(null)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setDragTarget(null);
          }
        }}
        onPointerMove={(event) => {
          if (!dragTarget) {
            return;
          }

          const point = getSvgCoordinates(event.currentTarget, event);
          const nextCoordinate = coordinateFromPointer(point);

          if (dragTarget === "b") {
            setB(
              clamp(
                nextCoordinate,
                minimumEdgeCoordinate,
                c - minimumPartMeasure,
              ),
            );
            return;
          }

          setC(
            clamp(
              nextCoordinate,
              b + minimumPartMeasure,
              maximumCoordinate,
            ),
          );
        }}
        onPointerUp={() => setDragTarget(null)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Angle addition interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

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
        <path
          className={[
            "theorem-figure__sector",
            !isExploring && !currentStep.focus.differences
              ? "theorem-figure__sector--muted"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          d={sectorPath(center, 56, 0, b)}
          fill="rgba(31, 95, 191, 0.18)"
        />
        <path
          className={[
            "theorem-figure__sector",
            !isExploring && !currentStep.focus.differences
              ? "theorem-figure__sector--muted"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          d={sectorPath(center, 56, b, c)}
          fill={`url(#${patternId})`}
          stroke="rgba(194, 91, 42, 0.45)"
          strokeWidth="1.2"
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

        <line
          className="angle-addition__ray angle-addition__ray--base"
          x1={center.x}
          x2={center.x + rayLength + 16}
          y1={center.y}
          y2={center.y}
        />
        <line
          className="angle-addition__ray angle-addition__ray--accent"
          x1={center.x}
          x2={obEnd.x}
          y1={center.y}
          y2={obEnd.y}
        />
        <line
          className="angle-addition__ray angle-addition__ray--secondary"
          x1={center.x}
          x2={ocEnd.x}
          y1={center.y}
          y2={ocEnd.y}
        />

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

        {pointLabel(center, "O")}
        <text className="angle-addition__point-label" x="294" y="158">
          A
        </text>
        <text className="angle-addition__point-label" x={obEnd.x + 10} y={obEnd.y - 10}>
          B
        </text>
        <text className="angle-addition__point-label" x={ocEnd.x + 10} y={ocEnd.y - 10}>
          C
        </text>

        <circle
          className="angle-addition__handle-target"
          cx={obEnd.x}
          cy={obEnd.y}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragTarget("b");
          }}
          r={handleRadius}
        />
        <circle
          className={handleClass(dragTarget === "b", "accent")}
          cx={obEnd.x}
          cy={obEnd.y}
          r="7"
        />

        <circle
          className="angle-addition__handle-target"
          cx={ocEnd.x}
          cy={ocEnd.y}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragTarget("c");
          }}
          r={handleRadius}
        />
        <circle
          className={handleClass(dragTarget === "c", "secondary")}
          cx={ocEnd.x}
          cy={ocEnd.y}
          r="7"
        />
      </svg>

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
      </div>

      <div className={panelClass(isExploring, currentStep.focus.interval)}>
        <div className="angle-addition__interval">
          <div className="angle-addition__interval-heading">
            <strong>Degree segments</strong>
            <span>0 to b plus b to c lines up with 0 to c.</span>
          </div>
          <div className="angle-addition__interval-axis" aria-hidden="true">
            <span className="angle-addition__axis-label angle-addition__axis-label--start">
              0
            </span>
            <span
              className="angle-addition__axis-label"
              style={{ left: `${(b / 180) * 100}%` }}
            >
              b
            </span>
            <span
              className="angle-addition__axis-label"
              style={{ left: `${(c / 180) * 100}%` }}
            >
              c
            </span>
          </div>
          <div className="angle-addition__interval-row" aria-hidden="true">
            <div
              className="angle-addition__segment angle-addition__segment--accent"
              style={{ width: `${(b / 180) * 100}%` }}
            >
              0 to b
            </div>
            <div
              className="angle-addition__segment angle-addition__segment--secondary"
              style={{ width: `${(secondPart / 180) * 100}%` }}
            >
              b to c
            </div>
            <div
              className="angle-addition__segment angle-addition__segment--rest"
              style={{ width: `${((180 - c) / 180) * 100}%` }}
            />
          </div>
          <div className="angle-addition__interval-row" aria-hidden="true">
            <div
              className="angle-addition__segment angle-addition__segment--whole"
              style={{ width: `${(c / 180) * 100}%` }}
            >
              0 to c
            </div>
            <div
              className="angle-addition__segment angle-addition__segment--rest"
              style={{ width: `${((180 - c) / 180) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className={panelClass(
          isExploring,
          currentStep.focus.differences ||
            currentStep.focus.interval ||
            currentStep.focus.subtraction,
        )}
      >
        <div className="angle-addition__equations">
          <div className="angle-addition__equation-row">
            <strong>Symbolic</strong>
            <span>b° + (c - b)° = c°</span>
          </div>
          <div className="angle-addition__equation-row">
            <strong>Numeric</strong>
            <span>
              {degreeLabel(firstPart)} + {degreeLabel(secondPart)} = {degreeLabel(whole)}
            </span>
          </div>
          <div
            className={[
              "angle-addition__equation-row",
              "angle-addition__equation-row--expanded",
              !isExploring && currentStep.focus.interval
                ? "angle-addition__equation-row--focus"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>Addition proof</strong>
            <span className="angle-addition__equation-expression">
              <span
                className={
                  !isExploring && currentStep.focus.interval
                    ? "angle-addition__cancel-term"
                    : undefined
                }
              >
                {degreeLabel(firstPart)}
              </span>
              {" + "}
              <span>({degreeLabel(whole)} - </span>
              <span
                className={
                  !isExploring && currentStep.focus.interval
                    ? "angle-addition__cancel-term"
                    : undefined
                }
              >
                {degreeLabel(firstPart)}
              </span>
              <span>) = {degreeLabel(whole)}</span>
            </span>
          </div>
          <div
            className={[
              "angle-addition__subtraction",
              !isExploring && currentStep.focus.subtraction
                ? "angle-addition__subtraction--focus"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="angle-addition__subtraction-row">
              <div className="angle-addition__subtraction-bar" aria-hidden="true">
                <div
                  className="angle-addition__segment angle-addition__segment--accent angle-addition__segment--removed"
                  style={{ width: `${(b / 180) * 100}%` }}
                />
                <div
                  className="angle-addition__segment angle-addition__segment--secondary"
                  style={{ width: `${(secondPart / 180) * 100}%` }}
                />
                <div
                  className="angle-addition__segment angle-addition__segment--rest"
                  style={{ width: `${((180 - c) / 180) * 100}%` }}
                />
              </div>
              <span>{degreeLabel(whole)} - {degreeLabel(firstPart)} = {degreeLabel(secondPart)}</span>
            </div>
            <div className="angle-addition__subtraction-row">
              <div className="angle-addition__subtraction-bar" aria-hidden="true">
                <div
                  className="angle-addition__segment angle-addition__segment--accent"
                  style={{ width: `${(b / 180) * 100}%` }}
                />
                <div
                  className="angle-addition__segment angle-addition__segment--secondary angle-addition__segment--removed"
                  style={{ width: `${(secondPart / 180) * 100}%` }}
                />
                <div
                  className="angle-addition__segment angle-addition__segment--rest"
                  style={{ width: `${((180 - c) / 180) * 100}%` }}
                />
              </div>
              <span>{degreeLabel(whole)} - {degreeLabel(secondPart)} = {degreeLabel(firstPart)}</span>
            </div>
          </div>
          <span
            aria-atomic="true"
            aria-live="polite"
            className="visually-hidden"
            role="status"
          >
            {announcedEquation}
          </span>
        </div>
      </div>

      <div className="angle-addition__controls">
        <label className="angle-addition__control" htmlFor="angle-addition-b">
          <span>
            <strong>Interior ray OB</strong>
            <span>b = {degreeLabel(b)}</span>
          </span>
          <input
            id="angle-addition-b"
            max={c - minimumPartMeasure}
            min={minimumEdgeCoordinate}
            onChange={(event) => setB(Number(event.target.value))}
            type="range"
            value={b}
          />
        </label>
        <label className="angle-addition__control" htmlFor="angle-addition-c">
          <span>
            <strong>Outer ray OC</strong>
            <span>c = {degreeLabel(c)}</span>
          </span>
          <input
            id="angle-addition-c"
            max={maximumCoordinate}
            min={b + minimumPartMeasure}
            onChange={(event) => setC(Number(event.target.value))}
            type="range"
            value={c}
          />
        </label>
      </div>
    </div>
  );
}
