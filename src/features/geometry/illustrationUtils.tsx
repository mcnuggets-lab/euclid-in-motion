import type { PointerEvent } from "react";

import type { Point } from "@/features/geometry/geometryPrimitives";

export type {
  ApexBounds,
  Point,
  RayIntersection,
} from "@/features/geometry/geometryPrimitives";

export {
  angleBetweenPoints,
  angleFrom,
  circleIntersections,
  clamp,
  constrainApexToBounds,
  constrainLineSeparation,
  distance,
  formatDisplayNumber,
  intersectRays,
  lineEndpointsFromPoints,
  midpoint,
  minorArcPath,
  pointAlong,
  pointToLineDistance,
  polarPointRadians,
  projectPointOntoLine,
} from "@/features/geometry/geometryPrimitives";

export function classNames(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(" ");
}

export const svgHeight = 220;
export const svgWidth = 320;


export function getSvgCoordinates(
  svg: SVGSVGElement,
  event: { clientX: number; clientY: number },
) {
  const rect = svg.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * svgWidth,
    y: ((event.clientY - rect.top) / rect.height) * svgHeight,
  };
}

export function dragHandle(
  point: Point,
  label: string,
  onPointerDown: (event: PointerEvent<SVGCircleElement>) => void,
  tone: "accent" | "secondary" = "accent",
) {
  const className =
    tone === "accent"
      ? "axiom-figure__handle axiom-figure__handle--accent"
      : "axiom-figure__handle axiom-figure__handle--secondary";

  return (
    <>
      <circle
        className={className}
        cx={point.x}
        cy={point.y}
        onPointerDown={onPointerDown}
        r="7"
      />
      <text className="axiom-figure__label" x={point.x + 10} y={point.y - 10}>
        {label}
      </text>
    </>
  );
}

export function hatchMark(
  center: Point,
  direction: Point,
  size = 8,
  key: string,
  stroke = "#1f5fbf",
) {
  const length = Math.hypot(direction.x, direction.y) || 1;
  const nx = (-direction.y / length) * size;
  const ny = (direction.x / length) * size;

  return (
    <line
      key={key}
      stroke={stroke}
      strokeWidth="2"
      x1={center.x - nx}
      x2={center.x + nx}
      y1={center.y - ny}
      y2={center.y + ny}
    />
  );
}

export function pointLabel(point: Point, label: string) {
  return (
    <>
      <circle cx={point.x} cy={point.y} fill="#1f5fbf" r="5" />
      <text className="axiom-figure__label" x={point.x + 8} y={point.y - 8}>
        {label}
      </text>
    </>
  );
}
