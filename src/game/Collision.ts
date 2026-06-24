export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export function circleInBounds(
  cx: number,
  cy: number,
  radius: number,
  bounds: Bounds,
): boolean {
  const closestX = Math.max(bounds.x, Math.min(cx, bounds.x + bounds.width))
  const closestY = Math.max(bounds.y, Math.min(cy, bounds.y + bounds.height))
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy <= radius * radius
}
