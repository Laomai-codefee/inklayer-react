/** @jest-environment jsdom */

import {
    PDFArray,
    PDFDict,
    PDFDocument,
    PDFHexString,
    PDFName,
    PDFNumber,
    PDFString
} from 'pdf-lib'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { saveAs } from 'file-saver'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../../const/definitions'
import { buildAnnotatedPdf, exportAnnotationsToPdf } from '..'
import { generateCloudPathData } from '../../cloud_path'
import { Transform } from '../../transform/transform'

jest.mock('i18next', () => ({
    __esModule: true,
    default: { t: (key: string) => key },
    t: (key: string) => key
}))

jest.mock('file-saver', () => ({ saveAs: jest.fn() }))

jest.mock('../../../utils/utils', () => ({
    convertKonvaRectToPdfRect: (
        rect: { x: number; y: number; width: number; height: number },
        pageView: ReturnType<typeof createPageView>
    ) => {
        const scale = pageView.viewport.scale
        const [x1, y1] = pageView.viewport.convertToPdfPoint(rect.x * scale, rect.y * scale)
        const [x2, y2] = pageView.viewport.convertToPdfPoint(
            (rect.x + rect.width) * scale,
            (rect.y + rect.height) * scale
        )
        return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]
    },
    rgbToPdfColor: (color: string) => {
        const value = color.startsWith('#') ? color.slice(1) : '000000'
        return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16) / 255)
    },
    convertToRGB: () => '#ff0000',
    stringToPDFHexString: (value: string) => PDFHexString.fromText(value),
    formatPDFDate: (value: string) => value,
    getPDFDateTimestamp: () => 0,
    getTimestampString: () => 'test'
}))

const PAGE_WIDTH = 600
const PAGE_HEIGHT = 800
const CLOUD_PATH = generateCloudPathData([
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 180 },
    { x: 100, y: 180 },
    { x: 100, y: 100 }
])

function createPageView(scale = 1, pageWidth = PAGE_WIDTH, pageHeight = PAGE_HEIGHT) {
    return {
        viewport: {
            scale,
            width: pageWidth * scale,
            height: pageHeight * scale,
            convertToPdfPoint: (x: number, y: number) => [x / scale, pageHeight - y / scale]
        }
    }
}

function createViewer(pdfData: Uint8Array, scale = 1): PDFViewer {
    return {
        pdfDocument: { getData: async () => pdfData },
        getPageView: () => createPageView(scale)
    } as unknown as PDFViewer
}

function createAnnotation(overrides: Partial<IAnnotationStore> = {}): IAnnotationStore {
    return {
        id: 'annotation-1',
        pageNumber: 1,
        type: AnnotationType.RECTANGLE,
        pdfjsType: PdfjsAnnotationType.SQUARE,
        subtype: 'Square',
        title: 'Alice',
        date: null,
        user: { id: 'alice', name: 'Alice' },
        comments: [],
        color: '#ff0000',
        konvaString: JSON.stringify({
            className: 'Group',
            attrs: {},
            children: [{ className: 'Rect', attrs: { x: 100, y: 100, width: 80, height: 40, strokeWidth: 2 } }]
        }),
        konvaClientRect: { x: 100, y: 100, width: 80, height: 40 },
        native: false,
        ...overrides
    }
}

async function createBlankPdf(): Promise<Uint8Array> {
    const document = await PDFDocument.create()
    document.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    return document.save()
}

function getAnnotationDictionaries(document: PDFDocument): PDFDict[] {
    const page = document.getPage(0)
    const annotations = page.node.lookup(PDFName.of('Annots'), PDFArray)
    return annotations.asArray().map(reference => document.context.lookup(reference, PDFDict))
}

function getNumberArray(dictionary: PDFDict, key: string): number[] {
    const array = dictionary.lookup(PDFName.of(key), PDFArray)
    return array.asArray().map(item => (item as PDFNumber).asNumber())
}

function getNestedNumberArray(dictionary: PDFDict, key: string, index = 0): number[] {
    const arrays = dictionary.lookup(PDFName.of(key), PDFArray)
    return arrays.lookup(index, PDFArray).asArray().map(item => (item as PDFNumber).asNumber())
}

function readAnnotationsWithRealPdfJs(fixturePath: string): Array<Record<string, unknown>> {
    const outputMarker = '__INKLAYER_PDFJS_ANNOTATIONS__'
    const script = [
        "import { readFileSync } from 'node:fs'",
        "import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'",
        'const task = getDocument({ data: new Uint8Array(readFileSync(process.argv[1])) })',
        'const document = await task.promise',
        'const page = await document.getPage(1)',
        'const annotations = await page.getAnnotations()',
        'await task.destroy()',
        `process.stdout.write('${outputMarker}' + JSON.stringify(annotations, (_key, value) => ArrayBuffer.isView(value) ? Array.from(value) : value))`
    ].join(';')
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script, fixturePath], {
        encoding: 'utf8',
        timeout: 5000
    })
    const markerIndex = output.lastIndexOf(outputMarker)
    if (markerIndex === -1) throw new Error('PDF.js annotation subprocess returned no result marker.')
    return JSON.parse(output.slice(markerIndex + outputMarker.length)) as Array<Record<string, unknown>>
}

function getPpmPixels(data: Buffer): { width: number; height: number; pixels: Buffer } {
    let offset = 0
    const tokens: string[] = []
    while (tokens.length < 4) {
        while (offset < data.length && /\s/.test(String.fromCharCode(data[offset]))) offset++
        if (data[offset] === 35) {
            while (offset < data.length && data[offset] !== 10) offset++
            continue
        }
        const start = offset
        while (offset < data.length && !/\s/.test(String.fromCharCode(data[offset]))) offset++
        tokens.push(data.subarray(start, offset).toString('ascii'))
    }
    while (offset < data.length && /\s/.test(String.fromCharCode(data[offset]))) offset++
    if (tokens[0] !== 'P6' || tokens[3] !== '255') throw new Error('Unexpected Poppler PPM output.')
    return { width: Number(tokens[1]), height: Number(tokens[2]), pixels: data.subarray(offset) }
}

function getRedPixelBounds(data: Buffer) {
    const { width, height, pixels } = getPpmPixels(data)
    const redPixels: Array<{ x: number; y: number }> = []
    for (let index = 0; index < pixels.length; index += 3) {
        if (pixels[index] > 150 && pixels[index + 1] < 120 && pixels[index + 2] < 120) {
            const pixel = index / 3
            redPixels.push({ x: pixel % width, y: Math.floor(pixel / width) })
        }
    }
    const xs = redPixels.map(pixel => pixel.x)
    const ys = redPixels.map(pixel => pixel.y)
    return {
        width,
        height,
        count: redPixels.length,
        bounds: {
            left: Math.min(...xs),
            top: Math.min(...ys),
            right: Math.max(...xs),
            bottom: Math.max(...ys)
        }
    }
}

describe('PDF annotation export', () => {
    it('adds the stable annotation number after the author while keeping reply titles unchanged', async () => {
        const annotation = createAnnotation({
            referenceNumber: 5,
            title: 'Legacy Alice',
            user: { id: 'alice', name: 'Alice' },
            comments: [{
                id: 'reply-1',
                title: 'Bob',
                date: null,
                content: 'See #5'
            }]
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const exported = await PDFDocument.load(result)
        const [mainAnnotation, reply] = getAnnotationDictionaries(exported)

        expect(mainAnnotation.lookup(PDFName.of('T'), PDFHexString).decodeText()).toBe('Alice · #5')
        expect(reply.lookup(PDFName.of('T'), PDFHexString).decodeText()).toBe('Bob')
        expect(reply.lookup(PDFName.of('Contents'), PDFHexString).decodeText()).toBe('See #5')
    })

    it('preserves annotations that InkLayer does not replace', async () => {
        const source = await PDFDocument.create()
        const page = source.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        const link = source.context.register(source.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Link'),
            Rect: [20, 20, 120, 40]
        }))
        const oldSquare = source.context.register(source.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Square'),
            Rect: [10, 10, 30, 30],
            NM: PDFString.of('old-square')
        }))
        page.node.set(PDFName.of('Annots'), source.context.obj([link, oldSquare]))

        const result = await buildAnnotatedPdf(createViewer(await source.save()), [createAnnotation()])
        const exported = await PDFDocument.load(result)
        const subtypes = getAnnotationDictionaries(exported).map(annotation =>
            annotation.lookup(PDFName.of('Subtype'), PDFName).toString()
        )

        expect(subtypes).toEqual(['/Link', '/Square'])
    })

    it('preserves existing native annotations when replacement is disabled', async () => {
        const source = await PDFDocument.create()
        const page = source.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        const oldSquare = source.context.register(source.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Square'),
            Rect: [10, 10, 30, 30],
            NM: PDFString.of('old-square')
        }))
        page.node.set(PDFName.of('Annots'), source.context.obj([oldSquare]))

        const result = await buildAnnotatedPdf(
            createViewer(await source.save()),
            [createAnnotation({ id: 'new-square' })],
            { replaceNativeAnnotations: false }
        )
        const exported = await PDFDocument.load(result)
        const ids = getAnnotationDictionaries(exported).map(annotation =>
            annotation.lookup(PDFName.of('NM'), PDFString).decodeText()
        )

        expect(ids).toEqual(['old-square', 'new-square'])
    })

    it.each([
        ['Highlight', AnnotationType.HIGHLIGHT, PdfjsAnnotationType.HIGHLIGHT, 'Highlight'],
        ['Underline', AnnotationType.UNDERLINE, PdfjsAnnotationType.UNDERLINE, 'Underline'],
        ['StrikeOut', AnnotationType.STRIKEOUT, PdfjsAnnotationType.STRIKEOUT, 'StrikeOut']
    ] as const)('applies group translation and scale to %s QuadPoints', async (
        expectedSubtype,
        type,
        pdfjsType,
        subtype
    ) => {
        const annotation = createAnnotation({
            type,
            pdfjsType,
            subtype,
            contentsObj: {
                text: 'Reviewer note',
                selectedText: 'Selected source text'
            },
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: { x: 20, y: 30, scaleX: 2, scaleY: 1.5 },
                children: [{ className: 'Rect', attrs: { x: 10, y: 20, width: 30, height: 10 } }]
            }),
            konvaClientRect: { x: 40, y: 60, width: 60, height: 15 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf(), 2), [annotation])
        const exported = await PDFDocument.load(result)
        const [textMarkup] = getAnnotationDictionaries(exported)

        expect(textMarkup.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe(`/${expectedSubtype}`)
        expect(textMarkup.lookup(PDFName.of('Contents'), PDFHexString).decodeText()).toBe('Reviewer note')
        expect(getNumberArray(textMarkup, 'QuadPoints')).toEqual([
            40, 740,
            100, 740,
            40, 725,
            100, 725
        ])
    })

    it('keeps text-markup geometry when the user content is empty', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.HIGHLIGHT,
            pdfjsType: PdfjsAnnotationType.HIGHLIGHT,
            subtype: 'Highlight',
            contentsObj: {
                text: '',
                selectedText: 'Selected source text'
            },
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: {},
                children: [{
                    className: 'Rect',
                    attrs: { x: 10, y: 20, width: 30, height: 10 }
                }]
            }),
            konvaClientRect: { x: 10, y: 20, width: 30, height: 10 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const exported = await PDFDocument.load(result)
        const [highlight] = getAnnotationDictionaries(exported)

        expect(highlight.lookup(PDFName.of('Contents'), PDFHexString).decodeText()).toBe('')
        expect(getNumberArray(highlight, 'QuadPoints')).toEqual([
            10, 780,
            40, 780,
            10, 770,
            40, 770
        ])
    })

    it('exports Cloud as a fidelity-preserving Ink path', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.CLOUD,
            pdfjsType: PdfjsAnnotationType.POLYLINE,
            subtype: 'PolyLine',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: { x: 20, y: 30, scaleX: 2, scaleY: 1.5 },
                children: [{
                    className: 'Path',
                    attrs: {
                        data: CLOUD_PATH,
                        stroke: '#ff0000',
                        strokeWidth: 2,
                        opacity: 0.75
                    }
                }]
            }),
            konvaClientRect: { x: 190, y: 157.5, width: 260, height: 165 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const exported = await PDFDocument.load(result)
        const [cloud] = getAnnotationDictionaries(exported)
        const inkLists = cloud.lookup(PDFName.of('InkList'), PDFArray)
        const inkPoints = (inkLists.lookup(0, PDFArray)).asArray()
            .map(item => (item as PDFNumber).asNumber())

        expect(cloud.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Ink')
        expect(cloud.lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/Cloud')
        expect(inkPoints.slice(0, 2)).toEqual([220, 620])
        expect(inkPoints.length).toBeGreaterThan(80)
        // The first quadratic scallop rises above its straight 620 baseline.
        expect(Math.max(...inkPoints.filter((_, index) => index % 2 === 1).slice(1, 12))).toBeGreaterThan(620)
        expect(cloud.lookup(PDFName.of('CA'), PDFNumber).asNumber()).toBe(0.75)
    })

    it('exports free text as a bounded Text icon with Unicode content and round-trip metadata', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText',
            contentsObj: { text: '中文批注' },
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: {},
                children: [{ className: 'Text', attrs: { fontSize: 18, opacity: 0.6 } }]
            }),
            konvaClientRect: { x: 100, y: 100, width: 160, height: 30 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const exported = await PDFDocument.load(result)
        const [text] = getAnnotationDictionaries(exported)

        expect(text.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Text')
        expect(text.lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/FreeText')
        expect(getNumberArray(text, 'Rect')).toEqual([100, 680, 120, 700])
        expect(text.lookup(PDFName.of('InkLayerFontSize'), PDFNumber).asNumber()).toBe(18)
        expect(text.lookup(PDFName.of('InkLayerTextWidth'), PDFNumber).asNumber()).toBe(160)
        expect(text.lookup(PDFName.of('CA'), PDFNumber).asNumber()).toBe(0.6)
        expect(text.lookup(PDFName.of('Contents'), PDFHexString).decodeText()).toBe('中文批注')
    })

    it('keeps a free text icon inside the PDF page near the bottom-right edge', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText',
            contentsObj: { text: 'edge' },
            konvaString: JSON.stringify({ className: 'Group', attrs: {}, children: [] }),
            konvaClientRect: { x: 590, y: 790, width: 50, height: 30 }
        })
        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const exported = await PDFDocument.load(result)
        expect(getNumberArray(getAnnotationDictionaries(exported)[0], 'Rect')).toEqual([580, 0, 600, 20])
    })

    it('intentionally exports arrows as Ink to preserve their drawn arrowhead', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: { x: 20, y: 30, scaleX: 2, scaleY: 1.5 },
                children: [{
                    className: 'Arrow',
                    attrs: {
                        points: [10, 20, 40, 50],
                        stroke: '#ff0000',
                        strokeWidth: 2,
                        pointerLength: 10,
                        pointerWidth: 10
                    }
                }]
            }),
            konvaClientRect: { x: 40, y: 60, width: 60, height: 45 }
        })

        const result = await buildAnnotatedPdf(createViewer(await createBlankPdf(), 2), [annotation])
        const exported = await PDFDocument.load(result)
        const [arrow] = getAnnotationDictionaries(exported)
        const inkPoints = getNestedNumberArray(arrow, 'InkList')
        const headLeft = { x: inkPoints[6], y: inkPoints[7] }
        const headRight = { x: inkPoints[8], y: inkPoints[9] }

        expect(arrow.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Ink')
        expect(arrow.lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/Arrow')
        expect(arrow.has(PDFName.of('LE'))).toBe(false)
        expect(arrow.lookup(PDFName.of('InkList'), PDFArray).size()).toBe(1)
        expect(inkPoints.slice(0, 4)).toEqual([40, 740, 100, 695])
        expect(Math.hypot(headRight.x - headLeft.x, headRight.y - headLeft.y)).toBeCloseTo(17.68, 2)
    })

    it('round-trips a native Line without line endings as a plain PDF Line', async () => {
        const sourceData = await createBlankPdf()
        const pdfjsAnnotation = {
            annotationType: PdfjsAnnotationType.LINE,
            id: 'plain-line',
            pageNumber: 1,
            pageViewer: createPageView(),
            rect: [90, 590, 410, 660],
            lineCoordinates: [100, 600, 400, 650],
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 2, style: 1, dashArray: [] },
            titleObj: { str: 'Alice' },
            contentsObj: { str: '' },
            modificationDate: null,
            subtype: 'Line'
        }
        const viewer = {
            pdfDocument: {
                numPages: 1,
                getData: async () => sourceData,
                getPage: async () => ({ getAnnotations: async () => [pdfjsAnnotation] }),
                annotationStorage: { setValue: jest.fn() }
            },
            getPageView: () => createPageView()
        } as unknown as PDFViewer

        const stores = await new Transform(viewer).decodePdfAnnotation()
        const restored = stores.get('plain-line')
        expect(JSON.parse(restored!.konvaString).children[0].className).toBe('Line')

        const result = await buildAnnotatedPdf(createViewer(sourceData), [restored!])
        const exported = await PDFDocument.load(result)
        const [line] = getAnnotationDictionaries(exported)
        const lineEndings = line.lookup(PDFName.of('LE'), PDFArray)

        expect(line.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Line')
        expect(getNumberArray(line, 'L')).toEqual([100, 600, 400, 650])
        expect(lineEndings.lookup(0, PDFName).toString()).toBe('/None')
        expect(lineEndings.lookup(1, PDFName).toString()).toBe('/None')
    })

    it('exports the exact 595-byte PDF.js /Line fixture that omits /LE', async () => {
        const fixturePath = join(
            process.cwd(),
            'src/extensions/annotator/painter/annot/__tests__/fixtures/line-without-le.pdf'
        )
        const sourceData = new Uint8Array(readFileSync(fixturePath))
        expect(sourceData.byteLength).toBe(595)

        const sourceDocument = await PDFDocument.load(sourceData)
        const [sourceLine] = getAnnotationDictionaries(sourceDocument)
        expect(sourceLine.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Line')
        expect(getNumberArray(sourceLine, 'L')).toEqual([100, 600, 400, 650])
        expect(sourceLine.has(PDFName.of('LE'))).toBe(false)

        const pageView = createPageView(1, 612, 792)
        const pdfjsAnnotations = readAnnotationsWithRealPdfJs(fixturePath).map(annotation => ({
            ...annotation,
            color: annotation.color === null
                ? null
                : new Uint8ClampedArray(annotation.color as number[]),
            pageNumber: 1,
            pageViewer: pageView
        }))
        expect(pdfjsAnnotations).toHaveLength(1)
        expect(pdfjsAnnotations[0]).toMatchObject({
            annotationType: PdfjsAnnotationType.LINE,
            lineCoordinates: [100, 600, 400, 650],
            lineEndings: ['None', 'None']
        })

        const viewer = {
            pdfDocument: {
                numPages: 1,
                getData: async () => sourceData,
                getPage: async () => ({ getAnnotations: async () => pdfjsAnnotations }),
                annotationStorage: { setValue: jest.fn() }
            },
            getPageView: () => pageView
        } as unknown as PDFViewer
        const stores = await new Transform(viewer).decodePdfAnnotation()
        const restored = stores.get('5R')
        expect(restored).toBeDefined()
        expect(JSON.parse(restored!.konvaString).children[0].className).toBe('Line')

        const result = await buildAnnotatedPdf(viewer, [restored!])
        const exported = await PDFDocument.load(result)
        const [exportedLine] = getAnnotationDictionaries(exported)
        const exportedLineEndings = exportedLine.lookup(PDFName.of('LE'), PDFArray)

        expect(exportedLine.lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Line')
        expect(getNumberArray(exportedLine, 'L')).toEqual([100, 600, 400, 650])
        expect(exportedLineEndings.lookup(0, PDFName).toString()).toBe('/None')
        expect(exportedLineEndings.lookup(1, PDFName).toString()).toBe('/None')

        const mockedSaveAs = jest.mocked(saveAs)
        mockedSaveAs.mockClear()
        await exportAnnotationsToPdf(viewer, [restored!], 'out.pdf')
        expect(mockedSaveAs).toHaveBeenCalledTimes(1)
        expect(mockedSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'out.pdf')
        expect(mockedSaveAs.mock.calls[0]?.[0]).toMatchObject({ type: 'application/pdf' })
    })

    it('restores marked Text and Ink annotations as FreeText and Arrow', async () => {
        const freeText = createAnnotation({
            id: 'free-text',
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText',
            contentsObj: { text: '中文批注' },
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{ className: 'Text', attrs: { fontSize: 18, opacity: 0.6 } }]
            }),
            konvaClientRect: { x: 100, y: 100, width: 160, height: 30 }
        })
        const arrow = createAnnotation({
            id: 'arrow',
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            konvaString: JSON.stringify({
                className: 'Group', attrs: {},
                children: [{
                    className: 'Arrow',
                    attrs: {
                        points: [100, 100, 200, 100], stroke: '#ff0000', strokeWidth: 2,
                        pointerLength: 20, pointerWidth: 30, opacity: 0.65
                    }
                }]
            }),
            konvaClientRect: { x: 95, y: 80, width: 110, height: 40 }
        })
        const exportedData = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [freeText, arrow])
        const exportedDocument = await PDFDocument.load(exportedData)
        const dictionaries = getAnnotationDictionaries(exportedDocument)
        const arrowInkPoints = getNestedNumberArray(dictionaries[1], 'InkList')
        const toVertices = (numbers: number[]) => Array.from(
            { length: numbers.length / 2 },
            (_, index) => ({ x: numbers[index * 2], y: numbers[index * 2 + 1] })
        )
        const pdfjsAnnotations = [{
            annotationType: PdfjsAnnotationType.TEXT,
            id: freeText.id,
            pageNumber: 1,
            pageViewer: createPageView(),
            rect: [100, 680, 120, 700],
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 0 },
            titleObj: { str: 'Alice' },
            contentsObj: { str: '中文批注' },
            modificationDate: null,
            subtype: 'Text'
        }, {
            annotationType: PdfjsAnnotationType.INK,
            id: arrow.id,
            pageNumber: 1,
            pageViewer: createPageView(),
            rect: getNumberArray(dictionaries[1], 'Rect'),
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 2 },
            inkLists: [toVertices(arrowInkPoints)],
            titleObj: { str: 'Alice' },
            contentsObj: { str: '' },
            modificationDate: null,
            subtype: 'Ink'
        }]
        const viewer = {
            pdfDocument: {
                numPages: 1,
                getData: async () => exportedData,
                getPage: async () => ({ getAnnotations: async () => pdfjsAnnotations }),
                annotationStorage: { setValue: jest.fn() }
            },
            getPageView: () => createPageView()
        } as unknown as PDFViewer

        const stores = await new Transform(viewer).decodePdfAnnotation()
        const restoredFreeText = stores.get(freeText.id)
        const restoredArrow = stores.get(arrow.id)
        const freeTextShape = JSON.parse(restoredFreeText!.konvaString).children[0]
        const arrowShape = JSON.parse(restoredArrow!.konvaString).children[0]

        expect(restoredFreeText).toMatchObject({
            type: AnnotationType.FREETEXT,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText'
        })
        expect(freeTextShape).toMatchObject({
            className: 'Text',
            attrs: expect.objectContaining({ x: 100, y: 100, text: '中文批注', fontSize: 18, width: 160, opacity: 0.6 })
        })
        expect(restoredArrow).toMatchObject({
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow'
        })
        expect(arrowShape).toMatchObject({
            className: 'Arrow',
            attrs: expect.objectContaining({ opacity: 0.65, pointerLength: 20, pointerWidth: 30 })
        })

        const secondExport = await buildAnnotatedPdf(
            createViewer(await createBlankPdf()),
            [restoredFreeText!, restoredArrow!]
        )
        const secondDocument = await PDFDocument.load(secondExport)
        const secondDictionaries = getAnnotationDictionaries(secondDocument)
        expect(secondDictionaries[0].lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Text')
        expect(secondDictionaries[0].lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/FreeText')
        expect(getNumberArray(secondDictionaries[0], 'Rect')).toEqual([100, 680, 120, 700])
        expect(secondDictionaries[1].lookup(PDFName.of('Subtype'), PDFName).toString()).toBe('/Ink')
        expect(secondDictionaries[1].lookup(PDFName.of('InkLayerType'), PDFName).toString()).toBe('/Arrow')
    })

    it('fails before export when an annotation references a missing page', async () => {
        const annotation = createAnnotation({ pageNumber: 2 })

        await expect(buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation]))
            .rejects.toThrow('references missing page 2')
    })

    it('recognizes an exported cloud Ink path as Cloud when loaded again', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.CLOUD,
            pdfjsType: PdfjsAnnotationType.POLYLINE,
            subtype: 'PolyLine',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: {},
                children: [{
                    className: 'Path',
                    attrs: {
                        data: CLOUD_PATH,
                        stroke: '#ff0000',
                        strokeWidth: 2
                    }
                }]
            }),
            konvaClientRect: { x: 85, y: 85, width: 80, height: 80 }
        })
        const exportedData = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const pdfjsAnnotation = {
            annotationType: PdfjsAnnotationType.INK,
            id: annotation.id,
            pageNumber: 1,
            pageViewer: createPageView(),
            color: new Uint8ClampedArray([255, 0, 0]),
            borderStyle: { width: 2 },
            inkLists: [[
                { x: 100, y: 700 },
                { x: 125, y: 725 },
                { x: 150, y: 700 },
                { x: 175, y: 675 },
                { x: 150, y: 650 },
                { x: 100, y: 650 },
                { x: 100, y: 700 }
            ]],
            titleObj: { str: 'Alice' },
            contentsObj: { str: '' },
            modificationDate: null,
            subtype: 'Ink'
        }
        const setValue = jest.fn()
        const viewer = {
            pdfDocument: {
                numPages: 1,
                getData: async () => exportedData,
                getPage: async () => ({ getAnnotations: async () => [pdfjsAnnotation] }),
                annotationStorage: { setValue }
            },
            getPageView: () => createPageView()
        } as unknown as PDFViewer

        const stores = await new Transform(viewer).decodePdfAnnotation()
        const restored = stores.get(annotation.id)

        expect(restored?.type).toBe(AnnotationType.CLOUD)
        expect(restored?.pdfjsType).toBe(PdfjsAnnotationType.INK)
        expect(JSON.parse(restored!.konvaString).children[0].className).toBe('Path')
        const secondExport = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [restored!])
        const secondDocument = await PDFDocument.load(secondExport)
        expect(getAnnotationDictionaries(secondDocument)[0].lookup(PDFName.of('Subtype'), PDFName).toString())
            .toBe('/Ink')
        expect(setValue).toHaveBeenCalledWith(
            `pdfjs_internal_editor_${annotation.id}`,
            expect.objectContaining({ deleted: true, id: annotation.id })
        )
    })

    const visualTest = spawnSync('pdftoppm', ['-v']).status === 0 ? it : it.skip
    visualTest('renders text markup identically when selected text is separated from Contents', async () => {
        const directory = mkdtempSync(join(tmpdir(), 'inklayer-text-markup-visual-'))
        const cases = [
            [AnnotationType.HIGHLIGHT, PdfjsAnnotationType.HIGHLIGHT, 'Highlight'],
            [AnnotationType.UNDERLINE, PdfjsAnnotationType.UNDERLINE, 'Underline'],
            [AnnotationType.STRIKEOUT, PdfjsAnnotationType.STRIKEOUT, 'StrikeOut']
        ] as const

        try {
            for (const [type, pdfjsType, subtype] of cases) {
                const base = {
                    type,
                    pdfjsType,
                    subtype,
                    konvaString: JSON.stringify({
                        className: 'Group',
                        attrs: {},
                        children: [{
                            className: 'Rect',
                            attrs: { x: 100, y: 100, width: 160, height: 20 }
                        }]
                    }),
                    konvaClientRect: { x: 100, y: 100, width: 160, height: 20 }
                }
                const legacy = createAnnotation({
                    ...base,
                    contentsObj: { text: 'Selected source text' }
                })
                const separated = createAnnotation({
                    ...base,
                    contentsObj: {
                        text: '',
                        selectedText: 'Selected source text'
                    }
                })
                const [legacyData, separatedData] = await Promise.all([
                    buildAnnotatedPdf(createViewer(await createBlankPdf()), [legacy]),
                    buildAnnotatedPdf(createViewer(await createBlankPdf()), [separated])
                ])
                const legacyInput = join(directory, `${subtype}-legacy.pdf`)
                const separatedInput = join(directory, `${subtype}-separated.pdf`)
                const legacyOutput = join(directory, `${subtype}-legacy`)
                const separatedOutput = join(directory, `${subtype}-separated`)
                writeFileSync(legacyInput, legacyData)
                writeFileSync(separatedInput, separatedData)
                execFileSync(
                    'pdftoppm',
                    ['-r', '72', '-f', '1', '-singlefile', legacyInput, legacyOutput],
                    { timeout: 5000 }
                )
                execFileSync(
                    'pdftoppm',
                    ['-r', '72', '-f', '1', '-singlefile', separatedInput, separatedOutput],
                    { timeout: 5000 }
                )

                expect(readFileSync(`${separatedOutput}.ppm`))
                    .toEqual(readFileSync(`${legacyOutput}.ppm`))
            }
        } finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })

    visualTest('renders the curved Cloud Ink path in the expected page region with Poppler', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.CLOUD,
            pdfjsType: PdfjsAnnotationType.POLYLINE,
            subtype: 'PolyLine',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: {},
                children: [{
                    className: 'Path',
                    attrs: {
                        data: CLOUD_PATH,
                        stroke: '#ff0000',
                        strokeWidth: 2,
                        opacity: 1
                    }
                }]
            }),
            konvaClientRect: { x: 85, y: 85, width: 130, height: 110 }
        })
        const exportedData = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const directory = mkdtempSync(join(tmpdir(), 'inklayer-pdf-visual-'))
        try {
            const input = join(directory, 'cloud.pdf')
            const output = join(directory, 'cloud')
            writeFileSync(input, exportedData)
            execFileSync('pdftoppm', ['-r', '72', '-f', '1', '-singlefile', input, output], { timeout: 5000 })
            const { width, height, count, bounds } = getRedPixelBounds(readFileSync(`${output}.ppm`))

            expect({ width, height }).toEqual({ width: PAGE_WIDTH, height: PAGE_HEIGHT })
            expect(count).toBeGreaterThan(100)
            expect(bounds.left).toBeGreaterThanOrEqual(85)
            expect(bounds.top).toBeGreaterThanOrEqual(85)
            expect(bounds.top).toBeLessThan(100)
            expect(bounds.right).toBeLessThanOrEqual(215)
            expect(bounds.bottom).toBeLessThanOrEqual(195)
            expect(bounds.right - bounds.left).toBeGreaterThan(100)
            expect(bounds.bottom - bounds.top).toBeGreaterThan(80)
        } finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })

    visualTest('renders the Arrow head instead of only its shaft with Poppler', async () => {
        const annotation = createAnnotation({
            type: AnnotationType.ARROW,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            konvaString: JSON.stringify({
                className: 'Group',
                attrs: {},
                children: [{
                    className: 'Arrow',
                    attrs: {
                        points: [100, 100, 200, 100],
                        stroke: '#ff0000',
                        strokeWidth: 2,
                        pointerLength: 20,
                        pointerWidth: 30,
                        opacity: 1
                    }
                }]
            }),
            konvaClientRect: { x: 95, y: 80, width: 110, height: 40 }
        })
        const exportedData = await buildAnnotatedPdf(createViewer(await createBlankPdf()), [annotation])
        const directory = mkdtempSync(join(tmpdir(), 'inklayer-arrow-visual-'))
        try {
            const input = join(directory, 'arrow.pdf')
            const output = join(directory, 'arrow')
            writeFileSync(input, exportedData)
            execFileSync('pdftoppm', ['-r', '72', '-f', '1', '-singlefile', input, output], { timeout: 5000 })
            const { count, bounds } = getRedPixelBounds(readFileSync(`${output}.ppm`))

            expect(count).toBeGreaterThan(100)
            expect(bounds.right - bounds.left).toBeGreaterThan(95)
            expect(bounds.bottom - bounds.top).toBeGreaterThan(20)
        } finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })

})
