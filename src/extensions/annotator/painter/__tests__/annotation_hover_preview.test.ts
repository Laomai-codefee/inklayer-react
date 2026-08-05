/** @jest-environment jsdom */

import Konva from 'konva'

import type { IAnnotationStore } from '../../const/definitions'
import { AnnotationHoverPreview } from '../annotation_hover_preview'
import { ANNOTATION_HOVER_PREVIEW_NAME, SHAPE_GROUP_NAME } from '../const'

describe('AnnotationHoverPreview', () => {
    afterEach(() => {
        document.body.replaceChildren()
    })

    it('draws a non-interactive solid preview around a hovered annotation', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const stage = new Konva.Stage({
            container,
            width: 600,
            height: 800,
            scale: { x: 2, y: 2 }
        })
        const layer = new Konva.Layer()
        const group = new Konva.Group({ id: 'annotation-1', name: SHAPE_GROUP_NAME })
        group.add(new Konva.Rect({ x: 20, y: 30, width: 80, height: 40 }))
        layer.add(group)
        stage.add(layer)

        const annotation = {
            id: group.id(),
            pageNumber: 1
        } as IAnnotationStore
        const preview = new AnnotationHoverPreview({
            getAnnotation: (id) => id === annotation.id ? annotation : undefined,
            getStage: () => stage,
            getAnnotationGroup: () => group
        })

        preview.setHovered(annotation.id)
        const previewRect = layer.getChildren().find(
            (node) => node.name() === ANNOTATION_HOVER_PREVIEW_NAME
        ) as Konva.Rect
        const groupRect = group.getClientRect({ relativeTo: layer })

        expect(previewRect).toBeInstanceOf(Konva.Rect)
        expect(previewRect.listening()).toBe(false)
        expect(previewRect.stroke()).toBe('#8b8d98')
        expect(previewRect.strokeWidth()).toBe(1)
        expect(previewRect.dash()).toEqual([])
        expect(previewRect.opacity()).toBe(0.65)
        expect(previewRect.strokeScaleEnabled()).toBe(false)
        expect(previewRect.x()).toBe(groupRect.x - 1)
        expect(previewRect.y()).toBe(groupRect.y - 1)
        expect(previewRect.width()).toBe(groupRect.width + 2)
        expect(previewRect.height()).toBe(groupRect.height + 2)

        preview.destroy()
        stage.destroy()
    })

    it('keeps selection visually dominant and follows group bounds changes', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const stage = new Konva.Stage({ container, width: 600, height: 800 })
        const layer = new Konva.Layer()
        const group = new Konva.Group({ id: 'annotation-1', name: SHAPE_GROUP_NAME })
        group.add(new Konva.Rect({ x: 20, y: 30, width: 80, height: 40 }))
        layer.add(group)
        stage.add(layer)

        const annotation = { id: group.id(), pageNumber: 1 } as IAnnotationStore
        const preview = new AnnotationHoverPreview({
            getAnnotation: () => annotation,
            getStage: () => stage,
            getAnnotationGroup: () => group
        })
        const getPreviewRect = () => layer.getChildren().find(
            (node) => node.name() === ANNOTATION_HOVER_PREVIEW_NAME
        ) as Konva.Rect | undefined

        preview.setHovered(annotation.id)
        expect(getPreviewRect()).toBeDefined()

        preview.setSelected(annotation.id)
        expect(getPreviewRect()).toBeUndefined()

        preview.setSelected(null)
        const initialX = getPreviewRect()!.x()
        group.x(25)
        group.fire('dragmove')
        expect(getPreviewRect()!.x()).toBe(initialX + 25)

        preview.unregisterPage(1)
        expect(getPreviewRect()).toBeUndefined()

        preview.destroy()
        stage.destroy()
    })
})
