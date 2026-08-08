import {
  angleFrom,
  polarPointRadians as polarPoint,
  type Point,
} from "@/features/geometry/illustrationUtils";
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
    <>
      <circle
        className="triangle-angle-sum-corollary__point"
        cx={point.x}
        cy={point.y}
        r="4.5"
      />
      <text
        className="triangle-angle-sum-corollary__point-label"
        x={point.x}
        y={point.y + (label === "A" || label === "D" ? -13 : 20)}
      >
        {label}
      </text>
    </>
  );
}

export function TriangleExteriorAngleSumCorollaryIllustration() {
  const pointA = { x: 220, y: 48 };
  const pointB = { x: 82, y: 238 };
  const pointC = { x: 402, y: 238 };
  const pointD = { x: 560, y: 238 };

  return (
    <figure className="triangle-angle-sum-corollary">
      <svg
        aria-labelledby="triangle-exterior-sum-title triangle-exterior-sum-description"
        className="theorem-figure__svg triangle-angle-sum-corollary__svg"
        role="img"
        viewBox="0 0 640 300"
      >
        <title id="triangle-exterior-sum-title">
          Exterior angle and its two remote interior angles
        </title>
        <desc id="triangle-exterior-sum-description">
          Triangle ABC has side BC extended through C to D. Blue angle BAC and
          orange angle ABC are the remote interior angles. Purple angle ACD is
          the exterior angle equal to their sum.
        </desc>

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
      </svg>
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
      <svg
        aria-labelledby="triangle-third-angle-title triangle-third-angle-description"
        className="theorem-figure__svg triangle-angle-sum-corollary__svg"
        role="img"
        viewBox="0 0 640 300"
      >
        <title id="triangle-third-angle-title">
          Two triangles with two congruent angle pairs
        </title>
        <desc id="triangle-third-angle-description">
          Triangles ABC and DEF have matching blue angles at A and D and
          matching orange angles at B and E. Their remaining purple angles at C
          and F are congruent by the Third Angle Theorem.
        </desc>

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
      </svg>
    </figure>
  );
}
