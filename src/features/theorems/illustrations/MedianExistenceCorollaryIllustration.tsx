import "./styles/supporting-figures.css";
import { SvgCanvas, StaticPoint } from "@/features/geometry/components";

export function MedianExistenceCorollaryIllustration() {
  return (
    <figure className="median-existence-corollary">
      <SvgCanvas
        descriptionId="median-existence-corollary-description"
        description="In scalene triangle ABC, M is the midpoint of side BC. Matching tick marks show BM congruent to MC, and segment AM is the median from A. The other two medians are not drawn."
        titleId="median-existence-corollary-title"
        title="A median from one vertex of a triangle"
        className="median-existence-corollary__svg"
        viewBox="0 0 640 300"
      >
        <line className="median-existence-corollary__side" x1="235" x2="105" y1="48" y2="235" />
        <line className="median-existence-corollary__side" x1="235" x2="540" y1="48" y2="235" />
        <line className="median-existence-corollary__side" x1="105" x2="540" y1="235" y2="235" />
        <line className="median-existence-corollary__median" x1="235" x2="322.5" y1="48" y2="235" />

        <line className="median-existence-corollary__tick" x1="213.75" x2="213.75" y1="226" y2="244" />
        <line className="median-existence-corollary__tick" x1="431.25" x2="431.25" y1="226" y2="244" />

        <StaticPoint className="median-existence-corollary__point" point={{ x: 235, y: 48 }} label="A" labelOffset={{ x: -11, y: -14 }} radius={5} />
        <StaticPoint className="median-existence-corollary__point" point={{ x: 105, y: 235 }} label="B" labelOffset={{ x: -15, y: 19 }} radius={5} />
        <StaticPoint className="median-existence-corollary__point" point={{ x: 540, y: 235 }} label="C" labelOffset={{ x: 15, y: 19 }} radius={5} />
        <StaticPoint className="median-existence-corollary__point median-existence-corollary__point--midpoint" point={{ x: 322.5, y: 235 }} label="M" labelOffset={{ x: 0, y: 24 }} radius={5.5} />

        <g className="median-existence-corollary__key">
          <rect height="52" rx="6" width="184" x="400" y="60" />
          <text x="416" y="81">
            <tspan className="median-existence-corollary__key-result">BM ≅ MC</tspan>
            <tspan x="416" dy="19">so AM is a median</tspan>
          </text>
        </g>
      </SvgCanvas>

      <figcaption>
        Only the median from A is shown. Applying midpoint existence to either
        other side gives a median from B or C in the same way.
      </figcaption>
    </figure>
  );
}
