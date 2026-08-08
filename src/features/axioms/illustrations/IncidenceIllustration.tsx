import { useState } from "react";

import {
  clamp,
  dragHandle,
  getSvgCoordinates,
  lineEndpointsFromPoints,
  pointLabel,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { projectPointOntoLine } from "@/features/geometry/geometryPrimitives";

const snapDistance = 8;

export function IncidenceIllustration() {
  const [pointA] = useState<Point>({ x: 72, y: 76 });
  const [pointB, setPointB] = useState<Point>({ x: 242, y: 148 });
  const [pointC, setPointC] = useState<Point>({ x: 120, y: 170 });
  const [isPointCSnapped, setIsPointCSnapped] = useState(false);
  const [dragTarget, setDragTarget] = useState<"b" | "c" | null>(null);
  const line = lineEndpointsFromPoints(pointA, pointB);

  return (
    <div className="axiom-figure">
      <svg
        aria-label="Incidence axiom illustration"
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

          if (dragTarget === "b") {
            const nextPointB = {
              x: clamp(nextPoint.x, 110, 290),
              y: clamp(nextPoint.y, 36, 188),
            };
            setPointB(nextPointB);
            if (isPointCSnapped) {
              setPointC(projectPointOntoLine(pointC, pointA, nextPointB));
            }
            return;
          }

          const nextPointC = {
            x: clamp(nextPoint.x, 34, 286),
            y: clamp(nextPoint.y, 34, 188),
          };
          const snappedPointC = projectPointOntoLine(nextPointC, pointA, pointB);
          const distanceToLine = Math.hypot(
            nextPointC.x - snappedPointC.x,
            nextPointC.y - snappedPointC.y,
          );

          if (distanceToLine <= snapDistance) {
            setPointC(snappedPointC);
            setIsPointCSnapped(true);
            return;
          }

          setPointC(nextPointC);
          setIsPointCSnapped(false);
        }}
        onPointerUp={() => setDragTarget(null)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <line
          stroke="#555"
          strokeWidth="2"
          x1={line.x1}
          x2={line.x2}
          y1={line.y1}
          y2={line.y2}
        />
        {pointLabel(pointA, "A")}
        {dragHandle(pointB, "B", (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragTarget("b");
        })}
        {dragHandle(
          pointC,
          "C",
          (event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragTarget("c");
          },
          "secondary",
        )}
      </svg>

      <p className="axiom-figure__note">
        {isPointCSnapped
          ? "C lies on the same line as A and B."
          : "Drag C near line AB to snap it exactly onto the line. Otherwise, A and B still determine one unique line while C remains off that line."}
      </p>
    </div>
  );
}
