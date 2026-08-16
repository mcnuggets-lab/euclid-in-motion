import { classNames, type Point } from "@/features/geometry/illustrationUtils";

export type RayLineProps = {
  angleDegrees?: number;
  angleRadians?: number;
  className?: string;
  end?: Point;
  origin?: Point;
  reach?: number;
  start?: Point;
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
  through?: Point;
  type?: "ray" | "line";
};

export function RayLine({
  angleDegrees,
  angleRadians,
  className,
  end,
  origin,
  reach = 400,
  start,
  stroke = "#555555",
  strokeDasharray,
  strokeWidth = 2,
  through,
  type = "line",
}: RayLineProps) {
  let cx = 0;
  let cy = 0;
  let ux = 1;
  let uy = 0;

  if (start && end) {
    cx = start.x;
    cy = start.y;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    ux = dx / len;
    uy = dy / len;
  } else if (origin && through) {
    cx = origin.x;
    cy = origin.y;
    const dx = through.x - origin.x;
    const dy = through.y - origin.y;
    const len = Math.hypot(dx, dy) || 1;
    ux = dx / len;
    uy = dy / len;
  } else if (origin) {
    cx = origin.x;
    cy = origin.y;
    const rad =
      angleRadians !== undefined
        ? angleRadians
        : angleDegrees !== undefined
          ? (angleDegrees * Math.PI) / 180
          : 0;
    ux = Math.cos(rad);
    uy = Math.sin(rad);
  }

  const backwardReach = type === "line" ? reach : 0;
  const x1 = cx - ux * backwardReach;
  const y1 = cy - uy * backwardReach;
  const x2 = cx + ux * reach;
  const y2 = cy + uy * reach;

  return (
    <line
      className={classNames("theorem-figure__ray-line", className)}
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    />
  );
}
