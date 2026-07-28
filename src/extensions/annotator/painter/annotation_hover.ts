export type AnnotationHoverSource =
    | 'sidebar-pointer'
    | 'sidebar-focus'
    | 'canvas'
    | 'canvas-passive'

export interface AnnotationHoverSnapshot {
    annotationId: string | null
    source: AnnotationHoverSource | null
}

interface AnnotationHoverEntry {
    annotationId: string
    sequence: number
}

type AnnotationHoverListener = (snapshot: AnnotationHoverSnapshot) => void

const EMPTY_SNAPSHOT: AnnotationHoverSnapshot = Object.freeze({
    annotationId: null,
    source: null
})

export class AnnotationHoverCoordinator {
    private readonly entries = new Map<AnnotationHoverSource, AnnotationHoverEntry>()
    private readonly listeners = new Set<AnnotationHoverListener>()
    private sequence = 0
    private snapshot = EMPTY_SNAPSHOT
    private destroyed = false

    public set(source: AnnotationHoverSource, annotationId: string): void {
        if (this.destroyed) return
        const current = this.entries.get(source)
        if (current?.annotationId === annotationId) return

        this.entries.set(source, {
            annotationId,
            sequence: ++this.sequence
        })
        this.updateSnapshot()
    }

    public clear(source: AnnotationHoverSource, annotationId: string): void {
        if (this.destroyed) return
        const current = this.entries.get(source)
        if (current?.annotationId !== annotationId) return

        this.entries.delete(source)
        this.updateSnapshot()
    }

    public clearAnnotation(annotationId: string): void {
        if (this.destroyed) return
        let changed = false
        this.entries.forEach((entry, source) => {
            if (entry.annotationId !== annotationId) return
            this.entries.delete(source)
            changed = true
        })
        if (changed) this.updateSnapshot()
    }

    public clearAll(): void {
        if (this.destroyed) return
        if (this.entries.size === 0) return
        this.entries.clear()
        this.updateSnapshot()
    }

    public getSnapshot = (): AnnotationHoverSnapshot => this.snapshot

    public subscribe = (listener: AnnotationHoverListener): (() => void) => {
        if (this.destroyed) return () => {}
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    public destroy(): void {
        if (this.destroyed) return
        this.clearAll()
        this.destroyed = true
        this.listeners.clear()
    }

    private updateSnapshot(): void {
        let latestSource: AnnotationHoverSource | null = null
        let latestEntry: AnnotationHoverEntry | null = null

        for (const [source, entry] of this.entries) {
            if (!latestEntry || entry.sequence > latestEntry.sequence) {
                latestSource = source
                latestEntry = entry
            }
        }

        const annotationId = latestEntry?.annotationId ?? null
        if (
            this.snapshot.annotationId === annotationId
            && this.snapshot.source === latestSource
        ) {
            return
        }

        this.snapshot = annotationId === null
            ? EMPTY_SNAPSHOT
            : { annotationId, source: latestSource }
        this.listeners.forEach((listener) => listener(this.snapshot))
    }
}
