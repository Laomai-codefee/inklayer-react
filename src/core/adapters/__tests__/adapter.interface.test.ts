import {
  canvasToPdfPoint,
  pdfToCanvasPoint,
  type ViewportContext,
} from '../adapter.interface';

describe('PDF and canvas coordinate conversion', () => {
  const pageSize = { width: 612, height: 792 };
  const point = { x: 123.5, y: 456.25 };

  it.each([0, 90, 180, 270] as const)(
    'round-trips a point at %i degrees',
    (rotation) => {
      const context: ViewportContext = {
        pageIndex: 0,
        pageSize,
        scale: 1.75,
        rotation,
      };

      const canvasPoint = pdfToCanvasPoint(point, context);
      const restoredPoint = canvasToPdfPoint(canvasPoint, context);

      expect(restoredPoint.x).toBeCloseTo(point.x);
      expect(restoredPoint.y).toBeCloseTo(point.y);
    }
  );

  it('applies scale without rotation', () => {
    const context: ViewportContext = {
      pageIndex: 0,
      pageSize,
      scale: 2,
      rotation: 0,
    };

    expect(pdfToCanvasPoint({ x: 10, y: 20 }, context)).toEqual({
      x: 20,
      y: 40,
    });
  });
});
