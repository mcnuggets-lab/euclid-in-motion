import { useState } from "react";

import {
  clamp,
  dragHandle,
  getSvgCoordinates,
  lineEndpointsFromPoints,
  pointLabel,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";


export function ParallelsIllustration() {
  const [baseAngle, setBaseAngle] = useState(18);
  const [trialAngle, setTrialAngle] = useState(18);
  const [dragTarget, setDragTarget] = useState<"base" | "trial" | null>(null);
  const baseCenter = { x: 126, y: 84 };
  const pointP = { x: 208, y: 150 };
  const radians = (baseAngle * Math.PI) / 180;
  const trialRadians = (trialAngle * Math.PI) / 180;
  const baseDirection = { x: Math.cos(radians), y: Math.sin(radians) };
  const trialDirection = { x: Math.cos(trialRadians), y: Math.sin(trialRadians) };
  const baseHandle = {
    x: baseCenter.x + baseDirection.x * 62,
    y: baseCenter.y + baseDirection.y * 62,
  };
  const trialHandle = {
    x: pointP.x + trialDirection.x * 62,
    y: pointP.y + trialDirection.y * 62,
  };
  const baseLine = lineEndpointsFromPoints(
    {
      x: baseCenter.x - baseDirection.x * 40,
      y: baseCenter.y - baseDirection.y * 40,
    },
    {
      x: baseCenter.x + baseDirection.x * 40,
      y: baseCenter.y + baseDirection.y * 40,
    },
  );
  const parallelLine = lineEndpointsFromPoints(
    {
      x: pointP.x - baseDirection.x * 40,
      y: pointP.y - baseDirection.y * 40,
    },
    {
      x: pointP.x + baseDirection.x * 40,
      y: pointP.y + baseDirection.y * 40,
    },
  );
  const trialLine = lineEndpointsFromPoints(
    {
      x: pointP.x - trialDirection.x * 40,
      y: pointP.y - trialDirection.y * 40,
    },
    {
      x: pointP.x + trialDirection.x * 40,
      y: pointP.y + trialDirection.y * 40,
    },
  );
  const matches = Math.abs(baseAngle - trialAngle) < 1;

  return (
    <div className="axiom-figure">
      <svg
        aria-label="Parallel axiom illustration"
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

          if (dragTarget === "base") {
            const nextAngle = Math.atan2(
              baseCenter.y - nextPoint.y,
              nextPoint.x - baseCenter.x,
            );
            setBaseAngle(clamp((nextAngle * 180) / Math.PI, -20, 45));
            return;
          }

          const nextAngle = Math.atan2(pointP.y - nextPoint.y, nextPoint.x - pointP.x);
          setTrialAngle(clamp((nextAngle * 180) / Math.PI, -20, 45));
        }}
        onPointerUp={() => setDragTarget(null)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <line
          stroke="#555"
          strokeWidth="2"
          x1={baseLine.x1}
          x2={baseLine.x2}
          y1={baseLine.y1}
          y2={baseLine.y2}
        />
        <line
          stroke="#1f5fbf"
          strokeWidth="2"
          x1={parallelLine.x1}
          x2={parallelLine.x2}
          y1={parallelLine.y1}
          y2={parallelLine.y2}
        />
        <line
          stroke="#c25b2a"
          strokeDasharray="6 5"
          strokeWidth="2"
          x1={trialLine.x1}
          x2={trialLine.x2}
          y1={trialLine.y1}
          y2={trialLine.y2}
        />
        {dragHandle(baseHandle, "L", (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragTarget("base");
        })}
        {dragHandle(
          trialHandle,
          "T",
          (event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragTarget("trial");
          },
          "secondary",
        )}
        {pointLabel(pointP, "P")}
      </svg>

      <p className="axiom-figure__note">
        {matches
          ? "The blue line is the parallel through P. Playfair's Axiom says no second line through P can also avoid the gray line."
          : "The dashed trial line differs from the designated parallel through P; when extended, it meets the gray line."}
      </p>
    </div>
  );
}
