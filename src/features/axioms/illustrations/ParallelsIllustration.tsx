import { useState } from "react";

import {
  DraggablePoint,
  ParallelMarker,
  RayLine,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { clamp, polarPointRadians as polarPoint } from "@/features/geometry/illustrationUtils";

export function ParallelsIllustration() {
  const [baseAngle, setBaseAngle] = useState(18);
  const [trialAngle, setTrialAngle] = useState(18);

  const baseCenter = { x: 126, y: 84 };
  const pointP = { x: 208, y: 150 };
  const radians = (baseAngle * Math.PI) / 180;
  const trialRadians = (trialAngle * Math.PI) / 180;

  const baseHandle = polarPoint(baseCenter, 62, -radians);
  const trialHandle = polarPoint(pointP, 62, -trialRadians);

  const matches = Math.abs(baseAngle - trialAngle) < 1;

  return (
    <div className="axiom-figure">
      <SvgCanvas aria-label="Parallel axiom illustration" className="axiom-figure__svg">
        <RayLine angleDegrees={-baseAngle} origin={baseCenter} type="line" />
        <RayLine
          angleDegrees={-baseAngle}
          origin={pointP}
          stroke="#1f5fbf"
          type="line"
        />
        <RayLine
          angleDegrees={-trialAngle}
          origin={pointP}
          stroke="#c25b2a"
          strokeDasharray="6 5"
          type="line"
        />

        <ParallelMarker point={baseCenter} count={1} />
        <ParallelMarker point={pointP} count={1} />

        <StaticPoint label="P" labelOffset={{ x: -10, y: -10 }} point={pointP} />

        <DraggablePoint
          ariaLabel="Base line control handle L"
          label="L"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => {
            const nextAngle = Math.atan2(
              baseCenter.y - nextPoint.y,
              nextPoint.x - baseCenter.x,
            );
            setBaseAngle(clamp((nextAngle * 180) / Math.PI, -20, 45));
          }}
          point={baseHandle}
          tone="accent"
        />

        <DraggablePoint
          ariaLabel="Trial line control handle M"
          label="M"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => {
            const nextAngle = Math.atan2(
              pointP.y - nextPoint.y,
              nextPoint.x - pointP.x,
            );
            setTrialAngle(clamp((nextAngle * 180) / Math.PI, -20, 45));
          }}
          point={trialHandle}
          tone="secondary"
        />
      </SvgCanvas>

      <p className="axiom-figure__note">
        {matches
          ? "The line through P is parallel to L."
          : "Trial line M intersects L if extended; Playfair's axiom states that exactly one angle through P produces no intersection."}
      </p>
    </div>
  );
}
