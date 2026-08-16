import { useState } from "react";

import {
  DraggablePoint,
  RayLine,
  Segment,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { clamp } from "@/features/geometry/illustrationUtils";

export function OrderIllustration() {
  const [pointBX, setPointBX] = useState(160);
  const pointA = { x: 56, y: 112 };
  const pointB = { x: pointBX, y: 112 };
  const pointC = { x: 266, y: 112 };
  const isBetween = pointB.x > pointA.x && pointB.x < pointC.x;

  return (
    <div className="axiom-figure">
      <SvgCanvas aria-label="Order axiom illustration" className="axiom-figure__svg">
        <RayLine origin={{ x: 24, y: 112 }} reach={272} type="line" />

        {isBetween ? (
          <Segment end={pointC} start={pointA} strokeWidth={3} tone="accent" />
        ) : null}

        <StaticPoint label="A" labelOffset={{ x: 8, y: -8 }} point={pointA} />
        <DraggablePoint
          ariaLabel="Point B"
          bounds={{ minX: 34, maxX: 286 }}
          label="B"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => setPointBX(clamp(nextPoint.x, 34, 286))}
          point={pointB}
          tone="secondary"
        />
        <StaticPoint label="C" labelOffset={{ x: 8, y: -8 }} point={pointC} />
      </SvgCanvas>

      <p className="axiom-figure__note">
        {isBetween
          ? "B lies between A and C."
          : "B is beyond one end, so it is not between A and C."}
      </p>
    </div>
  );
}
