import { classNames, type Point } from "@/features/geometry/illustrationUtils";

export type ParallelMarkerProps = {
  angle?: number; // radians
  className?: string;
  count?: 1 | 2;
  direction?: Point;
  end?: Point;
  point?: Point;
  size?: number;
  spacing?: number;
  start?: Point;
  stroke?: string;
  strokeWidth?: number;
};

export function ParallelMarker({
  angle,
  className,
  count = 1,
  direction: explicitDirection,
  end,
  point: explicitPoint,
  size = 7,
  spacing = 5,
  start,
  stroke = "#23805a",
  strokeWidth = 2,
}: ParallelMarkerProps) {
  // Determine center point
  let cx = 0;
  let cy = 0;
  if (explicitPoint) {
    cx = explicitPoint.x;
    cy = explicitPoint.y;
  } else if (start && end) {
    cx = (start.x + end.x) / 2;
    cy = (start.y + end.y) / 2;
  }

  // Determine direction unit vector
  let ux = 1;
  let uy = 0;

  if (explicitDirection) {
    const len = Math.hypot(explicitDirection.x, explicitDirection.y) || 1;
    ux = explicitDirection.x / len;
    uy = explicitDirection.y / len;
  } else if (start && end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    ux = dx / len;
    uy = dy / len;
  } else if (angle !== undefined) {
    ux = Math.cos(angle);
    uy = Math.sin(angle);
  }

  // Perpendicular normal vector
  const nx = -uy;
  const ny = ux;
  const wingSpan = size * 0.7;

  const chevrons: number[] = [];
  if (count === 1) {
    chevrons.push(0);
  } else {
    chevrons.push(-spacing / 2, spacing / 2);
  }

  return (
    <g className={classNames("theorem-figure__parallel-marker", className)}>
      {chevrons.map((offset, index) => {
        const tipX = cx + ux * offset;
        const tipY = cy + uy * offset;
        const wing1X = tipX - ux * size + nx * wingSpan;
        const wing1Y = tipY - uy * size + ny * wingSpan;
        const wing2X = tipX - ux * size - nx * wingSpan;
        const wing2Y = tipY - uy * size - ny * wingSpan;

        const d = `M ${wing1X} ${wing1Y} L ${tipX} ${tipY} L ${wing2X} ${wing2Y}`;

        return (
          <path
            key={index}
            d={d}
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        );
      })}
    </g>
  );
}
