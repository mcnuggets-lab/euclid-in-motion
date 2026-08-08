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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
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
