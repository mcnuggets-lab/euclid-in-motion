import { useState } from "react";

import {
  AngleArc,
  DraggablePoint,
  RayLine,
  Segment,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { clamp, polarPointRadians as polarPoint } from "@/features/geometry/illustrationUtils";

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

export function ProtractorIllustration() {
  const [coordinate, setCoordinate] = useState(62);
  const center = { x: 160, y: 160 };
  const pointA = { x: 280, y: center.y };
  const pointC = { x: 40, y: center.y };

  const figureLabel = `Protractor illustration. Ray OB points to ${Math.round(
    coordinate,
  )} degrees, so angle AOB is ${Math.round(
    coordinate,
  )} degrees and angle BOC is ${Math.round(180 - coordinate)} degrees.`;

  const radians = (coordinate * Math.PI) / 180;
  const rayEnd = polarPoint(center, 92, -radians);

  return (
    <div className="axiom-figure">
      <SvgCanvas aria-label={figureLabel} className="axiom-figure__svg">
        <AngleArc
          endAngle={0}
          label={degreeLabel(coordinate)}
          labelRadius={66}
          radius={46}
          startAngle={-radians}
          tone="accent"
          vertex={center}
        />

        <RayLine origin={pointC} through={pointA} type="line" />
        <Segment end={rayEnd} start={center} tone="accent" />

        <text className="axiom-figure__label" x="250" y="188">
          0°
        </text>
        <text className="axiom-figure__label" x="44" y="188">
          180°
        </text>

        <StaticPoint label="A" labelOffset={{ x: 0, y: 16 }} point={pointA} />
        <StaticPoint label="C" labelOffset={{ x: 0, y: 16 }} point={pointC} />
        <StaticPoint label="O" labelOffset={{ x: 0, y: 16 }} point={center} />

        <DraggablePoint
          ariaLabel="Ray endpoint B"
          label="B"
          labelOffset={{ x: 10, y: -10 }}
          onDrag={(point) => {
            const nextCoordinate =
              (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
            setCoordinate(clamp(nextCoordinate, 5, 175));
          }}
          point={rayEnd}
          tone="secondary"
        />
      </SvgCanvas>

      <div className="axiom-figure__measurements">
        <div className="axiom-measure">
          <strong>OB on the scale</strong>
          <span>OB is at {degreeLabel(coordinate)}</span>
        </div>
        <div className="axiom-measure">
          <strong>Angle AOB</strong>
          <span>∠AOB = {degreeLabel(coordinate)}</span>
        </div>
        <div className="axiom-measure">
          <strong>Angle BOC</strong>
          <span>∠BOC = {degreeLabel(180 - coordinate)}</span>
        </div>
      </div>

      <p className="axiom-figure__note">
        Every ray on one side of a line receives a unique coordinate from 0° to 180°.
      </p>
    </div>
  );
}
