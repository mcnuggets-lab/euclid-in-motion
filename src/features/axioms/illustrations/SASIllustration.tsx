import { useState } from "react";

import {
  AngleArc,
  CongruenceMarks,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";
import { type Point } from "@/features/geometry/illustrationUtils";

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function pointFromAngle(origin: Point, degrees: number, length: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y - Math.sin(radians) * length,
  };
}

export function SASIllustration() {
  const [baseLength, setBaseLength] = useState(82);
  const [sideLength, setSideLength] = useState(108);
  const [includedAngle, setIncludedAngle] = useState(58);
  const [copyRotation, setCopyRotation] = useState(-18);

  const firstVertex = { x: 70, y: 168 };
  const secondVertex = { x: 184, y: 154 };
  const firstBaseEnd = pointFromAngle(firstVertex, 0, baseLength);
  const firstSideEnd = pointFromAngle(firstVertex, includedAngle, sideLength);
  const secondBaseEnd = pointFromAngle(secondVertex, copyRotation, baseLength);
  const secondSideEnd = pointFromAngle(
    secondVertex,
    copyRotation + includedAngle,
    sideLength,
  );

  return (
    <div className="axiom-figure">
      <SvgCanvas
        aria-label="SAS congruence postulate illustration"
        className="axiom-figure__svg"
      >
        <polygon
          fill="rgba(85, 85, 85, 0.08)"
          points={`${firstVertex.x},${firstVertex.y} ${firstBaseEnd.x},${firstBaseEnd.y} ${firstSideEnd.x},${firstSideEnd.y}`}
          stroke="#555"
          strokeWidth="2"
        />
        <polygon
          fill="rgba(31, 95, 191, 0.08)"
          points={`${secondVertex.x},${secondVertex.y} ${secondBaseEnd.x},${secondBaseEnd.y} ${secondSideEnd.x},${secondSideEnd.y}`}
          stroke="#1f5fbf"
          strokeWidth="2"
        />

        <AngleArc
          endAngle={(-includedAngle * Math.PI) / 180}
          label={degreeLabel(includedAngle)}
          labelRadius={34}
          radius={24}
          startAngle={0}
          tone="secondary"
          vertex={firstVertex}
        />
        <AngleArc
          endAngle={((-copyRotation - includedAngle) * Math.PI) / 180}
          label={degreeLabel(includedAngle)}
          labelRadius={34}
          radius={24}
          startAngle={(-copyRotation * Math.PI) / 180}
          tone="secondary"
          vertex={secondVertex}
        />

        <CongruenceMarks count={1} end={firstBaseEnd} start={firstVertex} stroke="#555" />
        <CongruenceMarks
          count={1}
          end={secondBaseEnd}
          start={secondVertex}
          stroke="#555"
        />
        <CongruenceMarks count={2} end={firstSideEnd} start={firstVertex} stroke="#1f5fbf" />
        <CongruenceMarks
          count={2}
          end={secondSideEnd}
          start={secondVertex}
          stroke="#1f5fbf"
        />

        <StaticPoint label="A" labelOffset={{ x: -8, y: 8 }} point={firstVertex} />
        <StaticPoint label="B" labelOffset={{ x: 8, y: 8 }} point={firstBaseEnd} />
        <StaticPoint label="C" labelOffset={{ x: 0, y: -8 }} point={firstSideEnd} />

        <StaticPoint label="A′" labelOffset={{ x: -8, y: 8 }} point={secondVertex} />
        <StaticPoint label="B′" labelOffset={{ x: 8, y: 8 }} point={secondBaseEnd} />
        <StaticPoint label="C′" labelOffset={{ x: 0, y: -8 }} point={secondSideEnd} />
      </SvgCanvas>

      <div className="axiom-figure__controls">
        <label>
          AB and A′B′: {Math.round(baseLength)}
          <input
            max="96"
            min="56"
            onChange={(event) => setBaseLength(Number(event.target.value))}
            type="range"
            value={baseLength}
          />
        </label>
        <label>
          AC and A′C′: {Math.round(sideLength)}
          <input
            max="120"
            min="72"
            onChange={(event) => setSideLength(Number(event.target.value))}
            type="range"
            value={sideLength}
          />
        </label>
        <label>
          Included angle: {degreeLabel(includedAngle)}
          <input
            max="120"
            min="28"
            onChange={(event) => setIncludedAngle(Number(event.target.value))}
            type="range"
            value={includedAngle}
          />
        </label>
        <label>
          Copy orientation: {degreeLabel(copyRotation)}
          <input
            max="20"
            min="-30"
            onChange={(event) => setCopyRotation(Number(event.target.value))}
            type="range"
            value={copyRotation}
          />
        </label>
      </div>

      <div className="axiom-figure__measurements">
        <div className="axiom-measure">
          <strong>Given side pair 1</strong>
          <span>AB ≅ A′B′</span>
        </div>
        <div className="axiom-measure">
          <strong>Given side pair 2</strong>
          <span>AC ≅ A′C′</span>
        </div>
        <div className="axiom-measure">
          <strong>Given included angle</strong>
          <span>∠A ≅ ∠A′</span>
        </div>
        <div className="axiom-measure">
          <strong>Postulate conclusion</strong>
          <span>△ABC ≅ △A′B′C′</span>
        </div>
      </div>

      <p className="axiom-figure__note">
        Matching two sides and the included angle uniquely determines the entire triangle,
        regardless of position or rotation.
      </p>
    </div>
  );
}
