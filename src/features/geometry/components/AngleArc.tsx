import type { ReactNode } from "react";

import {
  angleFrom,
  classNames,
  polarPointRadians as polarPoint,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { minorArcPath } from "@/features/geometry/geometryPrimitives";

export type AngleArcTone =
  | "accent"
  | "secondary"
  | "constructed"
  | "neutral"
  | "muted"
  | "purple";

export type AngleArcProps = {
  className?: string;
  concentricCount?: 1 | 2 | 3;
  concentricSpacing?: number;
  endAngle?: number;
  endPoint?: Point;
  fill?: string;
  label?: ReactNode;
  labelRadius?: number;
  radius?: number;
  startAngle?: number;
  startPoint?: Point;
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
  tone?: AngleArcTone;
  vertex: Point;
};

export function AngleArc({
  className,
  concentricCount = 1,
  concentricSpacing = 4,
  endAngle,
  endPoint,
  fill = "none",
  label,
  labelRadius,
  radius = 24,
  startAngle,
  startPoint,
  stroke,
  strokeDasharray,
  strokeWidth = 1.5,
  tone = "neutral",
  vertex,
}: AngleArcProps) {
  // Determine start & end angles in radians
  let aStart = 0;
  let aEnd = 0;

  if (startPoint && endPoint) {
    aStart = angleFrom(vertex, startPoint);
    aEnd = angleFrom(vertex, endPoint);
  } else if (startAngle !== undefined && endAngle !== undefined) {
    aStart = startAngle;
    aEnd = endAngle;
  }

  let delta = aEnd - aStart;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const fallbackStroke =
    tone === "accent"
      ? "#1f5fbf"
      : tone === "secondary"
        ? "#c25b2a"
        : tone === "constructed"
          ? "#23805a"
          : tone === "purple"
            ? "#7c3aed"
            : tone === "muted"
              ? "#aaaaaa"
              : "#555555";

  const effectiveLabelRadius = labelRadius ?? radius + 12;
  const midAngle = aStart + delta / 2;
  const labelPos = polarPoint(vertex, effectiveLabelRadius, midAngle);

  const arcRays: number[] = [];
  for (let i = 0; i < concentricCount; i += 1) {
    arcRays.push(radius - i * concentricSpacing);
  }

  return (
    <g className={classNames("theorem-figure__angle-arc", className)}>
      {arcRays.map((r, i) => {
        let path = "";
        if (startPoint && endPoint && i === 0) {
          path = minorArcPath(vertex, startPoint, endPoint, r);
        } else {
          const pStart = polarPoint(vertex, r, aStart);
          const pEnd = polarPoint(vertex, r, aStart + delta);
          path = `M ${pStart.x} ${pStart.y} A ${r} ${r} 0 0 ${delta >= 0 ? 1 : 0} ${pEnd.x} ${pEnd.y}`;
        }

        return (
          <path
            key={i}
            d={path}
            fill={fill}
            stroke={stroke ?? fallbackStroke}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        );
      })}

      {label ? (
        <text
          className="theorem-figure__label theorem-figure__angle-label"
          dominantBaseline="middle"
          textAnchor="middle"
          x={labelPos.x}
          y={labelPos.y}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
