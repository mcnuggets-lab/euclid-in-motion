import {
  angleFrom,
  polarPointRadians as polarPoint,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { SvgCanvas, StaticPoint } from "@/features/geometry/components";
import "./styles/triangle-angle-sum.css";

function normalizeRadians(value: number) {
  const fullTurn = Math.PI * 2;
  return ((value % fullTurn) + fullTurn) % fullTurn;
}

function angleArcPath(
  vertex: Point,
  first: Point,
  second: Point,
  radius: number,
) {
  const firstAngle = normalizeRadians(angleFrom(vertex, first));
  const secondAngle = normalizeRadians(angleFrom(vertex, second));
  let startAngle = firstAngle;
  let sweep = normalizeRadians(secondAngle - firstAngle);

  if (sweep > Math.PI) {
    startAngle = secondAngle;
    sweep = Math.PI * 2 - sweep;
  }

  const start = polarPoint(vertex, radius, startAngle);
  const end = polarPoint(vertex, radius, startAngle + sweep);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

function PointMarker({ label, point }: { label: string; point: Point }) {
  return (
    <StaticPoint
      className="triangle-angle-sum-corollary__point"
      point={point}
      label={label}
      labelOffset={{ x: 0, y: label === "A" || label === "D" ? -13 : 20 }}
    />
  );
}

export function TriangleExteriorAngleSumCorollaryIllustration() {
  const pointA = { x: 220, y: 48 };
  const pointB = { x: 82, y: 238 };
  const pointC = { x: 402, y: 238 };
  const pointD = { x: 560, y: 238 };

  return (
    <figure className="triangle-angle-sum-corollary">
      <SvgCanvas
        descriptionId="triangle-exterior-sum-description"
        description="Triangle ABC has side BC extended through C to D. Blue angle BAC and orange angle ABC are the remote interior angles. Purple angle ACD is the exterior angle equal to their sum."
        titleId="triangle-exterior-sum-title"
        title="Exterior angle and its two remote interior angles"
        className="triangle-angle-sum-corollary__svg"
        viewBox="0 0 640 300"
      >
        <path
          className="triangle-angle-sum-corollary__triangle"
          d={`M ${pointA.x} ${pointA.y} L ${pointB.x} ${pointB.y} L ${pointC.x} ${pointC.y} Z`}
        />
        <line
          className="triangle-angle-sum-corollary__extension"
          x1={pointC.x}
          x2={pointD.x}
          y1={pointC.y}
          y2={pointD.y}
        />

        <path
          className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--blue"
          d={angleArcPath(pointA, pointB, pointC, 22)}
        />
        <path
          className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--orange"
          d={angleArcPath(pointB, pointA, pointC, 22)}
        />
        <path
          className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--purple"
          d={angleArcPath(pointC, pointA, pointD, 24)}
        />

        <PointMarker label="A" point={pointA} />
        <PointMarker label="B" point={pointB} />
        <PointMarker label="C" point={pointC} />
        <PointMarker label="D" point={pointD} />
      </SvgCanvas>
    </figure>
  );
}

export function TriangleThirdAngleCorollaryIllustration() {
  const pointA = { x: 156, y: 34 };
  const pointB = { x: 30, y: 250 };
  const pointC = { x: 300, y: 250 };
  const pointD = { x: 492.4, y: 93.6 };
  const pointE = { x: 414, y: 228 };
  const pointF = { x: 582, y: 228 };

  return (
    <figure className="triangle-angle-sum-corollary">
      <SvgCanvas
        descriptionId="triangle-third-angle-description"
        description="Triangles ABC and DEF have matching blue angles at A and D and matching orange angles at B and E. Their remaining purple angles at C and F are congruent by the Third Angle Theorem."
        titleId="triangle-third-angle-title"
        title="Two triangles with two congruent angle pairs"
        className="triangle-angle-sum-corollary__svg"
        viewBox="0 0 640 300"
      >
        <path
          className="triangle-angle-sum-corollary__triangle"
          d={`M ${pointA.x} ${pointA.y} L ${pointB.x} ${pointB.y} L ${pointC.x} ${pointC.y} Z`}
        />
        <path
          className="triangle-angle-sum-corollary__triangle"
          d={`M ${pointD.x} ${pointD.y} L ${pointE.x} ${pointE.y} L ${pointF.x} ${pointF.y} Z`}
        />

        <path className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--blue" d={angleArcPath(pointA, pointB, pointC, 22)} />
        <path className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--blue" d={angleArcPath(pointD, pointE, pointF, 15)} />
        <path className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--orange" d={angleArcPath(pointB, pointA, pointC, 22)} />
        <path className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--orange" d={angleArcPath(pointE, pointD, pointF, 15)} />
        <path className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--purple" d={angleArcPath(pointC, pointB, pointA, 22)} />
        <path className="triangle-angle-sum-corollary__angle triangle-angle-sum-corollary__angle--purple" d={angleArcPath(pointF, pointE, pointD, 15)} />

        <PointMarker label="A" point={pointA} />
        <PointMarker label="B" point={pointB} />
        <PointMarker label="C" point={pointC} />
        <PointMarker label="D" point={pointD} />
        <PointMarker label="E" point={pointE} />
        <PointMarker label="F" point={pointF} />
      </SvgCanvas>
    </figure>
  );
}
