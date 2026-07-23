import { useCallback, useMemo, useState } from 'react'
import type { Painter } from '../painter'
import React from 'react'
import { PainterContext } from './painter_context_value'

export const PainterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [painter, setPainter] = useState<Painter | null>(null)
    const [revision, setRevision] = useState(0)
    const refreshPainter = useCallback(() => setRevision(value => value + 1), [])
    const value = useMemo(
        () => ({ painter, setPainter, refreshPainter, revision }),
        [painter, refreshPainter, revision]
    )

    return (
        <PainterContext.Provider value={value}>
            {children}
        </PainterContext.Provider>
    )
}
