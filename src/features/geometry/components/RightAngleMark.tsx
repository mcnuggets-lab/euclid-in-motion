import { classNames, type Point } from "@/features/geometry/illustrationUtils";

export type RightAngleMarkProps = {
  className?: string;
  fill?: string;
  firstPoint: Point;
  secondPoint: Point;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  vertex: Point;
};

export function RightAngleMark({
  className,
  fill = "none",
  firstPoint,
  secondPoint,
  size = 12,
  stroke = "#555555",
  strokeWidth = 1.5,
  vertex,
}: RightAngleMarkProps) {
  const d1x = firstPoint.x - vertex.x;
  const d1y = firstPoint.y - vertex.y;
  const len1 = Math.hypot(d1x, d1y) || 1;
  const u1x = d1x / len1;
  const u1y = d1y / len1;

  const d2x = secondPoint.x - vertex.x;
  const d2y = secondPoint.y - vertex.y;
  const len2 = Math.hypot(d2x, d2y) || 1;
  const u2x = d2x / len2;
  const u2y = d2y / len2;

  const p1 = {
    x: vertex.x + u1x * size,
    y: vertex.y + u1y * size,
  };
  const corner = {
    x: vertex.x + (u1x + u2x) * size,
    y: vertex.y + (u1y + u2y) * size,
  };
  const p2 = {
    x: vertex.x + u2x * size,
    y: vertex.y + u2y * size,
  };

  const d = `M ${p1.x} ${p1.y} L ${corner.x} ${corner.y} L ${p2.x} ${p2.y}`;

  return (
    <path
      className={classNames("theorem-figure__right-angle-mark", className)}
      d={d}
      fill={fill}
      stroke={stroke}
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeWidth={strokeWidth}
    />
  );
}
