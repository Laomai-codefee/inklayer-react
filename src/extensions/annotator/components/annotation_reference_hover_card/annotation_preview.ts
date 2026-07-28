const MAX_PREVIEW_LENGTH = 500

export function createAnnotationPreview(content: string | undefined): string {
    const normalizedContent = content?.replace(/\s+/g, ' ').trim() ?? ''
    if (normalizedContent.length <= MAX_PREVIEW_LENGTH) return normalizedContent

    return `${normalizedContent.slice(0, MAX_PREVIEW_LENGTH).trimEnd()}…`
}
