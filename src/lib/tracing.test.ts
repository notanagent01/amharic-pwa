import { describe, expect, it } from 'vitest'

import {
  compareStroke,
  hausdorffDistance,
  normalizeStroke,
  type Point,
  type ReferenceStroke,
  type Stroke
} from './tracing'

function buildReference(points: Point[]): ReferenceStroke {
  return {
    points,
    stroke_index: 0,
    stroke_count: 1
  }
}

describe('normalizeStroke', () => {
  it('normalizes all output points to 0–1 range', () => {
    const rawStroke: Stroke = [
      { x: 12, y: 24 },
      { x: 64, y: 90 },
      { x: 120, y: 180 }
    ]

    const normalized = normalizeStroke(rawStroke, 200, 200)

    expect(normalized).toHaveLength(rawStroke.length)
    for (const point of normalized) {
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(1)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(1)
    }
  })
})

describe('hausdorffDistance', () => {
  it('is 0 for identical strokes', () => {
    const stroke: Stroke = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0.2 },
      { x: 1, y: 1 }
    ]

    expect(hausdorffDistance(stroke, stroke)).toBeCloseTo(0, 10)
  })

  it('is positive for different strokes', () => {
    const strokeA: Stroke = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]
    const strokeB: Stroke = [
      { x: 0, y: 1 },
      { x: 1, y: 0 }
    ]

    expect(hausdorffDistance(strokeA, strokeB)).toBeGreaterThan(0)
  })

  it('is symmetric', () => {
    const strokeA: Stroke = [
      { x: 0, y: 0 },
      { x: 1, y: 0.3 }
    ]
    const strokeB: Stroke = [
      { x: 0.2, y: 0.2 },
      { x: 0.7, y: 1 }
    ]

    expect(hausdorffDistance(strokeA, strokeB)).toBeCloseTo(hausdorffDistance(strokeB, strokeA), 10)
  })
})

describe('compareStroke', () => {
  it('scores an identical stroke as 1.0', () => {
    const userStroke: Stroke = [
      { x: 0, y: 0 },
      { x: 100, y: 100 }
    ]
    const reference = buildReference([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ])

    const result = compareStroke(userStroke, reference, 100, 100)

    expect(result.hausdorff_distance).toBeCloseTo(0, 10)
    expect(result.score).toBeCloseTo(1, 10)
    expect(result.is_correct).toBe(true)
  })

  it('scores a very different stroke near 0', () => {
    const userStroke: Stroke = [
      { x: 50, y: 50 },
      { x: 50, y: 50 }
    ]
    const reference = buildReference([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ])

    const result = compareStroke(userStroke, reference, 100, 100)

    expect(result.score).toBeLessThanOrEqual(0.01)
    expect(result.is_correct).toBe(false)
  })

  it('applies score formula boundaries at 0, 0.15, and 0.3 Hausdorff distance', () => {
    const userStroke: Stroke = [
      { x: 0, y: 0 },
      { x: 100, y: 100 }
    ]

    const referenceAt0 = buildReference([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ])
    const referenceAt015 = buildReference([
      { x: 0.15, y: 0 },
      { x: 1, y: 1 }
    ])
    const referenceAt03 = buildReference([
      { x: 0.3, y: 0 },
      { x: 1, y: 1 }
    ])

    const result0 = compareStroke(userStroke, referenceAt0, 100, 100)
    const result015 = compareStroke(userStroke, referenceAt015, 100, 100)
    const result03 = compareStroke(userStroke, referenceAt03, 100, 100)

    expect(result0.hausdorff_distance).toBeCloseTo(0, 10)
    expect(result0.score).toBeCloseTo(1, 10)

    expect(result015.hausdorff_distance).toBeCloseTo(0.15, 10)
    expect(result015.score).toBeCloseTo(0.5, 10)

    expect(result03.hausdorff_distance).toBeCloseTo(0.3, 10)
    expect(result03.score).toBeCloseTo(0, 10)
  })
})
