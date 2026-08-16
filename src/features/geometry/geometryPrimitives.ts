export type Point = {
  x: number;
  y: number;
};

export type ApexBounds = {
  maximumHeight: number;
  maximumX: number;
  minimumHeight: number;
  minimumX: number;
};

export type RayIntersection = {
  firstScale: number;
  point: Point;
  secondScale: number;
};

const rayParallelTolerance = 1e-8;
const fullTurnDegrees = 360;
const halfTurnDegrees = 180;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function distance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function pointAlong(first: Point, second: Point, fraction: number): Point {
  return {
    x: first.x + (second.x - first.x) * fraction,
    y: first.y + (second.y - first.y) * fraction,
  };
}

export function angleFrom(vertex: Point, point: Point) {
  return Math.atan2(point.y - vertex.y, point.x - vertex.x);
}

export function polarPointRadians(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function circleIntersections(
  centerA: Point,
  radiusA: number,
  centerB: Point,
  radiusB: number,
) {
  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  const dist = Math.hypot(dx, dy);

  if (
    dist > radiusA + radiusB ||
    dist < Math.abs(radiusA - radiusB) ||
    dist === 0
  ) {
    return [];
  }

  const a = (radiusA ** 2 - radiusB ** 2 + dist ** 2) / (2 * dist);
  const hSquared = radiusA ** 2 - a ** 2;
  const h = hSquared > 0 ? Math.sqrt(hSquared) : 0;
  const xm = centerA.x + (a * dx) / dist;
  const ym = centerA.y + (a * dy) / dist;
  const rx = (-dy * h) / dist;
  const ry = (dx * h) / dist;

  return [
    { x: xm + rx, y: ym + ry },
    { x: xm - rx, y: ym - ry },
  ];
}

export function lineEndpointsFromPoints(first: Point, second: Point, reach = 400) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  return {
    x1: first.x - ux * reach,
    x2: first.x + ux * reach,
    y1: first.y - uy * reach,
    y2: first.y + uy * reach,
  };
}

export function pointToLineDistance(point: Point, first: Point, second: Point) {
  const numerator = Math.abs(
    (second.y - first.y) * point.x -
      (second.x - first.x) * point.y +
      second.x * first.y -
      second.y * first.x,
  );
  const denominator = Math.hypot(second.y - first.y, second.x - first.x) || 1;
  return numerator / denominator;
}

export function formatDisplayNumber(value: number, fractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const digits = Math.min(10, Math.max(0, Math.trunc(fractionDigits)));
  const zeroThreshold = 0.5 * 10 ** -digits;
  const normalizedValue = Math.abs(value) < zeroThreshold ? 0 : value;
  return normalizedValue.toFixed(digits);
}


function cross(first: Point, second: Point) {
  return first.x * second.y - first.y * second.x;
}

function normalizeDegrees(angle: number) {
  return ((angle % fullTurnDegrees) + fullTurnDegrees) % fullTurnDegrees;
}

function signedAngleDifferenceDegrees(from: number, to: number) {
  let difference = normalizeDegrees(to - from);
  if (difference >= halfTurnDegrees) {
    difference -= fullTurnDegrees;
  }

  return difference;
}

function nearestEquivalentAngle(angle: number, reference: number) {
  return angle + fullTurnDegrees * Math.round((reference - angle) / fullTurnDegrees);
}

export function intersectRays(
  firstOrigin: Point,
  firstDirection: Point,
  secondOrigin: Point,
  secondDirection: Point,
): RayIntersection | null {
  const denominator = cross(firstDirection, secondDirection);
  if (Math.abs(denominator) < rayParallelTolerance) {
    return null;
  }

  const difference = {
    x: secondOrigin.x - firstOrigin.x,
    y: secondOrigin.y - firstOrigin.y,
  };
  const firstScale = cross(difference, secondDirection) / denominator;
  const secondScale = cross(difference, firstDirection) / denominator;

  if (firstScale <= 0 || secondScale <= 0) {
    return null;
  }

  return {
    firstScale,
    point: {
      x: firstOrigin.x + firstDirection.x * firstScale,
      y: firstOrigin.y + firstDirection.y * firstScale,
    },
    secondScale,
  };
}

export function angleBetweenPoints(center: Point, first: Point, second: Point) {
  const firstDirection = {
    x: first.x - center.x,
    y: first.y - center.y,
  };
  const secondDirection = {
    x: second.x - center.x,
    y: second.y - center.y,
  };
  const firstLength = Math.hypot(firstDirection.x, firstDirection.y) || 1;
  const secondLength = Math.hypot(secondDirection.x, secondDirection.y) || 1;
  const cosine = clamp(
    (firstDirection.x * secondDirection.x +
      firstDirection.y * secondDirection.y) /
      (firstLength * secondLength),
    -1,
    1,
  );

  return (Math.acos(cosine) * 180) / Math.PI;
}

export function constrainLineSeparation(
  candidateAngle: number,
  currentAngle: number,
  stationaryAngle: number,
  minimumSeparation: number,
) {
  const stationaryBranches = [
    normalizeDegrees(stationaryAngle),
    normalizeDegrees(stationaryAngle + halfTurnDegrees),
  ];
  const nearestBranch = stationaryBranches
    .map((branch) => ({
      branch,
      candidateOffset: signedAngleDifferenceDegrees(branch, candidateAngle),
    }))
    .sort((first, second) => {
      return Math.abs(first.candidateOffset) - Math.abs(second.candidateOffset);
    })[0];

  if (Math.abs(nearestBranch.candidateOffset) >= minimumSeparation) {
    return candidateAngle;
  }

  const currentOffset = signedAngleDifferenceDegrees(
    nearestBranch.branch,
    currentAngle,
  );
  const side = Math.sign(currentOffset) || Math.sign(nearestBranch.candidateOffset) || 1;
  const constrainedAngle = normalizeDegrees(
    nearestBranch.branch + side * minimumSeparation,
  );

  return nearestEquivalentAngle(constrainedAngle, currentAngle);
}

export function projectPointOntoLine(point: Point, first: Point, second: Point): Point {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const magnitudeSquared = dx * dx + dy * dy;

  if (magnitudeSquared === 0) {
    return { ...first };
  }

  const scale =
    ((point.x - first.x) * dx + (point.y - first.y) * dy) / magnitudeSquared;

  return {
    x: first.x + dx * scale,
    y: first.y + dy * scale,
  };
}

export function minorArcPath(
  center: Point,
  first: Point,
  second: Point,
  radius: number,
) {
  const startAngle = Math.atan2(first.y - center.y, first.x - center.x);
  const endAngle = Math.atan2(second.y - center.y, second.x - center.x);
  let delta = endAngle - startAngle;

  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const start = {
    x: center.x + Math.cos(startAngle) * radius,
    y: center.y + Math.sin(startAngle) * radius,
  };
  const end = {
    x: center.x + Math.cos(startAngle + delta) * radius,
    y: center.y + Math.sin(startAngle + delta) * radius,
  };

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${end.x} ${end.y}`;
}

export function constrainApexToBounds(
  point: Point,
  baseY: number,
  bounds: ApexBounds,
) {
  return {
    height: Math.round(
      clamp(baseY - point.y, bounds.minimumHeight, bounds.maximumHeight),
    ),
    x: Math.round(clamp(point.x, bounds.minimumX, bounds.maximumX)),
  };
}
