import { createContext } from 'react'
import type { Painter } from '../painter'

export interface PainterContextValue {
    painter: Painter | null
    setPainter: (painter: Painter | null) => void
    refreshPainter: () => void
    revision: number
}

export const PainterContext = createContext<PainterContextValue | undefined>(undefined)
