import Konva from 'konva'

import type { IAnnotationStore } from '../const/definitions'
import {
    ANNOTATION_AUTHOR_LABEL_BOUNDS_CHANGE_EVENT,
    ANNOTATION_HOVER_PREVIEW_NAME
} from './const'

interface AnnotationHoverPreviewOptions {
    primaryColor: string
    getAnnotation: (id: string) => IAnnotationStore | undefined
    getStage: (pageNumber: number) => Konva.Stage | undefined
    getAnnotationGroup: (annotation: IAnnotationStore, stage: Konva.Stage) => Konva.Group | null
}

export class AnnotationHoverPreview {
    private readonly primaryColor: string
    private readonly getAnnotation: (id: string) => IAnnotationStore | undefined
    private readonly getStage: (pageNumber: number) => Konva.Stage | undefined
    private readonly getAnnotationGroup: (annotation: IAnnotationStore, stage: Konva.Stage) => Konva.Group | null
    private hoveredId: string | null = null
    private selectedId: string | null = null
    private previewRect: Konva.Rect | null = null
    private boundGroup: Konva.Group | null = null

    constructor({ primaryColor, getAnnotation, getStage, getAnnotationGroup }: AnnotationHoverPreviewOptions) {
        this.primaryColor = primaryColor
        this.getAnnotation = getAnnotation
        this.getStage = getStage
        this.getAnnotationGroup = getAnnotationGroup
    }

    public setHovered(id: string | null): void {
        if (this.hoveredId === id) return
        this.hoveredId = id
        this.refresh()
    }

    public setSelected(id: string | null): void {
        if (this.selectedId === id) return
        this.selectedId = id
        this.refresh()
    }

    public refresh(): void {
        this.removePreview()

        const id = this.hoveredId
        if (!id || id === this.selectedId) return

        const annotation = this.getAnnotation(id)
        if (!annotation) return
        const stage = this.getStage(annotation.pageNumber)
        if (!stage) return
        const group = this.getAnnotationGroup(annotation, stage)
        const layer = group?.getLayer()
        if (!group || !layer) return

        const scale = Math.abs(stage.scaleX()) || 1
        const padding = 2 / scale
        const rect = group.getClientRect({ relativeTo: layer })
        this.previewRect = new Konva.Rect({
            name: ANNOTATION_HOVER_PREVIEW_NAME,
            x: rect.x - padding,
            y: rect.y - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            stroke: this.primaryColor,
            strokeWidth: 2,
            dash: [],
            strokeScaleEnabled: false,
            opacity: 0.7,
            listening: false,
            perfectDrawEnabled: false
        })
        layer.add(this.previewRect)
        this.previewRect.moveToTop()
        layer.batchDraw()

        group.on(
            `dragmove.annotationHoverPreview transform.annotationHoverPreview ${ANNOTATION_AUTHOR_LABEL_BOUNDS_CHANGE_EVENT}.annotationHoverPreview`,
            this.handleBoundsChange
        )
        this.boundGroup = group
    }

    public unregisterPage(pageNumber: number): void {
        const id = this.hoveredId
        const annotation = id ? this.getAnnotation(id) : undefined
        if (annotation?.pageNumber === pageNumber) this.removePreview()
    }

    public destroy(): void {
        this.hoveredId = null
        this.selectedId = null
        this.removePreview()
    }

    private removePreview(): void {
        const layer = this.previewRect?.getLayer()
        this.boundGroup?.off('.annotationHoverPreview')
        this.boundGroup = null
        this.previewRect?.destroy()
        this.previewRect = null
        layer?.batchDraw()
    }

    private handleBoundsChange = (): void => {
        this.refresh()
    }
}
