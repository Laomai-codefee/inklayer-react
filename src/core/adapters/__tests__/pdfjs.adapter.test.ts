import {
  annotationToPdfJs,
  pdfJsToAnnotation,
} from '../pdfjs.adapter';
import type { Annotation } from '../../annotation.core';
import { PdfjsAnnotationType } from '@/extensions/annotator/const/definitions';

function createTextMarkupAnnotation(): Annotation {
  return {
    id: 'highlight-1',
    kind: 'text-markup',
    target: {
      pageIndex: 0,
      coordinateSystem: 'pdf-user-space',
      geometry: {
        type: 'quad',
        quads: [{
          p1: { x: 10, y: 20 },
          p2: { x: 40, y: 20 },
          p3: { x: 10, y: 30 },
          p4: { x: 40, y: 30 },
        }],
      },
    },
    payload: {
      kind: 'text-markup',
      variant: 'highlight',
      text: 'Reviewer note',
      selectedText: 'Selected source text',
    },
  };
}

describe('PDF.js annotation adapter', () => {
  it('exports text-markup user content without leaking selected source text', () => {
    const pdfAnnotation = annotationToPdfJs(createTextMarkupAnnotation());

    expect(pdfAnnotation.contents).toBe('Reviewer note');
    expect(pdfAnnotation.quadPoints).toEqual([
      10, 20,
      40, 20,
      10, 30,
      40, 30,
    ]);
  });

  it('imports PDF Contents as user-authored text', () => {
    const annotation = pdfJsToAnnotation({
      id: 'highlight-1',
      subtype: 'Highlight',
      type: PdfjsAnnotationType.HIGHLIGHT,
      contents: 'Imported reviewer note',
      rect: [10, 20, 40, 30],
      quadPoints: [
        10, 20,
        40, 20,
        10, 30,
        40, 30,
      ],
    });

    expect(annotation.payload).toMatchObject({
      kind: 'text-markup',
      variant: 'highlight',
      text: 'Imported reviewer note',
    });
  });
});
