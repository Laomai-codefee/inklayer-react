import type { AnnotationType, IAnnotationComment, IAnnotationStore } from '../const/definitions'

export const DELETE_UNDO_DURATION_MS = 8000

export interface DeletedAnnotationEntry {
    kind: 'annotation'
    annotation: IAnnotationStore
    storeIndex: number
    konvaIndex: number | null
}

export interface DeletedCommentEntry {
    kind: 'comment'
    annotationId: string
    annotationReferenceNumber?: number
    previewAnnotation: IAnnotationStore
    comment: IAnnotationComment
    commentIndex: number
}

export type DeleteUndoEntry = DeletedAnnotationEntry | DeletedCommentEntry

export interface DeleteUndoItemSummary {
    kind: 'annotation' | 'comment'
    previewAnnotation: IAnnotationStore
    previewComment?: IAnnotationComment
    annotationReferenceNumber?: number
    annotationType?: AnnotationType
    pageNumber?: number
    content?: string
    author?: string
}

export interface DeleteUndoSnapshot {
    annotationCount: number
    commentCount: number
    totalCount: number
    expiresAt: number
    items: DeleteUndoItemSummary[]
}

type DeleteUndoListener = () => void

function cloneValue<T>(value: T): T {
    if (typeof structuredClone === 'function') return structuredClone(value)
    return JSON.parse(JSON.stringify(value)) as T
}

export function cloneAnnotationForUndo(annotation: IAnnotationStore): IAnnotationStore {
    return cloneValue(annotation)
}

export function cloneCommentForUndo(comment: IAnnotationComment): IAnnotationComment {
    return cloneValue(comment)
}

export class DeleteUndoController {
    private entries: DeleteUndoEntry[] = []
    private snapshot: DeleteUndoSnapshot | null = null
    private listeners = new Set<DeleteUndoListener>()
    private timer: ReturnType<typeof setTimeout> | null = null
    private remainingMs = DELETE_UNDO_DURATION_MS
    private paused = false

    public subscribe(listener: DeleteUndoListener): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    public getSnapshot(): DeleteUndoSnapshot | null {
        return this.snapshot
    }

    public add(entry: DeleteUndoEntry): void {
        this.entries.push(entry)
        this.remainingMs = DELETE_UNDO_DURATION_MS
        this.setSnapshot(Date.now() + this.remainingMs)
        this.clearTimer()
        if (!this.paused) this.scheduleExpiry()
    }

    public takeEntries(): DeleteUndoEntry[] {
        const entries = this.entries
        this.reset()
        return entries
    }

    public pause(): void {
        if (this.paused || !this.snapshot) return
        this.paused = true
        this.remainingMs = Math.max(0, this.snapshot.expiresAt - Date.now())
        this.clearTimer()
    }

    public resume(): void {
        if (!this.paused || this.entries.length === 0) return
        this.paused = false
        if (this.remainingMs <= 0) {
            this.reset()
            return
        }
        this.setSnapshot(Date.now() + this.remainingMs)
        this.scheduleExpiry()
    }

    public clear(): void {
        this.reset()
    }

    private scheduleExpiry(): void {
        this.timer = setTimeout(() => this.reset(), this.remainingMs)
    }

    private setSnapshot(expiresAt: number): void {
        let annotationCount = 0
        let commentCount = 0
        this.entries.forEach((entry) => {
            if (entry.kind === 'annotation') annotationCount += 1
            else commentCount += 1
        })
        this.snapshot = {
            annotationCount,
            commentCount,
            totalCount: this.entries.length,
            expiresAt,
            items: this.entries.map((entry) => entry.kind === 'annotation'
                ? {
                    kind: entry.kind,
                    previewAnnotation: entry.annotation,
                    annotationReferenceNumber: entry.annotation.referenceNumber,
                    annotationType: entry.annotation.type,
                    pageNumber: entry.annotation.pageNumber,
                    content: entry.annotation.contentsObj?.text
                }
                : {
                    kind: entry.kind,
                    previewAnnotation: entry.previewAnnotation,
                    previewComment: entry.comment,
                    annotationReferenceNumber: entry.annotationReferenceNumber,
                    content: entry.comment.content,
                    author: entry.comment.title
                })
        }
        this.emit()
    }

    private reset(): void {
        const hadSnapshot = this.snapshot !== null
        this.clearTimer()
        this.entries = []
        this.snapshot = null
        this.remainingMs = DELETE_UNDO_DURATION_MS
        this.paused = false
        if (hadSnapshot) this.emit()
    }

    private clearTimer(): void {
        if (this.timer === null) return
        clearTimeout(this.timer)
        this.timer = null
    }

    private emit(): void {
        this.listeners.forEach((listener) => listener())
    }
}
