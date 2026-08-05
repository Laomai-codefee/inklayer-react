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
        borderDash: transformAllowed ? [] : [3, 3],
        opacity: transformAllowed ? 1 : 1,
        authorLabelOpacity: 0.9,
        anchorFill: transformAllowed ? '#fff' : 'transparent',
        anchorStrokeWidth: transformAllowed ? 2 : 0,
        anchorSize: transformAllowed ? 10 : 0
    }
}
