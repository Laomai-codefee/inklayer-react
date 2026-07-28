import {
  annotationToStore,
  annotationsToStores,
  storesToAnnotations,
  storeToAnnotation,
} from '../store.mapper';
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '@/extensions/annotator/const/definitions';

function makeStore(
  overrides: Partial<IAnnotationStore> = {}
): IAnnotationStore {
  return {
    id: 'annotation-1',
    pageNumber: 3,
    konvaString: 'serialized-konva-data',
    konvaClientRect: { x: 10, y: 20, width: 100, height: 50 },
    title: 'Test annotation',
    type: AnnotationType.HIGHLIGHT,
    color: '#ff0000',
    subtype: 'Highlight',
    pdfjsType: PdfjsAnnotationType.HIGHLIGHT,
    date: '2026-07-16T00:00:00Z',
    contentsObj: { text: 'Review this section' },
    comments: [],
    user: { id: 'user-1', name: 'Reviewer' },
    native: false,
    ...overrides,
  };
}

describe('annotation store mapping', () => {
  it('maps a highlight to the framework-independent core model', () => {
    const annotation = storeToAnnotation(makeStore());

    expect(annotation.kind).toBe('text-markup');
    expect(annotation.target.pageIndex).toBe(2);
    expect(annotation.target.geometry.type).toBe('quad');
    expect(annotation.payload).toEqual({
      kind: 'text-markup',
      variant: 'highlight',
      text: 'Review this section',
      selectedText: undefined,
      color: '#ff0000',
    });
    expect(annotation.appearance?.fillColor).toBe('rgba(255, 0, 0, 0.3)');
    expect(annotation.meta?.source).toBe('inklayer');
  });

  it('maps arrow bounds to line endpoints', () => {
    const annotation = storeToAnnotation(
      makeStore({
        type: AnnotationType.ARROW,
        subtype: 'Arrow',
        pdfjsType: PdfjsAnnotationType.LINE,
        konvaClientRect: { x: 50, y: 60, width: 120, height: 30 },
      })
    );

    expect(annotation.target.geometry).toEqual({
      type: 'line',
      start: { x: 50, y: 60 },
      end: { x: 170, y: 90 },
    });
    expect(annotation.payload).toEqual({
      kind: 'line',
      arrowStart: false,
      arrowEnd: true,
    });
  });

  it('saves Cloud with cloud semantics and restores its sidebar type', () => {
    const original = makeStore({
      type: AnnotationType.CLOUD,
      subtype: 'PolyLine',
      pdfjsType: PdfjsAnnotationType.POLYLINE,
      konvaString: '{"className":"Group","children":[{"className":"Path"}]}',
    });

    const saved = storeToAnnotation(original);
    const restored = annotationToStore(saved);

    expect(saved).toMatchObject({
      kind: 'shape',
      payload: { kind: 'shape', shape: 'cloud' },
    });
    expect(restored).toEqual(original);
    expect(restored).toMatchObject({
      type: AnnotationType.CLOUD,
      pdfjsType: PdfjsAnnotationType.POLYLINE,
      subtype: 'PolyLine',
    });
  });

  it('restores Cloud from save data produced before the cloud mapping fix', () => {
    const saved = storeToAnnotation(makeStore({
      type: AnnotationType.CLOUD,
      subtype: 'PolyLine',
      pdfjsType: PdfjsAnnotationType.POLYLINE,
    }));
    saved.payload = { kind: 'shape', shape: 'polygon' };
    const extensions = saved.extensions as {
      legacy?: { annotationType?: AnnotationType }
    };
    delete extensions.legacy?.annotationType;

    expect(annotationToStore(saved)).toMatchObject({
      type: AnnotationType.CLOUD,
      pdfjsType: PdfjsAnnotationType.POLYLINE,
      subtype: 'PolyLine',
    });
  });

  it('preserves legacy rendering data during a round trip', () => {
    const original = makeStore({
      type: AnnotationType.NOTE,
      subtype: 'Text',
      pdfjsType: PdfjsAnnotationType.TEXT,
    });

    const restored = annotationToStore(storeToAnnotation(original));

    expect(restored).toEqual(original);
  });

  it('preserves the annotation reference number during a round trip', () => {
    const original = makeStore({ referenceNumber: 12 });
    const saved = storeToAnnotation(original);

    expect(saved.meta?.referenceNumber).toBe(12);
    expect(annotationToStore(saved).referenceNumber).toBe(12);
  });

  it('restores the canonical StrikeOut subtype from core payload data', () => {
    const saved = storeToAnnotation(makeStore({
      type: AnnotationType.STRIKEOUT,
      subtype: 'StrikeOut',
      pdfjsType: PdfjsAnnotationType.STRIKEOUT,
    }));
    const extensions = saved.extensions as {
      pdfjs?: { subtype?: string }
    };
    delete extensions.pdfjs?.subtype;

    expect(annotationToStore(saved).subtype).toBe('StrikeOut');
  });

  it('preserves stable comment authors during a round trip', () => {
    const original = makeStore({
      comments: [{
        id: 'comment-1',
        title: 'Alice',
        date: '2026-07-18T00:00:00Z',
        content: 'Please review this.',
        user: { id: 'user-alice', name: 'Alice' },
      }],
    });

    const restored = annotationToStore(storeToAnnotation(original));

    expect(restored.comments).toEqual(original.comments);
  });

  it('preserves main-comment and reply annotation references during a round trip', () => {
    const reference = {
      type: 'annotation' as const,
      annotationId: 'annotation-2',
      label: '#2',
    };
    const original = makeStore({
      contentsObj: {
        text: 'Compare this with #2.',
        references: [reference],
      },
      comments: [{
        id: 'comment-1',
        title: 'Alice',
        date: '2026-07-18T00:00:00Z',
        content: 'Please review #2.',
        references: [reference],
      }],
    });

    const saved = storeToAnnotation(original);
    const restored = annotationToStore(saved);
    const legacy = saved.extensions?.legacy as {
      contentsObj?: typeof original.contentsObj
      comments?: typeof original.comments
    };

    expect(legacy.contentsObj?.references).toEqual([reference]);
    expect(legacy.comments?.[0].references).toEqual([reference]);
    expect(restored.contentsObj).toEqual(original.contentsObj);
    expect(restored.comments).toEqual(original.comments);
  });

  it('preserves text-markup source text separately from user content', () => {
    const original = makeStore({
      contentsObj: {
        text: 'User-authored note',
        selectedText: 'Quoted source text',
      },
    });
    const saved = storeToAnnotation(original);

    expect(saved.payload).toMatchObject({
      kind: 'text-markup',
      text: 'User-authored note',
      selectedText: 'Quoted source text',
    });
    expect(annotationToStore(saved).contentsObj).toEqual(original.contentsObj);

    const extensions = saved.extensions as {
      legacy?: unknown
    };
    delete extensions.legacy;

    expect(annotationToStore(saved).contentsObj).toEqual(original.contentsObj);
  });

  it('keeps legacy comments without an author compatible', () => {
    const original = makeStore({
      comments: [{
        id: 'legacy-comment',
        title: 'Legacy reviewer',
        date: null,
        content: 'No stable author id.',
      }],
    });

    const restored = annotationToStore(storeToAnnotation(original));

    expect(restored.comments).toEqual(original.comments);
    expect(restored.comments[0].user).toBeUndefined();
  });

  it('converts arrays in both directions', () => {
    const stores = [makeStore(), makeStore({ id: 'annotation-2' })];

    const restored = annotationsToStores(storesToAnnotations(stores));

    expect(restored.map(({ id }) => id)).toEqual([
      'annotation-1',
      'annotation-2',
    ]);
  });
});
