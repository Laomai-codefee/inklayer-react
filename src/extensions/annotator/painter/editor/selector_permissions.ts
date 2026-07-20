export interface TransformerPermissionStyle {
    borderStrokeWidth: number
    borderDash: number[]
    opacity: number
    authorLabelOpacity: number
    anchorFill: string
    anchorStrokeWidth: number
    anchorSize: number
}

export function getTransformerPermissionStyle(transformAllowed: boolean): TransformerPermissionStyle {
    return {
        borderStrokeWidth: 2,
        borderDash: transformAllowed ? [] : [6, 4],
        opacity: transformAllowed ? 1 : 0.5,
        authorLabelOpacity: transformAllowed ? 1 : 0.8,
        anchorFill: transformAllowed ? '#fff' : 'transparent',
        anchorStrokeWidth: transformAllowed ? 2 : 0,
        anchorSize: transformAllowed ? 10 : 0
    }
}
