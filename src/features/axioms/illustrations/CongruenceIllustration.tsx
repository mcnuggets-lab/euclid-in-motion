import { useState } from "react";

import {
  clamp,
  dragHandle,
  getSvgCoordinates,
  hatchMark,
  pointLabel,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";


export function CongruenceIllustration() {
  const [length, setLength] = useState(96);
  const [angleDegrees, setAngleDegrees] = useState(28);
  const [dragTarget, setDragTarget] = useState<"b" | "d" | null>(null);
  const sourceStart = { x: 46, y: 76 };
  const sourceEnd = { x: 46 + length, y: 76 };
  const copyStart = { x: 170, y: 156 };
  const radians = (angleDegrees * Math.PI) / 180;
  const copyEnd = {
    x: copyStart.x + Math.cos(radians) * length,
    y: copyStart.y - Math.sin(radians) * length,
  };
  const direction = {
    x: sourceEnd.x - sourceStart.x,
    y: sourceEnd.y - sourceStart.y,
  };
  const copyDirection = {
    x: copyEnd.x - copyStart.x,
    y: copyEnd.y - copyStart.y,
  };

  return (
    <div className="axiom-figure">
      <svg
        aria-label="Congruence axiom illustration"
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
            setLength(clamp(nextPoint.x - sourceStart.x, 48, 132));
            return;
          }

          const nextAngle = Math.atan2(
            copyStart.y - nextPoint.y,
            nextPoint.x - copyStart.x,
          );
          setAngleDegrees(clamp((nextAngle * 180) / Math.PI, 10, 70));
        }}
        onPointerUp={() => setDragTarget(null)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <line
          stroke="#555"
          strokeWidth="2"
          x1={sourceStart.x}
          x2={sourceEnd.x}
          y1={sourceStart.y}
          y2={sourceEnd.y}
        />
        <line
          stroke="#888"
          strokeDasharray="4 4"
          strokeWidth="2"
          x1={copyStart.x}
          x2={copyStart.x + Math.cos(radians) * 120}
          y1={copyStart.y}
          y2={copyStart.y - Math.sin(radians) * 120}
        />
        <line
          stroke="#1f5fbf"
          strokeWidth="2"
          x1={copyStart.x}
          x2={copyEnd.x}
          y1={copyStart.y}
          y2={copyEnd.y}
        />
        {pointLabel(sourceStart, "A")}
        {dragHandle(sourceEnd, "B", (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragTarget("b");
        })}
        {pointLabel(copyStart, "C")}
        {dragHandle(copyEnd, "D", (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragTarget("d");
        })}
        {hatchMark(
          { x: (sourceStart.x + sourceEnd.x) / 2, y: sourceStart.y },
          direction,
          7,
          "source-mark",
        )}
        {hatchMark(
          { x: (copyStart.x + copyEnd.x) / 2, y: (copyStart.y + copyEnd.y) / 2 },
          copyDirection,
          7,
          "copy-mark",
        )}
      </svg>

      <p className="axiom-figure__note">
        The copied segment on ray CD stays congruent to AB as the construction changes.
      </p>
    </div>
  );
}
