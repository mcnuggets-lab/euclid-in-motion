import type { ReactNode } from "react";

import { CongruenceMarks } from "@/features/geometry/components/CongruenceMarks";
import { classNames, type Point } from "@/features/geometry/illustrationUtils";

export type SegmentTone = "neutral" | "accent" | "secondary" | "constructed" | "muted";

export type SegmentProps = {
  className?: string;
  end: Point;
  label?: ReactNode;
  labelOffset?: Point;
  marks?: 1 | 2 | 3;
  markSize?: number;
  markStroke?: string;
  start: Point;
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
  tone?: SegmentTone;
};

export function Segment({
  className,
  end,
  label,
  labelOffset = { x: 0, y: -8 },
  marks,
  markSize,
  markStroke,
  start,
  stroke,
  strokeDasharray,
  strokeWidth = 2,
  tone = "neutral",
}: SegmentProps) {
  const fallbackStroke =
    tone === "accent"
      ? "#1f5fbf"
      : tone === "secondary"
        ? "#c25b2a"
        : tone === "constructed"
          ? "#23805a"
          : tone === "muted"
            ? "#cccccc"
            : "#555555";

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    <g className={classNames("theorem-figure__segment", className)}>
      <line
        stroke={stroke ?? fallbackStroke}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        x1={start.x}
        x2={end.x}
        y1={start.y}
        y2={end.y}
      />
      {marks ? (
        <CongruenceMarks
          count={marks}
          end={end}
          size={markSize}
          start={start}
          stroke={markStroke ?? stroke ?? fallbackStroke}
        />
      ) : null}
      {label ? (
        <text
          className="theorem-figure__label"
          textAnchor="middle"
          x={midX + labelOffset.x}
          y={midY + labelOffset.y}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
