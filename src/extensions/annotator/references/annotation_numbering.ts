import type { IAnnotationStore } from '../const/definitions'

function isValidReferenceNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function parsePdfDate(date: string): number | null {
    const match = /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:([Zz])|([+-])(\d{2})'?(\d{2})?'?)?$/.exec(date)
    if (!match) return null

    const [, year, month, day, hour, minute, second, utc, sign, offsetHour, offsetMinute] = match
    const yearNumber = Number(year)
    const monthNumber = Number(month)
    const dayNumber = Number(day)
    const hourNumber = Number(hour)
    const minuteNumber = Number(minute)
    const secondNumber = Number(second)
    if (
        monthNumber < 1 || monthNumber > 12
        || dayNumber < 1 || dayNumber > 31
        || hourNumber > 23
        || minuteNumber > 59
        || secondNumber > 59
        || Number(offsetHour || 0) > 23
        || Number(offsetMinute || 0) > 59
    ) {
        return null
    }

    const timestamp = Date.UTC(
        yearNumber,
        monthNumber - 1,
        dayNumber,
        hourNumber,
        minuteNumber,
        secondNumber
    )
    if (!Number.isFinite(timestamp)) return null
    const parsedDate = new Date(timestamp)
    if (
        parsedDate.getUTCFullYear() !== yearNumber
        || parsedDate.getUTCMonth() !== monthNumber - 1
        || parsedDate.getUTCDate() !== dayNumber
    ) {
        return null
    }

    if (utc || !sign) return timestamp

    const offset = (Number(offsetHour) * 60 + Number(offsetMinute || 0)) * 60 * 1000
    return timestamp - (sign === '+' ? offset : -offset)
}

function parseAnnotationDate(date: string | null): number | null {
    if (!date) return null

    const pdfTimestamp = parsePdfDate(date)
    if (pdfTimestamp !== null) return pdfTimestamp

    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(date)) {
        return null
    }
    const timestamp = Date.parse(date)
    return Number.isFinite(timestamp) ? timestamp : null
}

function compareAnnotationsForNumbering(a: IAnnotationStore, b: IAnnotationStore): number {
    const aTimestamp = parseAnnotationDate(a.date)
    const bTimestamp = parseAnnotationDate(b.date)

    if (aTimestamp !== null && bTimestamp !== null && aTimestamp !== bTimestamp) {
        return aTimestamp - bTimestamp
    }
    if (aTimestamp !== null && bTimestamp === null) return -1
    if (aTimestamp === null && bTimestamp !== null) return 1
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

function getGreatestReferenceNumber(annotations: Iterable<IAnnotationStore>): number {
    let greatestReferenceNumber = 0
    for (const annotation of annotations) {
        if (
            isValidReferenceNumber(annotation.referenceNumber)
            && annotation.referenceNumber > greatestReferenceNumber
        ) {
            greatestReferenceNumber = annotation.referenceNumber
        }
    }
    return greatestReferenceNumber
}

function nextSafeReferenceNumber(greatestReferenceNumber: number): number {
    if (greatestReferenceNumber >= Number.MAX_SAFE_INTEGER) {
        throw new RangeError('Annotation reference number limit reached.')
    }
    return greatestReferenceNumber + 1
}

/**
 * Assigns deterministic display numbers without mutating inputs. Existing
 * valid and unique numbers are preserved. Missing, invalid, or conflicting
 * numbers continue after the greatest preserved number.
 */
export function normalizeAnnotationReferenceNumbers(
    annotations: readonly IAnnotationStore[]
): IAnnotationStore[] {
    const ordered = [...annotations].sort(compareAnnotationsForNumbering)
    const usedNumbers = new Set<number>()
    const assignedNumbers = new Map<string, number>()
    const pending: IAnnotationStore[] = []

    ordered.forEach((annotation) => {
        const referenceNumber = annotation.referenceNumber
        if (isValidReferenceNumber(referenceNumber) && !usedNumbers.has(referenceNumber)) {
            usedNumbers.add(referenceNumber)
            assignedNumbers.set(annotation.id, referenceNumber)
        } else {
            pending.push(annotation)
        }
    })

    let nextNumber = pending.length > 0
        ? nextSafeReferenceNumber(getGreatestReferenceNumber(ordered))
        : 1
    pending.forEach((annotation, index) => {
        assignedNumbers.set(annotation.id, nextNumber)
        if (index < pending.length - 1) {
            nextNumber = nextSafeReferenceNumber(nextNumber)
        }
    })

    return annotations.map((annotation) => {
        const referenceNumber = assignedNumbers.get(annotation.id)
        return annotation.referenceNumber === referenceNumber
            ? annotation
            : { ...annotation, referenceNumber }
    })
}

/**
 * Assigns a number to one newly created annotation before it enters the Store.
 */
export function assignAnnotationReferenceNumber(
    annotation: IAnnotationStore,
    existingAnnotations: Iterable<IAnnotationStore>,
    nextReferenceNumber = 1
): IAnnotationStore {
    const existing = Array.from(existingAnnotations)
    const usedNumbers = new Set<number>()
    for (const existingAnnotation of existing) {
        if (isValidReferenceNumber(existingAnnotation.referenceNumber)) {
            usedNumbers.add(existingAnnotation.referenceNumber)
        }
    }

    if (isValidReferenceNumber(annotation.referenceNumber) && !usedNumbers.has(annotation.referenceNumber)) {
        return annotation
    }

    const referenceNumber = Math.max(
        nextSafeReferenceNumber(getGreatestReferenceNumber(existing)),
        nextReferenceNumber
    )
    if (!isValidReferenceNumber(referenceNumber)) {
        throw new RangeError('Annotation reference number limit reached.')
    }
    return { ...annotation, referenceNumber }
}

export {
    compareAnnotationsForNumbering,
    getGreatestReferenceNumber,
    isValidReferenceNumber
}
