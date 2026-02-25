// A single point in 2D space
export interface Point { x: number; y: number }

// A stroke is an array of points captured from mouse/touch movement
export type Stroke = Point[]

// A reference path for a single stroke of a fidel character
export interface ReferenceStroke {
  points: Point[]          // normalized 0–1 coordinate space
  stroke_index: number     // which stroke in the character (0-based)
  stroke_count: number     // total strokes in this character
}

// Result of comparing a user stroke to a reference stroke
export interface StrokeResult {
  score: number            // 0.0–1.0 (1.0 = perfect match)
  is_correct: boolean      // score >= 0.65
  hausdorff_distance: number  // raw Hausdorff distance in normalized space
}

// Full tracing session result
export interface TracingResult {
  all_correct: boolean
  strokes: StrokeResult[]
  overall_score: number    // average of all stroke scores
}

const SCORE_THRESHOLD = 0.3
const CORRECT_THRESHOLD = 0.65
const EPSILON = 1e-9

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function euclideanDistance(pointA: Point, pointB: Point): number {
  const deltaX = pointA.x - pointB.x
  const deltaY = pointA.y - pointB.y
  return Math.hypot(deltaX, deltaY)
}

function directedHausdorff(source: Stroke, target: Stroke): number {
  if (source.length === 0) {
    return 0
  }

  if (target.length === 0) {
    return Number.POSITIVE_INFINITY
  }

  let maxOfMinimumDistances = 0

  for (const sourcePoint of source) {
    let minimumDistance = Number.POSITIVE_INFINITY

    for (const targetPoint of target) {
      const currentDistance = euclideanDistance(sourcePoint, targetPoint)
      if (currentDistance < minimumDistance) {
        minimumDistance = currentDistance
      }
    }

    if (minimumDistance > maxOfMinimumDistances) {
      maxOfMinimumDistances = minimumDistance
    }
  }

  return maxOfMinimumDistances
}

function pointAtProgress(stroke: Stroke, progress: number): Point {
  if (stroke.length === 0) {
    return { x: 0, y: 0 }
  }

  if (stroke.length === 1) {
    return stroke[0]
  }

  const clampedProgress = clamp(progress, 0, 1)
  let totalLength = 0
  const segmentLengths: number[] = []

  for (let index = 0; index < stroke.length - 1; index += 1) {
    const length = euclideanDistance(stroke[index], stroke[index + 1])
    segmentLengths.push(length)
    totalLength += length
  }

  if (totalLength <= EPSILON) {
    return stroke[0]
  }

  const targetDistance = clampedProgress * totalLength
  let traversed = 0

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]
    if (segmentLength <= EPSILON) {
      continue
    }

    const nextTraversed = traversed + segmentLength
    if (targetDistance <= nextTraversed) {
      const localProgress = (targetDistance - traversed) / segmentLength
      const start = stroke[index]
      const end = stroke[index + 1]
      return {
        x: start.x + ((end.x - start.x) * localProgress),
        y: start.y + ((end.y - start.y) * localProgress)
      }
    }

    traversed = nextTraversed
  }

  return stroke[stroke.length - 1]
}

// Normalize an array of raw pixel points to 0–1 coordinate space
// based on the bounding box of the points themselves
export function normalizeStroke(stroke: Stroke, canvas_width: number, canvas_height: number): Stroke {
  if (stroke.length === 0) {
    return []
  }

  const shouldClampToCanvas = canvas_width > 0 && canvas_height > 0
  const clampedStroke = stroke.map((point) => ({
    x: shouldClampToCanvas ? clamp(point.x, 0, canvas_width) : point.x,
    y: shouldClampToCanvas ? clamp(point.y, 0, canvas_height) : point.y
  }))

  const xValues = clampedStroke.map((point) => point.x)
  const yValues = clampedStroke.map((point) => point.y)

  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)

  const width = maxX - minX
  const height = maxY - minY

  if (width <= EPSILON && height <= EPSILON) {
    return clampedStroke.map(() => ({ x: 0.5, y: 0.5 }))
  }

  return clampedStroke.map((point) => ({
    x: width <= EPSILON ? 0.5 : clamp((point.x - minX) / width, 0, 1),
    y: height <= EPSILON ? 0.5 : clamp((point.y - minY) / height, 0, 1)
  }))
}

// Calculate directed Hausdorff distance between two point sequences
// Returns max(directed_hausdorff(A→B), directed_hausdorff(B→A))
// where directed_hausdorff(A→B) = max over all a in A of min over all b in B of euclidean_distance(a, b)
export function hausdorffDistance(stroke_a: Stroke, stroke_b: Stroke): number {
  const aToB = directedHausdorff(stroke_a, stroke_b)
  const bToA = directedHausdorff(stroke_b, stroke_a)
  return Math.max(aToB, bToA)
}

// Compare a user stroke (raw pixel coordinates) to a reference stroke (normalized 0–1)
// Normalizes the user stroke first, then computes Hausdorff distance
// Score formula: score = max(0, 1 - (hausdorff / threshold)) where threshold = 0.3
export function compareStroke(
  user_stroke: Stroke,
  reference: ReferenceStroke,
  canvas_width: number,
  canvas_height: number
): StrokeResult {
  const normalizedUserStroke = normalizeStroke(user_stroke, canvas_width, canvas_height)
  const hausdorff = hausdorffDistance(normalizedUserStroke, reference.points)
  const score = Math.max(0, 1 - (hausdorff / SCORE_THRESHOLD))

  return {
    score,
    is_correct: score >= CORRECT_THRESHOLD,
    hausdorff_distance: hausdorff
  }
}

// Render stroke feedback on a canvas context
// correct strokes: draw in rgba(74, 222, 128, 0.8) — green
// incorrect strokes: draw in rgba(248, 113, 113, 0.8) — red
// stroke width: 3px, lineCap: round, lineJoin: round
export function renderStrokeFeedback(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  result: StrokeResult
): void {
  if (stroke.length === 0) {
    return
  }

  ctx.save()
  ctx.strokeStyle = result.is_correct ? 'rgba(74, 222, 128, 0.8)' : 'rgba(248, 113, 113, 0.8)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(stroke[0].x, stroke[0].y)
  for (let index = 1; index < stroke.length; index += 1) {
    const point = stroke[index]
    ctx.lineTo(point.x, point.y)
  }
  ctx.stroke()
  ctx.restore()
}

// Render a stroke hint animation on canvas
// Draws a dashed line along the reference path with a pulsing dot at the current position
// Used when user pauses for more than 2 seconds
export function renderStrokeHint(
  ctx: CanvasRenderingContext2D,
  reference: ReferenceStroke,
  canvas_width: number,
  canvas_height: number,
  progress: number  // 0.0–1.0 progress along the stroke for animation
): void {
  if (reference.points.length === 0) {
    return
  }

  const pixelStroke: Stroke = reference.points.map((point) => ({
    x: point.x * canvas_width,
    y: point.y * canvas_height
  }))

  ctx.save()
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(pixelStroke[0].x, pixelStroke[0].y)
  for (let index = 1; index < pixelStroke.length; index += 1) {
    const point = pixelStroke[index]
    ctx.lineTo(point.x, point.y)
  }
  ctx.stroke()

  const clampedProgress = clamp(progress, 0, 1)
  const dot = pointAtProgress(pixelStroke, clampedProgress)
  const pulseScale = 1 + (0.2 * Math.sin(clampedProgress * Math.PI * 10))

  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'
  ctx.beginPath()
  ctx.arc(dot.x, dot.y, 5 * pulseScale, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Clear the tracing area (user drawing layer only, not the character outline layer)
export function clearTracingLayer(ctx: CanvasRenderingContext2D, canvas_width: number, canvas_height: number): void {
  ctx.clearRect(0, 0, canvas_width, canvas_height)
}

// Draw the reference character outline (the grey ghost the user traces over)
export function renderCharacterOutline(
  ctx: CanvasRenderingContext2D,
  strokes: ReferenceStroke[],
  canvas_width: number,
  canvas_height: number
): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const stroke of strokes) {
    if (stroke.points.length === 0) {
      continue
    }

    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x * canvas_width, stroke.points[0].y * canvas_height)

    for (let index = 1; index < stroke.points.length; index += 1) {
      const point = stroke.points[index]
      ctx.lineTo(point.x * canvas_width, point.y * canvas_height)
    }

    ctx.stroke()
  }

  ctx.restore()
}
