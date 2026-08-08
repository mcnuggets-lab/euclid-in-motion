import { useState } from "react";

import {
  hatchMark,
  midpoint,
  pointLabel,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";


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

function segmentDirection(first: Point, second: Point): Point {
  return {
    x: second.x - first.x,
    y: second.y - first.y,
  };
}

function offsetAlongSegment(
  point: Point,
  direction: Point,
  distance: number,
): Point {
  const length = Math.hypot(direction.x, direction.y) || 1;
  return {
    x: point.x + (direction.x / length) * distance,
    y: point.y + (direction.y / length) * distance,
  };
}

function doubleHatch(
  center: Point,
  direction: Point,
  keyPrefix: string,
  stroke: string,
) {
  return (
    <>
      {hatchMark(
        offsetAlongSegment(center, direction, -6),
        direction,
        7,
        `${keyPrefix}-first`,
        stroke,
      )}
      {hatchMark(
        offsetAlongSegment(center, direction, 6),
        direction,
        7,
        `${keyPrefix}-second`,
        stroke,
      )}
    </>
  );
}

function angleArcPath(
  vertex: Point,
  startDegrees: number,
  endDegrees: number,
  radius: number,
) {
  const start = pointFromAngle(vertex, startDegrees, radius);
  const end = pointFromAngle(vertex, endDegrees, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`;
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

  const baseDirection = segmentDirection(firstVertex, firstBaseEnd);
  const sideDirection = segmentDirection(firstVertex, firstSideEnd);
  const copyBaseDirection = segmentDirection(secondVertex, secondBaseEnd);
  const copySideDirection = segmentDirection(secondVertex, secondSideEnd);
  const firstAngleLabel = pointFromAngle(firstVertex, includedAngle / 2, 34);
  const secondAngleLabel = pointFromAngle(
    secondVertex,
    copyRotation + includedAngle / 2,
    34,
  );

  return (
    <div className="axiom-figure">
      <svg
        aria-label="SAS congruence postulate illustration"
        className="axiom-figure__svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
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

        <path
          d={angleArcPath(firstVertex, 0, includedAngle, 24)}
          fill="none"
          stroke="#c25b2a"
          strokeWidth="2"
        />
        <path
          d={angleArcPath(
            secondVertex,
            copyRotation,
            copyRotation + includedAngle,
            24,
          )}
          fill="none"
          stroke="#c25b2a"
          strokeWidth="2"
        />

        {hatchMark(midpoint(firstVertex, firstBaseEnd), baseDirection, 7, "ab-mark")}
        {hatchMark(
          midpoint(secondVertex, secondBaseEnd),
          copyBaseDirection,
          7,
          "a-prime-b-prime-mark",
        )}
        {doubleHatch(
          midpoint(firstVertex, firstSideEnd),
          sideDirection,
          "ac-mark",
          "#1f5fbf",
        )}
        {doubleHatch(
          midpoint(secondVertex, secondSideEnd),
          copySideDirection,
          "a-prime-c-prime-mark",
          "#1f5fbf",
        )}

        <text
          className="axiom-figure__label"
          x={firstAngleLabel.x - 14}
          y={firstAngleLabel.y}
        >
          {degreeLabel(includedAngle)}
        </text>
        <text
          className="axiom-figure__label"
          x={secondAngleLabel.x - 14}
          y={secondAngleLabel.y}
        >
          {degreeLabel(includedAngle)}
        </text>

        {pointLabel(firstVertex, "A")}
        {pointLabel(firstBaseEnd, "B")}
        {pointLabel(firstSideEnd, "C")}
        {pointLabel(secondVertex, "A′")}
        {pointLabel(secondBaseEnd, "B′")}
        {pointLabel(secondSideEnd, "C′")}
      </svg>

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
          <strong>Given angle pair</strong>
          <span>∠BAC ≅ ∠B′A′C′</span>
        </div>
      </div>

      <p className="axiom-figure__note">
        This figure illustrates that matching two sides and the included angle
        fixes a triangle's shape up to relocation. In this axiomatic treatment,
        SAS is assumed as a postulate; the picture illustrates it but does not
        prove it.
      </p>
    </div>
  );
}
