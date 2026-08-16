import { useState } from "react";

import {
  DraggablePoint,
  RayLine,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { type Point } from "@/features/geometry/illustrationUtils";
import { projectPointOntoLine } from "@/features/geometry/geometryPrimitives";

const snapDistance = 8;

export function IncidenceIllustration() {
  const [pointA] = useState<Point>({ x: 72, y: 76 });
  const [pointB, setPointB] = useState<Point>({ x: 242, y: 148 });
  const [pointC, setPointC] = useState<Point>({ x: 120, y: 170 });
  const [isPointCSnapped, setIsPointCSnapped] = useState(false);

  return (
    <div className="axiom-figure">
      <SvgCanvas aria-label="Incidence axiom illustration" className="axiom-figure__svg">
        <RayLine origin={pointA} through={pointB} type="line" />

        <StaticPoint label="A" labelOffset={{ x: 8, y: -8 }} point={pointA} />
        <DraggablePoint
          ariaLabel="Line defining point B"
          bounds={{ minX: 110, maxX: 290, minY: 36, maxY: 188 }}
          label="B"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPointB) => {
            setPointB(nextPointB);
            if (isPointCSnapped) {
              setPointC(projectPointOntoLine(pointC, pointA, nextPointB));
            }
          }}
          point={pointB}
          tone="accent"
        />

        <DraggablePoint
          ariaLabel="Query point C"
          bounds={{ minX: 34, maxX: 286, minY: 34, maxY: 188 }}
          label="C"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPointC) => {
            const snappedPointC = projectPointOntoLine(nextPointC, pointA, pointB);
            const distanceToLine = Math.hypot(
              nextPointC.x - snappedPointC.x,
              nextPointC.y - snappedPointC.y,
            );

            if (distanceToLine <= snapDistance) {
              setPointC(snappedPointC);
              setIsPointCSnapped(true);
            } else {
              setPointC(nextPointC);
              setIsPointCSnapped(false);
            }
          }}
          point={pointC}
          tone="secondary"
        />
      </SvgCanvas>

      <p className="axiom-figure__note">
        {isPointCSnapped
          ? "C lies on the same line as A and B."
          : "Drag C near line AB to snap it exactly onto the line. Otherwise, A and B still determine one unique line while C remains off that line."}
      </p>
    </div>
  );
}
