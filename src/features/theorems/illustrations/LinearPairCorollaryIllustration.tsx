import "./styles/supporting-figures.css";

import { AngleSector, StaticPoint, SvgCanvas } from "@/features/geometry/components";
import { polarPointRadians as polarPoint, type Point } from "@/features/geometry/illustrationUtils";

type Ray = {
  angle: number;
  coordinate: string;
  name: string;
};

const center = { x: 320, y: 282 };
const rayLength = 214;

const rays: Ray[] = [
  { angle: 0, coordinate: "b₀ = 0°", name: "OA" },
  { angle: 30, coordinate: "b₁ = 30°", name: "OB₁" },
  { angle: 65, coordinate: "b₂ = 65°", name: "OB₂" },
  { angle: 125, coordinate: "b₃ = 125°", name: "OB₃" },
  { angle: 180, coordinate: "b₄ = 180°", name: "OC" },
];

const angles = [
  { difference: "b₁ − b₀ = 30°", fill: "rgba(31, 95, 191, 0.18)", name: "∠AOB₁", tone: "accent" as const },
  { difference: "b₂ − b₁ = 35°", fill: "rgba(194, 91, 42, 0.18)", name: "∠B₁OB₂", tone: "secondary" as const },
  { difference: "b₃ − b₂ = 60°", fill: "rgba(31, 95, 191, 0.18)", name: "∠B₂OB₃", tone: "accent" as const },
  { difference: "b₄ − b₃ = 55°", fill: "rgba(194, 91, 42, 0.18)", name: "∠B₃OC", tone: "secondary" as const },
];

function rayLabelPosition(ray: Ray, index: number): Point {
  const point = polarPoint(center, 246, (-ray.angle * Math.PI) / 180);
  if (index === 0 || index === rays.length - 1) {
    return { x: point.x, y: point.y - 2 };
  }
  return point;
}

export function LinearPairCorollaryIllustration() {
  return (
    <figure className="linear-pair-corollary">
      <SvgCanvas
        className="theorem-figure__svg linear-pair-corollary__svg"
        description="Five unevenly spaced ordered rays have degree marks b zero through b four, starting from ray OA. Each of the four adjacent angles is labelled by the difference of its boundary-ray coordinates."
        descriptionId="linear-pair-corollary-description"
        title="Several adjacent angles partitioning a straight angle"
        titleId="linear-pair-corollary-title"
        viewBox="0 0 640 390"
      >
        {angles.map((angle, index) => {
          const startDegrees = rays[index].angle;
          const endDegrees = rays[index + 1].angle;
          const labelPoint = polarPoint(
            center,
            112,
            (-((startDegrees + endDegrees) / 2) * Math.PI) / 180,
          );
          return (
            <g key={angle.name}>
              <AngleSector
                endAngle={(-startDegrees * Math.PI) / 180}
                fill={angle.fill}
                radius={158}
                startAngle={(-endDegrees * Math.PI) / 180}
                tone={angle.tone}
                vertex={center}
              />
              <text
                className="linear-pair-corollary__angle-label"
                x={labelPoint.x}
                y={labelPoint.y - 4}
              >
                <tspan x={labelPoint.x}>{angle.name}</tspan>
                <tspan className="linear-pair-corollary__difference" dy="18" x={labelPoint.x}>
                  {angle.difference}
                </tspan>
              </text>
            </g>
          );
        })}

        <path
          className="theorem-figure__straight-arc"
          d="M 534 282 A 214 214 0 0 0 106 282"
        />

        {rays.map((ray, index) => {
          const endpoint = polarPoint(center, rayLength, (-ray.angle * Math.PI) / 180);
          const label = rayLabelPosition(ray, index);
          return (
            <g key={ray.coordinate}>
              <line
                className="linear-pair-corollary__ray"
                x1={center.x}
                x2={endpoint.x}
                y1={center.y}
                y2={endpoint.y}
              />
              <text
                className="linear-pair-corollary__ray-label"
                x={label.x}
                y={label.y - 6}
              >
                <tspan x={label.x}>{ray.name}</tspan>
                <tspan className="linear-pair-corollary__coordinate" dy="18" x={label.x}>
                  {ray.coordinate}
                </tspan>
              </text>
            </g>
          );
        })}

        <StaticPoint label="O" labelOffset={{ x: 0, y: 24 }} point={center} tone="accent" />

        <g className="linear-pair-corollary__key">
          <rect height="50" rx="6" width="424" x="108" y="326" />
          <text x="124" y="346">
            <tspan className="linear-pair-corollary__key-term">bᵢ</tspan>
            <tspan> is the degree mark of the i-th ray,</tspan>
            <tspan x="124" dy="18">starting from OA where b₀ = 0°.</tspan>
          </text>
        </g>
      </SvgCanvas>

      <figcaption>
        Each angle&apos;s size is the difference between the degree marks of its
        ending and starting rays.
      </figcaption>
    </figure>
  );
}
