import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../../const/definitions'
import { buildExcelExportRows } from '..'

jest.mock('../../../utils/utils', () => ({
    formatPDFDate: (value: string | null) => value ?? '',
    getPDFDateTimestamp: () => 0,
    getTimestampString: () => 'test'
}))

function makeAnnotation(
    id: string,
    pageNumber: number,
    referenceNumber: number,
    comments: IAnnotationStore['comments'] = []
): IAnnotationStore {
    return {
        id,
        pageNumber,
        referenceNumber,
        type: AnnotationType.RECTANGLE,
        pdfjsType: PdfjsAnnotationType.SQUARE,
        subtype: 'Square',
        title: 'Alice',
        date: null,
        user: { id: 'alice', name: 'Alice' },
        comments,
        color: '#ff0000',
        konvaString: '{}',
        konvaClientRect: { x: 0, y: 0, width: 10, height: 10 },
        contentsObj: { text: `Annotation ${referenceNumber}` },
        native: false
    }
}

describe('Excel annotation export', () => {
    it('uses stable annotation reference numbers after sorting and keeps replies under their parent number', () => {
        const pageTwo = makeAnnotation('annotation-3', 2, 3)
        const pageOne = makeAnnotation('annotation-9', 1, 9, [{
            id: 'reply-1',
            title: 'Bob',
            date: null,
            content: 'See #9'
        }])

        const rows = buildExcelExportRows([pageTwo, pageOne])

        expect(rows.map(row => row.index)).toEqual(['#9', '#9.1', '#3'])
        expect(rows.map(row => row.author)).toEqual(['Alice', 'Bob', 'Alice'])
        expect(rows[1].content).toBe('See #9')
    })
})
