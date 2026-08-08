import { useState } from "react";

import {
  clamp,
  circleIntersections,
  dragHandle,
  getSvgCoordinates,
  pointLabel,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";

export function ContinuityIllustration() {
  const [separation, setSeparation] = useState(106);
  const [radiusB, setRadiusB] = useState(84);
  const [dragTarget, setDragTarget] = useState<"p" | "radius" | null>(null);
  const centerA = { x: 118, y: 114 };
  const centerB = { x: 118 + separation, y: 114 };
  const radiusA = 92;
  const radiusHandle = { x: centerB.x + radiusB, y: centerB.y };
  const intersections = circleIntersections(centerA, radiusA, centerB, radiusB);

  return (
    <div className="axiom-figure">
      <svg
        aria-label="Continuity axiom illustration"
        className="axiom-figure__svg"
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setDragTarget(null);
          }
        }}
        onPointerMove={(event) => {
          if (!dragTarget) {
            return;
          }

          const nextPoint = getSvgCoordinates(event.currentTarget, event);

          if (dragTarget === "p") {
            setSeparation(clamp(nextPoint.x - centerA.x, 40, 170));
            return;
          }

          setRadiusB(clamp(nextPoint.x - centerB.x, 40, 110));
        }}
        onPointerUp={() => setDragTarget(null)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <circle
          cx={centerA.x}
          cy={centerA.y}
          fill="none"
          r={radiusA}
          stroke="#555"
          strokeWidth="2"
        />
        <circle
          cx={centerB.x}
          cy={centerB.y}
          fill="none"
          r={radiusB}
          stroke="#1f5fbf"
          strokeWidth="2"
        />
        {pointLabel(centerA, "O")}
        {dragHandle(centerB, "P", (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragTarget("p");
        })}
        {dragHandle(
          radiusHandle,
          "R",
          (event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragTarget("radius");
          },
          "secondary",
        )}
        {intersections.map((point, index) => (
          <g key={`${point.x}-${point.y}`}>
            <circle cx={point.x} cy={point.y} fill="#c25b2a" r="5" />
            <text className="axiom-figure__label" x={point.x + 8} y={point.y - 8}>
              {index === 0 ? "X" : "Y"}
            </text>
          </g>
        ))}
      </svg>

      <p className="axiom-figure__note">
        {intersections.length === 2
          ? "Each circle has points inside and outside the other, so circle-circle continuity guarantees the two intersections shown."
          : "The circles do not satisfy the crossing condition in this position, so continuity does not assert an intersection."}
      </p>
    </div>
  );
}
