import type Konva from 'konva'

import { SHAPE_GROUP_NAME } from './const'

interface AnnotationPassiveHoverOptions {
    shouldSuppress: () => boolean
    onHoverStart: (id: string) => void
    onHoverEnd: (id: string) => void
}

interface PendingPointer {
    clientX: number
    clientY: number
    buttons: number
    pointerType: string
}

interface PassiveHoverPage {
    element: HTMLDivElement
    stage: Konva.Stage
    pointerMove: (event: PointerEvent) => void
    pointerLeave: (event: PointerEvent) => void
    pendingPointer: PendingPointer | null
    frameId: number | null
}

interface ActiveHover {
    pageNumber: number
    annotationId: string
}

export class AnnotationPassiveHover {
    private readonly shouldSuppress: () => boolean
    private readonly onHoverStart: (id: string) => void
    private readonly onHoverEnd: (id: string) => void
    private readonly pages = new Map<number, PassiveHoverPage>()
    private activeHover: ActiveHover | null = null

    constructor({ shouldSuppress, onHoverStart, onHoverEnd }: AnnotationPassiveHoverOptions) {
        this.shouldSuppress = shouldSuppress
        this.onHoverStart = onHoverStart
        this.onHoverEnd = onHoverEnd
    }

    public registerPage(pageNumber: number, element: HTMLDivElement, stage: Konva.Stage): void {
        this.unregisterPage(pageNumber)

        const page = {
            element,
            stage,
            pointerMove: (event: PointerEvent) => this.handlePointerMove(pageNumber, event),
            pointerLeave: (event: PointerEvent) => this.handlePointerLeave(pageNumber, event),
            pendingPointer: null,
            frameId: null
        } satisfies PassiveHoverPage

        element.addEventListener('pointermove', page.pointerMove, { capture: true, passive: true })
        element.addEventListener('pointerleave', page.pointerLeave, { capture: true, passive: true })
        this.pages.set(pageNumber, page)
    }

    public unregisterPage(pageNumber: number): void {
        const page = this.pages.get(pageNumber)
        if (!page) return

        page.element.removeEventListener('pointermove', page.pointerMove, true)
        page.element.removeEventListener('pointerleave', page.pointerLeave, true)
        this.cancelPending(page)
        this.pages.delete(pageNumber)
        this.clearPage(pageNumber)
    }

    public clear(): void {
        const activeHover = this.activeHover
        this.activeHover = null
        this.pages.forEach((page) => {
            this.cancelPending(page)
        })
        if (activeHover) this.onHoverEnd(activeHover.annotationId)
    }

    public destroy(): void {
        Array.from(this.pages.keys()).forEach((pageNumber) => this.unregisterPage(pageNumber))
        this.clear()
    }

    private handlePointerMove(pageNumber: number, event: PointerEvent): void {
        const page = this.pages.get(pageNumber)
        if (!page) return

        if (
            this.shouldSuppress()
            || event.buttons !== 0
            || event.pointerType === 'touch'
        ) {
            this.cancelPending(page)
            this.clearPage(pageNumber)
            return
        }

        page.pendingPointer = {
            clientX: event.clientX,
            clientY: event.clientY,
            buttons: event.buttons,
            pointerType: event.pointerType
        }
        if (page.frameId !== null) return

        page.frameId = requestAnimationFrame(() => {
            page.frameId = null
            this.resolvePointer(pageNumber)
        })
    }

    private handlePointerLeave(pageNumber: number, event: PointerEvent): void {
        const page = this.pages.get(pageNumber)
        if (!page || event.target !== page.element) return
        this.cancelPending(page)
        this.clearPage(pageNumber)
    }

    private resolvePointer(pageNumber: number): void {
        const page = this.pages.get(pageNumber)
        const pointer = page?.pendingPointer
        if (!page || !pointer) return
        page.pendingPointer = null

        if (
            this.shouldSuppress()
            || pointer.buttons !== 0
            || pointer.pointerType === 'touch'
            || page.stage.getLayers().length === 0
        ) {
            this.clearPage(pageNumber)
            return
        }

        const containerRect = page.stage.container().getBoundingClientRect()
        if (
            containerRect.width <= 0
            || containerRect.height <= 0
            || pointer.clientX < containerRect.left
            || pointer.clientX > containerRect.right
            || pointer.clientY < containerRect.top
            || pointer.clientY > containerRect.bottom
        ) {
            this.clearPage(pageNumber)
            return
        }

        const stagePoint = {
            x: (pointer.clientX - containerRect.left) * (page.stage.width() / containerRect.width),
            y: (pointer.clientY - containerRect.top) * (page.stage.height() / containerRect.height)
        }
        const shape = page.stage.getIntersection(stagePoint)
        const group = shape?.findAncestor(`.${SHAPE_GROUP_NAME}`)
        const annotationId = group?.id() || null
        if (!annotationId) {
            this.clearPage(pageNumber)
            return
        }

        if (
            this.activeHover?.pageNumber === pageNumber
            && this.activeHover.annotationId === annotationId
        ) {
            return
        }
        this.activeHover = { pageNumber, annotationId }
        this.onHoverStart(annotationId)
    }

    private clearPage(pageNumber: number): void {
        if (this.activeHover?.pageNumber !== pageNumber) return
        const { annotationId } = this.activeHover
        this.activeHover = null
        this.onHoverEnd(annotationId)
    }

    private cancelPending(page: PassiveHoverPage): void {
        if (page.frameId !== null) cancelAnimationFrame(page.frameId)
        page.pendingPointer = null
        page.frameId = null
    }
}
