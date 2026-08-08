import { useState } from "react";

import {
  clamp,
  dragHandle,
  getSvgCoordinates,
  pointLabel,
  svgHeight,
  svgWidth,
} from "@/features/geometry/illustrationUtils";


function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

export function ProtractorIllustration() {
  const [coordinate, setCoordinate] = useState(62);
  const [isDragging, setIsDragging] = useState(false);
  const center = { x: 160, y: 160 };
  const figureLabel = `Protractor illustration. Ray OB points to ${Math.round(
    coordinate,
  )} degrees, so angle AOB is ${Math.round(
    coordinate,
  )} degrees and angle BOC is ${Math.round(180 - coordinate)} degrees.`;
  const radians = (coordinate * Math.PI) / 180;
  const rayEnd = {
    x: center.x + Math.cos(radians) * 92,
    y: center.y - Math.sin(radians) * 92,
  };
  const arcRadius = 46;
  const arcEnd = {
    x: center.x + Math.cos(radians) * arcRadius,
    y: center.y - Math.sin(radians) * arcRadius,
  };
  const labelRadians = radians / 2;
  const angleLabel = {
    x: center.x + Math.cos(labelRadians) * 66,
    y: center.y - Math.sin(labelRadians) * 66,
  };

  return (
    <div className="axiom-figure">
      <svg
        aria-label={figureLabel}
        className="axiom-figure__svg"
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (!isDragging) {
            return;
          }

          const point = getSvgCoordinates(event.currentTarget, event);
          const nextCoordinate =
            (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
          setCoordinate(clamp(nextCoordinate, 5, 175));
        }}
        onPointerUp={() => setIsDragging(false)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <path
          d={`M ${center.x + arcRadius} ${center.y} A ${arcRadius} ${arcRadius} 0 0 0 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="#1f5fbf"
          strokeWidth="2"
        />
        <line
          stroke="#555"
          strokeWidth="2"
          x1="28"
          x2="292"
          y1={center.y}
          y2={center.y}
        />
        <line
          stroke="#1f5fbf"
          strokeWidth="2"
          x1={center.x}
          x2={rayEnd.x}
          y1={center.y}
          y2={rayEnd.y}
        />
        <text className="axiom-figure__label" x="250" y="188">
          0°
        </text>
        <text className="axiom-figure__label" x="44" y="188">
          180°
        </text>
        <text className="axiom-figure__label" x={angleLabel.x} y={angleLabel.y}>
          {degreeLabel(coordinate)}
        </text>
        {pointLabel({ x: 280, y: center.y }, "A")}
        {pointLabel({ x: 40, y: center.y }, "C")}
        {pointLabel(center, "O")}
        {dragHandle(
          rayEnd,
          "B",
          (event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
          },
          "secondary",
        )}
      </svg>

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
        Each angle size comes from subtracting degree marks on the same 0°–180°
        scale.
      </p>
    </div>
  );
}
