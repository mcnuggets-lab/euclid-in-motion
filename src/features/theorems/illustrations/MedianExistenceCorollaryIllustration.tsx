import "./styles/supporting-figures.css";


export function MedianExistenceCorollaryIllustration() {
  return (
    <figure className="median-existence-corollary">
      <svg
        aria-labelledby="median-existence-corollary-title median-existence-corollary-description"
        className="theorem-figure__svg median-existence-corollary__svg"
        role="img"
        viewBox="0 0 640 300"
      >
        <title id="median-existence-corollary-title">
          A median from one vertex of a triangle
        </title>
        <desc id="median-existence-corollary-description">
          In scalene triangle ABC, M is the midpoint of side BC. Matching tick
          marks show BM congruent to MC, and segment AM is the median from A.
          The other two medians are not drawn.
        </desc>

        <line className="median-existence-corollary__side" x1="235" x2="105" y1="48" y2="235" />
        <line className="median-existence-corollary__side" x1="235" x2="540" y1="48" y2="235" />
        <line className="median-existence-corollary__side" x1="105" x2="540" y1="235" y2="235" />
        <line className="median-existence-corollary__median" x1="235" x2="322.5" y1="48" y2="235" />

        <line className="median-existence-corollary__tick" x1="213.75" x2="213.75" y1="226" y2="244" />
        <line className="median-existence-corollary__tick" x1="431.25" x2="431.25" y1="226" y2="244" />

        <circle className="median-existence-corollary__point" cx="235" cy="48" r="5" />
        <circle className="median-existence-corollary__point" cx="105" cy="235" r="5" />
        <circle className="median-existence-corollary__point" cx="540" cy="235" r="5" />
        <circle className="median-existence-corollary__point median-existence-corollary__point--midpoint" cx="322.5" cy="235" r="5.5" />

        <text className="median-existence-corollary__label" x="224" y="34">A</text>
        <text className="median-existence-corollary__label" x="90" y="254">B</text>
        <text className="median-existence-corollary__label" x="555" y="254">C</text>
        <text className="median-existence-corollary__label median-existence-corollary__label--midpoint" x="322.5" y="259">M</text>

        <g className="median-existence-corollary__key">
          <rect height="52" rx="6" width="184" x="400" y="60" />
          <text x="416" y="81">
            <tspan className="median-existence-corollary__key-result">BM ≅ MC</tspan>
            <tspan x="416" dy="19">so AM is a median</tspan>
          </text>
        </g>
      </svg>

      <figcaption>
        Only the median from A is shown. Applying midpoint existence to either
        other side gives a median from B or C in the same way.
      </figcaption>
    </figure>
  );
}
