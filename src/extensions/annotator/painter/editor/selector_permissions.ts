export interface TransformerPermissionStyle {
    borderStrokeWidth: number
    opacity: number
    anchorFill: string
    anchorStrokeWidth: number
    anchorSize: number
}

export function getTransformerPermissionStyle(transformAllowed: boolean): TransformerPermissionStyle {
    return {
        borderStrokeWidth: 2,
        opacity: 1,
        anchorFill: transformAllowed ? '#fff' : 'transparent',
        anchorStrokeWidth: transformAllowed ? 2 : 0,
        anchorSize: transformAllowed ? 10 : 0
    }
}
