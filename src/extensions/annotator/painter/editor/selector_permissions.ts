export interface TransformerPermissionStyle {
    borderStrokeWidth: number
    borderDash: number[]
    opacity: number
    anchorFill: string
    anchorStrokeWidth: number
    anchorSize: number
}

export function getTransformerPermissionStyle(transformAllowed: boolean): TransformerPermissionStyle {
    return {
        borderStrokeWidth: 2,
        borderDash: transformAllowed ? [] : [6, 4],
        opacity: 1,
        anchorFill: transformAllowed ? '#fff' : 'transparent',
        anchorStrokeWidth: transformAllowed ? 2 : 0,
        anchorSize: transformAllowed ? 10 : 0
    }
}
