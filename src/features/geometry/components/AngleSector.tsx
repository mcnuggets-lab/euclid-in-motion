import type { ReactNode } from "react";

import {
  classNames,
  polarPointRadians as polarPoint,
  type Point,
} from "@/features/geometry/illustrationUtils";

export type AngleSectorState = "normal" | "focused" | "muted" | "shared";
export type AngleSectorTone = "accent" | "secondary" | "neutral";

export type AngleSectorProps = {
  className?: string;
  degreeLabel?: ReactNode;
  endAngle: number;
  fill?: string;
  indexLabel?: ReactNode;
  radius?: number;
  startAngle: number;
  state?: AngleSectorState;
  tone?: AngleSectorTone;
  vertex: Point;
};

export function AngleSector({
  className,
  degreeLabel,
  endAngle,
  fill,
  indexLabel,
  radius = 44,
  startAngle,
  state = "normal",
  tone = "accent",
  vertex,
}: AngleSectorProps) {
  const start = polarPoint(vertex, radius, startAngle);
  const end = polarPoint(vertex, radius, endAngle);
  const span = endAngle - startAngle;
  const largeArc = span > Math.PI ? 1 : 0;

  const d = [
    `M ${vertex.x} ${vertex.y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");

  const midAngle = startAngle + span / 2;
  const degreePos = polarPoint(vertex, radius * 0.77, midAngle);
  const indexPos = polarPoint(vertex, radius * 0.55, midAngle);

  const fallbackFill =
    tone === "accent"
      ? "rgba(31, 95, 191, 0.18)"
      : tone === "secondary"
        ? "rgba(194, 91, 42, 0.18)"
        : "rgba(100, 100, 100, 0.15)";

  const sectorClass = classNames(
    "theorem-figure__sector",
    state === "focused" && "theorem-figure__sector--focused",
    state === "muted" && "theorem-figure__sector--muted",
    state === "shared" && "theorem-figure__sector--shared",
    className,
  );

  return (
    <g className="theorem-figure__sector-group">
      <path className={sectorClass} d={d} fill={fill ?? fallbackFill} />
      {degreeLabel ? (
        <text
          className="theorem-figure__label"
          dominantBaseline="middle"
          textAnchor="middle"
          x={degreePos.x}
          y={degreePos.y}
        >
          {degreeLabel}
        </text>
      ) : null}
      {indexLabel ? (
        <text
          className="theorem-figure__index"
          dominantBaseline="middle"
          textAnchor="middle"
          x={indexPos.x}
          y={indexPos.y}
        >
          {indexLabel}
        </text>
      ) : null}
    </g>
  );
}
