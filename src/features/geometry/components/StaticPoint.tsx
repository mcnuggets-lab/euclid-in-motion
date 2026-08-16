import type { ReactNode } from "react";

import { classNames, type Point } from "@/features/geometry/illustrationUtils";

export type StaticPointTone = "accent" | "secondary" | "neutral" | "constructed" | "muted";

export type StaticPointProps = {
  className?: string;
  fill?: string;
  label?: ReactNode;
  labelOffset?: Point;
  point: Point;
  radius?: number;
  showLabel?: boolean;
  tone?: StaticPointTone;
};

const defaultLabelOffset: Point = { x: 0, y: -10 };

export function StaticPoint({
  className,
  fill,
  label,
  labelOffset = defaultLabelOffset,
  point,
  radius = 4.5,
  showLabel = true,
  tone = "neutral",
}: StaticPointProps) {
  const toneClass = classNames(
    "theorem-figure__point",
    tone === "accent" && "theorem-figure__point--accent",
    tone === "secondary" && "theorem-figure__point--secondary",
    tone === "constructed" && "theorem-figure__point--constructed",
    tone === "muted" && "theorem-figure__point--muted",
    className,
  );

  const fallbackFill =
    tone === "accent"
      ? "#1f5fbf"
      : tone === "secondary"
        ? "#c25b2a"
        : tone === "constructed"
          ? "#23805a"
          : tone === "muted"
            ? "#999999"
            : "#333333";

  return (
    <g className="theorem-figure__point-group">
      <circle
        className={toneClass}
        cx={point.x}
        cy={point.y}
        fill={fill ?? fallbackFill}
        r={radius}
      />
      {showLabel && label !== undefined && label !== null ? (
        <text
          className="theorem-figure__point-label"
          textAnchor="middle"
          x={point.x + labelOffset.x}
          y={point.y + labelOffset.y}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
