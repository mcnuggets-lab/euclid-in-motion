import { useState } from "react";

import {
  DraggablePoint,
  RayLine,
  Segment,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { clamp } from "@/features/geometry/illustrationUtils";

export function CongruenceIllustration() {
  const [length, setLength] = useState(96);
  const [angleDegrees, setAngleDegrees] = useState(28);

  const sourceStart = { x: 46, y: 76 };
  const sourceEnd = { x: 46 + length, y: 76 };
  const copyStart = { x: 170, y: 156 };
  const radians = (angleDegrees * Math.PI) / 180;
  const copyEnd = {
    x: copyStart.x + Math.cos(radians) * length,
    y: copyStart.y - Math.sin(radians) * length,
  };

  return (
    <div className="axiom-figure">
      <SvgCanvas aria-label="Congruence axiom illustration" className="axiom-figure__svg">
        <Segment marks={1} start={sourceStart} end={sourceEnd} />
        <RayLine
          angleRadians={-radians}
          origin={copyStart}
          reach={120}
          stroke="#888"
          strokeDasharray="4 4"
          type="ray"
        />
        <Segment marks={1} start={copyStart} end={copyEnd} tone="accent" />

        <StaticPoint label="A" point={sourceStart} labelOffset={{ x: 8, y: -8 }} />
        <DraggablePoint
          ariaLabel="Segment end point B"
          bounds={{ minX: sourceStart.x + 48, maxX: sourceStart.x + 132 }}
          label="B"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => setLength(clamp(nextPoint.x - sourceStart.x, 48, 132))}
          point={sourceEnd}
          tone="accent"
        />

        <StaticPoint label="C" point={copyStart} labelOffset={{ x: 8, y: -8 }} />
        <DraggablePoint
          ariaLabel="Copied segment end point D"
          label="D"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(nextPoint) => {
            const nextAngle = Math.atan2(
              copyStart.y - nextPoint.y,
              nextPoint.x - copyStart.x,
            );
            setAngleDegrees(clamp((nextAngle * 180) / Math.PI, 10, 70));
          }}
          point={copyEnd}
          tone="accent"
        />
      </SvgCanvas>

      <p className="axiom-figure__note">
        The copied segment on ray CD stays congruent to AB as the construction changes.
      </p>
    </div>
  );
}
