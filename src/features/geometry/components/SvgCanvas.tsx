import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { classNames, svgHeight, svgWidth } from "@/features/geometry/illustrationUtils";

export type SvgCanvasProps = ComponentPropsWithoutRef<"svg"> & {
  children?: ReactNode;
  description?: string;
  descriptionId?: string;
  title?: string;
  titleId?: string;
};

export function SvgCanvas({
  children,
  className,
  description,
  descriptionId,
  style,
  title,
  titleId,
  viewBox = `0 0 ${svgWidth} ${svgHeight}`,
  ...rest
}: SvgCanvasProps) {
  const mergedStyle = {
    touchAction: "none",
    ...style,
  };

  return (
    <svg
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={classNames("theorem-figure__svg", className)}
      role="img"
      style={mergedStyle}
      viewBox={viewBox}
      {...rest}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {description ? <desc id={descriptionId}>{description}</desc> : null}
      {children}
    </svg>
  );
}
