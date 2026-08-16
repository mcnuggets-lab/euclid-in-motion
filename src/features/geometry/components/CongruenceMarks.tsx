import { midpoint, type Point } from "@/features/geometry/illustrationUtils";

export type CongruenceMarksProps = {
  center?: Point;
  className?: string;
  count?: 1 | 2 | 3;
  end?: Point;
  size?: number;
  spacing?: number;
  start?: Point;
  stroke?: string;
  strokeWidth?: number;
};

export function CongruenceMarks({
  center: explicitCenter,
  className,
  count = 1,
  end,
  size = 10,
  spacing = 5,
  start,
  stroke = "#1f5fbf",
  strokeWidth = 2,
}: CongruenceMarksProps) {
  if (!start && !end && !explicitCenter) {
    return null;
  }

  const p1 = start ?? { x: 0, y: 0 };
  const p2 = end ?? { x: 10, y: 0 };
  const center = explicitCenter ?? midpoint(p1, p2);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  // Normal vector perpendicular to segment
  const nx = (-uy * size) / 2;
  const ny = (ux * size) / 2;

  const offsets: number[] = [];
  if (count === 1) {
    offsets.push(0);
  } else if (count === 2) {
    offsets.push(-spacing / 2, spacing / 2);
  } else if (count === 3) {
    offsets.push(-spacing, 0, spacing);
  }

  return (
    <g className={className}>
      {offsets.map((offset, index) => {
        const cx = center.x + ux * offset;
        const cy = center.y + uy * offset;

        return (
          <line
            key={index}
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            x1={cx - nx}
            x2={cx + nx}
            y1={cy - ny}
            y2={cy + ny}
          />
        );
      })}
    </g>
  );
}
