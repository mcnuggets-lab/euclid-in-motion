import type { PointerEvent } from "react";

import type { Point } from "@/features/geometry/geometryPrimitives";

export type {
  ApexBounds,
  Point,
  RayIntersection,
} from "@/features/geometry/geometryPrimitives";

export function classNames(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(" ");
}

export function formatDisplayNumber(value: number, fractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const digits = Math.min(10, Math.max(0, Math.trunc(fractionDigits)));
  const zeroThreshold = 0.5 * 10 ** -digits;
  const normalizedValue = Math.abs(value) < zeroThreshold ? 0 : value;
  return normalizedValue.toFixed(digits);
}

export function distance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function pointAlong(first: Point, second: Point, fraction: number): Point {
  return {
    x: first.x + (second.x - first.x) * fraction,
    y: first.y + (second.y - first.y) * fraction,
  };
}

export function angleFrom(vertex: Point, point: Point) {
  return Math.atan2(point.y - vertex.y, point.x - vertex.x);
}

export function polarPointRadians(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function circleIntersections(
  centerA: Point,
  radiusA: number,
  centerB: Point,
  radiusB: number,
) {
  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  const distance = Math.hypot(dx, dy);

  if (
    distance > radiusA + radiusB ||
    distance < Math.abs(radiusA - radiusB) ||
    distance === 0
  ) {
    return [];
  }

  const a = (radiusA ** 2 - radiusB ** 2 + distance ** 2) / (2 * distance);
  const hSquared = radiusA ** 2 - a ** 2;
  const h = hSquared > 0 ? Math.sqrt(hSquared) : 0;
  const xm = centerA.x + (a * dx) / distance;
  const ym = centerA.y + (a * dy) / distance;
  const rx = (-dy * h) / distance;
  const ry = (dx * h) / distance;

  return [
    { x: xm + rx, y: ym + ry },
    { x: xm - rx, y: ym - ry },
  ];
}

export const svgHeight = 220;
export const svgWidth = 320;

export function lineEndpointsFromPoints(first: Point, second: Point) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const reach = 400;

  return {
    x1: first.x - ux * reach,
    x2: first.x + ux * reach,
    y1: first.y - uy * reach,
    y2: first.y + uy * reach,
  };
}

export function pointToLineDistance(point: Point, first: Point, second: Point) {
  const numerator = Math.abs(
    (second.y - first.y) * point.x -
      (second.x - first.x) * point.y +
      second.x * first.y -
      second.y * first.x,
  );
  const denominator = Math.hypot(second.y - first.y, second.x - first.x) || 1;
  return numerator / denominator;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
