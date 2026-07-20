import { getTransformerPermissionStyle } from '../selector_permissions'

describe('selector permission styles', () => {
    it('keeps a visible selection border but hides resize anchors in read-only mode', () => {
        expect(getTransformerPermissionStyle(false)).toEqual({
            borderStrokeWidth: 2,
            borderDash: [6, 4],
            opacity: 1,
            anchorFill: 'transparent',
            anchorStrokeWidth: 0,
            anchorSize: 0
        })
    })

    it('shows the selection border and resize anchors when transformation is allowed', () => {
        expect(getTransformerPermissionStyle(true)).toEqual({
            borderStrokeWidth: 2,
            borderDash: [],
            opacity: 1,
            anchorFill: '#fff',
            anchorStrokeWidth: 2,
            anchorSize: 10
        })
    })
})
