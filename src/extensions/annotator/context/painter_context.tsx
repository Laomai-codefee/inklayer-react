import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Painter } from "../painter";
import React from "react";

interface PainterContextValue {
    painter: Painter | null;
    setPainter: (painter: Painter | null) => void;
    refreshPainter: () => void;
    revision: number;
}

const PainterContext = createContext<PainterContextValue | undefined>(undefined);

export const PainterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [painter, setPainter] = useState<Painter | null>(null);
    const [revision, setRevision] = useState(0);
    const refreshPainter = useCallback(() => setRevision(value => value + 1), []);
    const value = useMemo(
        () => ({ painter, setPainter, refreshPainter, revision }),
        [painter, refreshPainter, revision]
    );

    return (
        <PainterContext.Provider value={value}>
            {children}
        </PainterContext.Provider>
    );
};

export const usePainter = () => {
    const context = useContext(PainterContext);
    if (context === undefined) {
        throw new Error('usePainter must be used within a PainterProvider');
    }
    return context;
};
