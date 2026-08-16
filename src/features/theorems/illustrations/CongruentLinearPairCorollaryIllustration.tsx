import "./styles/supporting-figures.css";

import {
  AngleSector,
  RightAngleMark,
  StaticPoint,
  SvgCanvas,
} from "@/features/geometry/components";

export function CongruentLinearPairCorollaryIllustration() {
  const center = { x: 320, y: 220 };
  const pointA = { x: 560, y: 220 };
  const pointB = { x: 320, y: 54 };
  const pointC = { x: 80, y: 220 };

  return (
    <figure className="congruent-linear-pair">
      <SvgCanvas
        className="theorem-figure__svg congruent-linear-pair__svg"
        description="Opposite rays OA and OC form a straight line. Ray OB divides the straight angle into two congruent angles of 90 degrees, so line OB is perpendicular to line AC."
        descriptionId="congruent-linear-pair-description"
        title="A congruent linear pair forming perpendicular lines"
        titleId="congruent-linear-pair-title"
        viewBox="0 0 640 300"
      >
        <AngleSector
          endAngle={-Math.PI / 2}
          fill="rgba(31, 95, 191, 0.18)"
          radius={80}
          startAngle={-Math.PI}
          tone="accent"
          vertex={center}
        />
        <AngleSector
          endAngle={0}
          fill="rgba(194, 91, 42, 0.18)"
          radius={80}
          startAngle={-Math.PI / 2}
          tone="secondary"
          vertex={center}
        />

        <line className="congruent-linear-pair__line" x1="60" x2="580" y1="220" y2="220" />
        <line className="congruent-linear-pair__line" x1="320" x2="320" y1="220" y2="44" />

        <RightAngleMark
          firstPoint={pointC}
          secondPoint={pointB}
          size={26}
          stroke="#444"
          vertex={center}
        />
        <RightAngleMark
          firstPoint={pointA}
          secondPoint={pointB}
          size={26}
          stroke="#444"
          vertex={center}
        />

        <text className="congruent-linear-pair__measure" x="214" y="148">
          ∠BOC = 90°
        </text>
        <text className="congruent-linear-pair__measure" x="426" y="148">
          ∠AOB = 90°
        </text>
        <text className="congruent-linear-pair__relation" x="320" y="274">
          OB ⟂ AC
        </text>

        <StaticPoint label="A" labelOffset={{ x: 10, y: -10 }} point={pointA} />
        <StaticPoint label="B" labelOffset={{ x: 12, y: -2 }} point={pointB} />
        <StaticPoint label="C" labelOffset={{ x: -14, y: -10 }} point={pointC} />
        <StaticPoint label="O" labelOffset={{ x: 10, y: 20 }} point={center} />
      </SvgCanvas>

      <figcaption>
        Congruent angles have the same size: <i>x + x = 180°</i>, so each angle is
        90°. The right-angle marks show that the containing lines are perpendicular.
      </figcaption>
    </figure>
  );
}
