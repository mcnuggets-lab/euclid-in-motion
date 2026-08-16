import { useState } from "react";

import {
  DraggablePoint,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { circleIntersections, clamp } from "@/features/geometry/illustrationUtils";

export function ContinuityIllustration() {
  const [separation, setSeparation] = useState(106);
  const [radiusB, setRadiusB] = useState(84);

  const centerA = { x: 118, y: 114 };
  const centerB = { x: 118 + separation, y: 114 };
  const radiusA = 92;
  const radiusHandle = { x: centerB.x + radiusB, y: centerB.y };
  const intersections = circleIntersections(centerA, radiusA, centerB, radiusB);

  return (
    <div className="axiom-figure">
      <SvgCanvas aria-label="Continuity axiom illustration" className="axiom-figure__svg">
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

        <StaticPoint label="O" point={centerA} labelOffset={{ x: 8, y: -8 }} />
        <DraggablePoint
          ariaLabel="Circle center P"
          bounds={{ minX: centerA.x + 40, maxX: centerA.x + 170 }}
          label="P"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => setSeparation(clamp(nextPoint.x - centerA.x, 40, 170))}
          point={centerB}
          tone="accent"
        />

        <DraggablePoint
          ariaLabel="Circle radius handle R"
          label="R"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => setRadiusB(clamp(nextPoint.x - centerB.x, 40, 110))}
          point={radiusHandle}
          tone="secondary"
        />

        {intersections.map((point, index) => (
          <StaticPoint
            key={`${point.x}-${point.y}`}
            label={index === 0 ? "X" : "Y"}
            labelOffset={{ x: 8, y: -8 }}
            point={point}
            tone="secondary"
          />
        ))}
      </SvgCanvas>

      <p className="axiom-figure__note">
        {intersections.length === 2
          ? "Each circle has points inside and outside the other, so circle-circle continuity guarantees the two intersections shown."
          : "The circles do not satisfy the crossing condition in this position, so continuity does not assert an intersection."}
      </p>
    </div>
  );
}
