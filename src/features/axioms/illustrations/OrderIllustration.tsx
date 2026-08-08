import { useState } from "react";

import {
  clamp,
  dragHandle,
  getSvgCoordinates,
  pointLabel,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";


export function OrderIllustration() {
  const [pointBX, setPointBX] = useState(160);
  const [dragging, setDragging] = useState(false);
  const pointA = { x: 56, y: 112 };
  const pointB = { x: pointBX, y: 112 };
  const pointC = { x: 266, y: 112 };
  const isBetween = pointB.x > pointA.x && pointB.x < pointC.x;

  return (
    <div className="axiom-figure">
      <svg
        aria-label="Order axiom illustration"
        className="axiom-figure__svg"
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (!dragging) {
            return;
          }

          const nextPoint = getSvgCoordinates(event.currentTarget, event);
          setPointBX(clamp(nextPoint.x, 34, 286));
        }}
        onPointerUp={() => setDragging(false)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <line
          stroke="#555"
          strokeWidth="2"
          x1="24"
          x2="296"
          y1={pointA.y}
          y2={pointA.y}
        />
        {pointLabel(pointA, "A")}
        {dragHandle(
          pointB,
          "B",
          (event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          },
          "secondary",
        )}
        {pointLabel(pointC, "C")}
        {isBetween ? (
          <line
            stroke="#1f5fbf"
            strokeWidth="3"
            x1={pointA.x}
            x2={pointC.x}
            y1={pointA.y}
            y2={pointA.y}
          />
        ) : null}
      </svg>

      <p className="axiom-figure__note">
        {isBetween
          ? "B lies between A and C."
          : "B is beyond one end, so it is not between A and C."}
      </p>
    </div>
  );
}
