import { useEffect, useId, useState } from "react";

import {
  polarPointRadians,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { SvgCanvas, StaticPoint } from "@/features/geometry/components";
import type { TheoremDiscovery } from "@/features/theorems/discovery";
import "./styles/convex-polygon-angle-sum.css";

type PolygonStep = TheoremDiscovery & {
  highlightAngles?: boolean;
  showFan?: boolean;
  showTriangleTotals?: boolean;
};

const center = { x: 160, y: 110 };
const subscriptDigits = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈"];
const triangleColors = [
  "rgba(31, 95, 191, 0.16)",
  "rgba(194, 91, 42, 0.16)",
  "rgba(45, 125, 85, 0.16)",
  "rgba(128, 90, 168, 0.16)",
  "rgba(190, 139, 20, 0.18)",
  "rgba(42, 129, 151, 0.16)",
];

function polygonPoints(sideCount: number) {
  return Array.from({ length: sideCount }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sideCount;
    return {
      x: center.x + Math.cos(angle) * 104,
      y: center.y + Math.sin(angle) * 78,
    };
  });
}

function regularPolygonPoints(
  sideCount: number,
  radius: number,
  drawingCenter: Point,
) {
  return Array.from({ length: sideCount }, (_, index) =>
    polarPointRadians(
      drawingCenter,
      radius,
      -Math.PI / 2 + (index * Math.PI * 2) / sideCount,
    ),
  );
}

function pointsAttribute(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function triangleCentroid(first: Point, second: Point, third: Point) {
  return {
    x: (first.x + second.x + third.x) / 3,
    y: (first.y + second.y + third.y) / 3,
  };
}

function vertexLabelOffset(point: Point, drawingCenter = center, distance = 15) {
  const dx = point.x - drawingCenter.x;
  const dy = point.y - drawingCenter.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: (dx / length) * distance,
    y: (dy / length) * distance + 4,
  };
}

export function ConvexPolygonAngleSumIllustration({
  activeStep,
  onDiscoveryChange,
}: {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
}) {
  const sideCountId = useId();
  const [sideCount, setSideCount] = useState(6);
  const points = polygonPoints(sideCount);
  const triangleCount = sideCount - 2;
  const angleTotal = triangleCount * 180;
  const triangles = Array.from({ length: triangleCount }, (_, index) => [
    points[0],
    points[index + 1],
    points[index + 2],
  ] as const);

  const explorationStep: PolygonStep = {
    highlightAngles: true,
    insight: `A ${sideCount}-gon has ${triangleCount} fan triangles, so the illustrated interior-angle total is ${triangleCount} × 180° = ${angleTotal}°.`,
    showFan: true,
    title: "Explore the polygon",
  };
  const proofSteps: PolygonStep[] = [
    {
      insight: `The ${sideCount} vertices occur in boundary order, and convexity keeps every segment joining points of the region inside it.`,
      prompt: "Convexity is a stated property, not something inferred from how the drawing looks.",
      title: "Step 1: Choose a convex polygon",
    },
    {
      insight: `The ${Math.max(0, sideCount - 3)} diagonals from V₁ remain inside the polygon and share only V₁.`,
      prompt: "Follow every diagonal from V₁ to a nonadjacent vertex.",
      showFan: true,
      title: "Step 2: Draw the fan diagonals",
    },
    {
      insight: `The fan contains exactly ${triangleCount} triangles. Plane Separation and Crossbar justify that their interiors do not overlap and their union is the polygonal region.`,
      prompt: "The induction step removes the final triangle and leaves a smaller convex polygon.",
      showFan: true,
      title: "Step 3: Justify the partition",
    },
    {
      insight: `${triangleCount} triangle totals contribute ${triangleCount} × 180° = ${angleTotal}°.`,
      prompt: "Apply Triangle Angle Sum once to each triangle in the fan.",
      showFan: true,
      showTriangleTotals: true,
      title: "Step 4: Total the triangle angles",
    },
    {
      highlightAngles: true,
      insight: "At each vertex, Angle Addition reassembles adjacent triangle pieces into exactly one polygon interior angle.",
      prompt: "The triangular partition has no gaps or overlaps, so no angle piece is lost or counted twice.",
      showFan: true,
      title: "Step 5: Reassemble the polygon angles",
    },
    {
      highlightAngles: true,
      insight: `${sideCount} interior angles total (${sideCount} − 2)180° = ${angleTotal}°.`,
      prompt: "Each additional polygon vertex adds one triangle and another 180°.",
      showFan: true,
      title: "Step 6: Conclude the formula",
    },
  ];
  const currentStep = activeStep === null ? explorationStep : proofSteps[activeStep];

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [activeStep, onDiscoveryChange, sideCount]);

  return (
    <div className="theorem-figure convex-polygon-angle-sum">
      <SvgCanvas
        aria-label={`Convex ${sideCount}-gon divided into ${triangleCount} fan triangles`}
        className="convex-polygon-angle-sum__svg"
        viewBox="0 0 320 220"
      >
        {currentStep.showFan
          ? triangles.map((triangle, index) => (
              <polygon
                className="convex-polygon-angle-sum__triangle"
                fill={triangleColors[index % triangleColors.length]}
                key={`triangle-${index}`}
                points={pointsAttribute([...triangle])}
              />
            ))
          : null}

        <polygon
          className="convex-polygon-angle-sum__boundary"
          points={pointsAttribute(points)}
        />

        {currentStep.showFan
          ? points.slice(2, -1).map((point, index) => (
              <line
                className="convex-polygon-angle-sum__diagonal"
                key={`diagonal-${index}`}
                x1={points[0].x}
                x2={point.x}
                y1={points[0].y}
                y2={point.y}
              />
            ))
          : null}

        {currentStep.showTriangleTotals
          ? triangles.map((triangle, index) => {
              const label = triangleCentroid(...triangle);
              return (
                <text
                  className="convex-polygon-angle-sum__triangle-total"
                  key={`total-${index}`}
                  x={label.x}
                  y={label.y + 4}
                >
                  180°
                </text>
              );
            })
          : null}

        {points.map((point, index) => {
          const offset = vertexLabelOffset(point);
          return (
            <StaticPoint
              className={
                currentStep.highlightAngles
                  ? "convex-polygon-angle-sum__vertex convex-polygon-angle-sum__vertex--highlighted"
                  : "convex-polygon-angle-sum__vertex"
              }
              key={`vertex-${index}`}
              label={`V${subscriptDigits[index + 1]}`}
              labelOffset={offset}
              point={point}
              radius={currentStep.highlightAngles ? 6 : 4}
            />
          );
        })}
      </SvgCanvas>

      <div className="convex-polygon-angle-sum__controls">
        <label htmlFor={sideCountId}>
          <span>Number of sides</span>
          <strong>{sideCount}</strong>
        </label>
        <input
          aria-valuetext={`${sideCount}-sided polygon`}
          id={sideCountId}
          max="8"
          min="3"
          onChange={(event) => setSideCount(Number(event.target.value))}
          step="1"
          type="range"
          value={sideCount}
        />
      </div>

      <div className="theorem-figure__summary convex-polygon-angle-sum__summary">
        <div className="theorem-measure">
          <strong>Fan triangles</strong>
          <span>{sideCount} − 2 = {triangleCount}</span>
        </div>
        <div className="theorem-measure theorem-measure--accent">
          <strong>Interior-angle total</strong>
          <span>({sideCount} − 2)180° = {angleTotal}°</span>
        </div>
      </div>

      <p className="theorem-figure__note">
        The regular-looking example makes the count easy to see. The proof uses
        only convexity, so it does not assume equal sides or equal angles.
      </p>
    </div>
  );
}

function normalizeRadians(value: number) {
  const fullTurn = Math.PI * 2;
  return ((value % fullTurn) + fullTurn) % fullTurn;
}

function exteriorArc(vertex: Point, previous: Point, next: Point, radius: number) {
  const extensionAngle = Math.atan2(
    vertex.y - previous.y,
    vertex.x - previous.x,
  );
  const outgoingAngle = Math.atan2(next.y - vertex.y, next.x - vertex.x);
  const sweep = normalizeRadians(outgoingAngle - extensionAngle);
  const start = polarPointRadians(vertex, radius, extensionAngle);
  const end = polarPointRadians(vertex, radius, extensionAngle + sweep);
  return {
    label: polarPointRadians(vertex, radius + 12, extensionAngle + sweep / 2),
    path: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`,
  };
}

export function ConvexPolygonExteriorAngleSumCorollaryIllustration() {
  const drawingCenter = { x: 320, y: 156 };
  const points = regularPolygonPoints(5, 112, drawingCenter);
  const exteriorSize = 360 / points.length;

  return (
    <figure className="convex-polygon-exterior-sum">
      <SvgCanvas
        className="convex-polygon-exterior-sum__svg"
        description="A convex pentagon has one exterior angle at each vertex, chosen while moving clockwise around its boundary. Each angle is 72 degrees in this regular example, and the five angles total 360 degrees."
        descriptionId="convex-polygon-exterior-description"
        title="Consistently oriented exterior angles of a convex pentagon"
        titleId="convex-polygon-exterior-title"
        viewBox="0 0 640 340"
      >
        <polygon
          className="convex-polygon-exterior-sum__polygon"
          points={pointsAttribute(points)}
        />

        {points.map((point, index) => {
          const previous = points[(index - 1 + points.length) % points.length];
          const next = points[(index + 1) % points.length];
          const incomingLength = Math.hypot(
            point.x - previous.x,
            point.y - previous.y,
          );
          const extension = {
            x: point.x + ((point.x - previous.x) / incomingLength) * 42,
            y: point.y + ((point.y - previous.y) / incomingLength) * 42,
          };
          const arc = exteriorArc(point, previous, next, 25);
          return (
            <g key={`exterior-${index}`}>
              <line
                className="convex-polygon-exterior-sum__extension"
                x1={point.x}
                x2={extension.x}
                y1={point.y}
                y2={extension.y}
              />
              <path
                className="convex-polygon-exterior-sum__angle"
                d={arc.path}
              />
              <text
                className="convex-polygon-exterior-sum__angle-label"
                x={arc.label.x}
                y={arc.label.y + 4}
              >
                {exteriorSize}°
              </text>
            </g>
          );
        })}

        {points.map((point, index) => (
          <StaticPoint
            className="convex-polygon-exterior-sum__vertex"
            key={`point-${index}`}
            point={point}
            showLabel={false}
          />
        ))}

        <g className="convex-polygon-exterior-sum__result">
          <rect height="44" rx="6" width="212" x="214" y="280" />
          <text x="320" y="307">5 × 72° = 360°</text>
        </g>
      </SvgCanvas>
    </figure>
  );
}
