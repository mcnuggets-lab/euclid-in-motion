import "./styles/alternate-interior-converse.css";


type Point = {
  x: number;
  y: number;
};

type CorollaryDiagramKind = "corresponding" | "same-side";

const pointP = { x: 260, y: 87 };
const pointQ = { x: 365, y: 210 };
const lineDirection = {
  x: Math.cos((17 * Math.PI) / 180),
  y: Math.sin((17 * Math.PI) / 180),
};
const transversalLength = Math.hypot(pointQ.x - pointP.x, pointQ.y - pointP.y);
const transversalDirection = {
  x: (pointQ.x - pointP.x) / transversalLength,
  y: (pointQ.y - pointP.y) / transversalLength,
};

function move(point: Point, direction: Point, distance: number): Point {
  return {
    x: point.x + direction.x * distance,
    y: point.y + direction.y * distance,
  };
}

const points = {
  a: move(pointP, lineDirection, -120),
  b: move(pointQ, lineDirection, 120),
  c: move(pointQ, lineDirection, -120),
  d: move(pointQ, transversalDirection, 107),
  e: move(pointP, lineDirection, 120),
  p: pointP,
  q: pointQ,
  r: move(pointP, transversalDirection, -82),
} satisfies Record<string, Point>;

const lineEndpoints = {
  lStart: move(pointP, lineDirection, -242),
  lEnd: move(pointP, lineDirection, 368),
  mStart: move(pointQ, lineDirection, -352),
  mEnd: move(pointQ, lineDirection, 258),
  tStart: move(pointP, transversalDirection, -99),
  tEnd: move(pointQ, transversalDirection, 124),
};

function normalizedAngle(value: number) {
  const fullTurn = Math.PI * 2;
  return ((value % fullTurn) + fullTurn) % fullTurn;
}

function polarPoint(vertex: Point, radius: number, angle: number): Point {
  return {
    x: vertex.x + radius * Math.cos(angle),
    y: vertex.y + radius * Math.sin(angle),
  };
}

function angleArcPath(
  vertex: Point,
  firstRayPoint: Point,
  secondRayPoint: Point,
  radius = 18,
) {
  const firstAngle = normalizedAngle(
    Math.atan2(firstRayPoint.y - vertex.y, firstRayPoint.x - vertex.x),
  );
  const secondAngle = normalizedAngle(
    Math.atan2(secondRayPoint.y - vertex.y, secondRayPoint.x - vertex.x),
  );
  let startAngle = firstAngle;
  let sweep = normalizedAngle(secondAngle - firstAngle);

  if (sweep > Math.PI) {
    startAngle = secondAngle;
    sweep = Math.PI * 2 - sweep;
  }

  const start = polarPoint(vertex, radius, startAngle);
  const end = polarPoint(vertex, radius, startAngle + sweep);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

function ConverseCorollaryDiagram({ kind }: { kind: CorollaryDiagramKind }) {
  const isCorresponding = kind === "corresponding";
  const idPrefix = `alternate-converse-${kind}-corollary`;
  const secondAnglePath = isCorresponding
    ? angleArcPath(points.q, points.d, points.c)
    : angleArcPath(points.q, points.c, points.p);

  return (
    <figure className="alternate-converse-corollary">
      <svg
        aria-labelledby={`${idPrefix}-title ${idPrefix}-description`}
        className="theorem-figure__svg alternate-converse-corollary__svg"
        role="img"
        viewBox="0 0 640 320"
      >
        <title id={`${idPrefix}-title`}>
          {isCorresponding
            ? "Congruent corresponding angles formed by two lines and a transversal"
            : "Supplementary same-side interior angles formed by two lines and a transversal"}
        </title>
        <desc id={`${idPrefix}-description`}>
          Lines ℓ and m are cut by transversal t at P and Q. The highlighted
          angles are the hypothesis. The lines have no parallel arrow marks
          because their parallelism is the conclusion of the corollary.
        </desc>

        <line
          className="alternate-converse-corollary__line"
          x1={lineEndpoints.lStart.x}
          x2={lineEndpoints.lEnd.x}
          y1={lineEndpoints.lStart.y}
          y2={lineEndpoints.lEnd.y}
        />
        <line
          className="alternate-converse-corollary__line"
          x1={lineEndpoints.mStart.x}
          x2={lineEndpoints.mEnd.x}
          y1={lineEndpoints.mStart.y}
          y2={lineEndpoints.mEnd.y}
        />
        <line
          className="alternate-converse-corollary__line alternate-converse-corollary__line--transversal"
          x1={lineEndpoints.tStart.x}
          x2={lineEndpoints.tEnd.x}
          y1={lineEndpoints.tStart.y}
          y2={lineEndpoints.tEnd.y}
        />

        <path
          className="alternate-converse-corollary__angle alternate-converse-corollary__angle--first"
          d={angleArcPath(points.p, points.a, points.q)}
        />
        <path
          className={`alternate-converse-corollary__angle ${
            isCorresponding
              ? "alternate-converse-corollary__angle--corresponding"
              : "alternate-converse-corollary__angle--same-side"
          }`}
          d={secondAnglePath}
        />

        {Object.entries({
          A: points.a,
          B: points.b,
          C: points.c,
          D: points.d,
          E: points.e,
          P: points.p,
          Q: points.q,
          R: points.r,
        }).map(([label, point]) => (
          <circle
            className="alternate-converse-corollary__point"
            cx={point.x}
            cy={point.y}
            key={`point-${label}`}
            r={label === "P" || label === "Q" ? 4 : 3}
          />
        ))}

        <text className="alternate-converse-corollary__point-label" x="134" y="43">A</text>
        <text className="alternate-converse-corollary__point-label" x="491" y="253">B</text>
        <text className="alternate-converse-corollary__point-label" x="239" y="171">C</text>
        <text className="alternate-converse-corollary__point-label" x="423" y="308">D</text>
        <text className="alternate-converse-corollary__point-label" x="387" y="120">E</text>
        <text className="alternate-converse-corollary__point-label" x="247" y="82">P</text>
        <text className="alternate-converse-corollary__point-label" x="378" y="207">Q</text>
        <text className="alternate-converse-corollary__point-label" x="193" y="26">R</text>

        <text className="alternate-converse-corollary__line-label" x="606" y="184">ℓ</text>
        <text className="alternate-converse-corollary__line-label" x="606" y="276">m</text>
        <text className="alternate-converse-corollary__line-label" x="454" y="302">t</text>
      </svg>
    </figure>
  );
}

export function CorrespondingAnglesConverseCorollaryIllustration() {
  return <ConverseCorollaryDiagram kind="corresponding" />;
}

export function SameSideInteriorConverseCorollaryIllustration() {
  return <ConverseCorollaryDiagram kind="same-side" />;
}
