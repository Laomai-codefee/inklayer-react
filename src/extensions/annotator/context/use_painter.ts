import { useContext } from 'react'
import { PainterContext } from './painter_context_value'

export const usePainter = () => {
    const context = useContext(PainterContext)
    if (context === undefined) {
        throw new Error('usePainter must be used within a PainterProvider')
    }
    return context
}
