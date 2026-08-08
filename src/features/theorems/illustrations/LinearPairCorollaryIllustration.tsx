import "./styles/supporting-figures.css";


type Point = {
  x: number;
  y: number;
};

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
  { difference: "b₁ − b₀ = 30°", fill: "rgba(31, 95, 191, 0.18)", name: "∠AOB₁" },
  { difference: "b₂ − b₁ = 35°", fill: "rgba(194, 91, 42, 0.18)", name: "∠B₁OB₂" },
  { difference: "b₃ − b₂ = 60°", fill: "rgba(31, 95, 191, 0.18)", name: "∠B₂OB₃" },
  { difference: "b₄ − b₃ = 55°", fill: "rgba(194, 91, 42, 0.18)", name: "∠B₃OC" },
];

function polarPoint(radius: number, angleDegrees: number): Point {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: center.x + Math.cos(radians) * radius,
    y: center.y - Math.sin(radians) * radius,
  };
}

function sectorPath(radius: number, startDegrees: number, endDegrees: number) {
  const start = polarPoint(radius, startDegrees);
  const end = polarPoint(radius, endDegrees);
  return [
    `M ${center.x} ${center.y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function rayLabelPosition(ray: Ray, index: number): Point {
  const point = polarPoint(246, ray.angle);
  if (index === 0 || index === rays.length - 1) {
    return { x: point.x, y: point.y - 2 };
  }
  return point;
}

export function LinearPairCorollaryIllustration() {
  return (
    <figure className="linear-pair-corollary">
      <svg
        aria-labelledby="linear-pair-corollary-title linear-pair-corollary-description"
        className="theorem-figure__svg linear-pair-corollary__svg"
        role="img"
        viewBox="0 0 640 390"
      >
        <title id="linear-pair-corollary-title">
          Several adjacent angles partitioning a straight angle
        </title>
        <desc id="linear-pair-corollary-description">
          Five unevenly spaced ordered rays have degree marks b zero through b
          four, starting from ray OA. Each of the four adjacent angles is labelled
          by the difference of its boundary-ray coordinates.
        </desc>

        {angles.map((angle, index) => {
          const startAngle = rays[index].angle;
          const endAngle = rays[index + 1].angle;
          const labelPoint = polarPoint(112, (startAngle + endAngle) / 2);
          return (
            <g key={angle.name}>
              <path
                className="linear-pair-corollary__sector"
                d={sectorPath(158, startAngle, endAngle)}
                fill={angle.fill}
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
          const endpoint = polarPoint(rayLength, ray.angle);
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

        <circle cx={center.x} cy={center.y} fill="#1f5fbf" r="5" />
        <text className="linear-pair-corollary__origin" x={center.x} y={center.y + 24}>
          O
        </text>

        <g className="linear-pair-corollary__key">
          <rect height="50" rx="6" width="424" x="108" y="326" />
          <text x="124" y="346">
            <tspan className="linear-pair-corollary__key-term">bᵢ</tspan>
            <tspan> is the degree mark of the i-th ray,</tspan>
            <tspan x="124" dy="18">starting from OA where b₀ = 0°.</tspan>
          </text>
        </g>
      </svg>

      <figcaption>
        Each angle&apos;s size is the difference between the degree marks of its
        ending and starting rays.
      </figcaption>
    </figure>
  );
}
