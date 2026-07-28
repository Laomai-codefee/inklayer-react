jest.mock('nanoid', () => ({
    nanoid: jest.fn(() => 'generated-id')
}))

jest.mock('i18next', () => ({
    __esModule: true,
    default: {
        t: (
            key: string,
            values: Record<string, string>
        ) => `${key}:${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`
    }
}))

import { formatPDFCompactDateTime } from '../utils'

describe('formatPDFCompactDateTime', () => {
    it('uses the compact current-year format and preserves minute precision', () => {
        const currentYear = new Date().getFullYear()

        expect(formatPDFCompactDateTime(
            `D:${currentYear}0728121200+08'00'`
        )).toBe(`common:dateFormat.compact:${currentYear}-07-28 12:12`)
    })

    it('includes the year for annotations from another year', () => {
        const previousYear = new Date().getFullYear() - 1

        expect(formatPDFCompactDateTime(
            `D:${previousYear}0728121200+08'00'`
        )).toBe(`common:dateFormat.compactWithYear:${previousYear}-07-28 12:12`)
    })

    it('returns an empty string for absent or malformed PDF dates', () => {
        expect(formatPDFCompactDateTime(null)).toBe('')
        expect(formatPDFCompactDateTime('2026-07-28')).toBe('')
        expect(formatPDFCompactDateTime('D:20260728')).toBe('')
    })
})
