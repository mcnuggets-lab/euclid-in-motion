import "./styles/supporting-figures.css";


export function CongruentLinearPairCorollaryIllustration() {
  return (
    <figure className="congruent-linear-pair">
      <svg
        aria-labelledby="congruent-linear-pair-title congruent-linear-pair-description"
        className="theorem-figure__svg congruent-linear-pair__svg"
        role="img"
        viewBox="0 0 640 300"
      >
        <title id="congruent-linear-pair-title">
          A congruent linear pair forming perpendicular lines
        </title>
        <desc id="congruent-linear-pair-description">
          Opposite rays OA and OC form a straight line. Ray OB divides the straight
          angle into two congruent angles of 90 degrees, so line OB is perpendicular
          to line AC.
        </desc>

        <path
          className="congruent-linear-pair__sector congruent-linear-pair__sector--left"
          d="M 320 220 L 320 140 A 80 80 0 0 0 240 220 Z"
        />
        <path
          className="congruent-linear-pair__sector congruent-linear-pair__sector--right"
          d="M 320 220 L 400 220 A 80 80 0 0 0 320 140 Z"
        />

        <line className="congruent-linear-pair__line" x1="60" x2="580" y1="220" y2="220" />
        <line className="congruent-linear-pair__line" x1="320" x2="320" y1="220" y2="44" />

        <path
          className="congruent-linear-pair__right-angle"
          d="M 294 220 L 294 194 L 320 194"
        />
        <path
          className="congruent-linear-pair__right-angle"
          d="M 320 194 L 346 194 L 346 220"
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

        <circle className="congruent-linear-pair__point" cx="560" cy="220" r="5" />
        <circle className="congruent-linear-pair__point" cx="320" cy="54" r="5" />
        <circle className="congruent-linear-pair__point" cx="80" cy="220" r="5" />
        <circle className="congruent-linear-pair__point" cx="320" cy="220" r="5" />
        <text className="congruent-linear-pair__point-label" x="570" y="210">A</text>
        <text className="congruent-linear-pair__point-label" x="332" y="52">B</text>
        <text className="congruent-linear-pair__point-label" x="66" y="210">C</text>
        <text className="congruent-linear-pair__point-label" x="330" y="240">O</text>
      </svg>

      <figcaption>
        Congruent angles have the same size: <i>x + x = 180°</i>, so each angle is
        90°. The right-angle marks show that the containing lines are perpendicular.
      </figcaption>
    </figure>
  );
}
