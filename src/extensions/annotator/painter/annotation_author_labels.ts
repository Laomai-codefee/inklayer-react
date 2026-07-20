import type Konva from 'konva'

import type { IAnnotationStore } from '../const/definitions'
import { ANNOTATION_AUTHOR_LABEL_BOUNDS_CHANGE_EVENT, ANNOTATION_AUTHOR_LABEL_CLASS, ANNOTATION_AUTHOR_LABELS_LAYER_CLASS } from './const'
import { getAnnotationAuthorLabelPosition, getAnnotationAuthorName, getReadableAuthorLabelTextColor } from './editor/annotation_author_label'
import { getTransformerPermissionStyle } from './editor/selector_permissions'

interface AnnotationAuthorLabelsOptions {
    primaryColor: string
    defaultVisible?: boolean
    getAnnotationsByPage: (pageNumber: number) => IAnnotationStore[]
    getAnnotationGroup: (annotation: IAnnotationStore, stage: Konva.Stage) => Konva.Group | null
    canTransform: (annotation: IAnnotationStore) => boolean
}

interface AnnotationAuthorLabelsPage {
    stage: Konva.Stage
    layer: HTMLDivElement
    labels: Map<string, HTMLDivElement>
}

interface VisibleAnnotationAuthorLabel {
    label: HTMLDivElement
    group: Konva.Group
}

function getPlatform(): string {
    const navigatorWithUserAgentData = navigator as Navigator & {
        userAgentData?: { platform?: string }
    }
    return navigatorWithUserAgentData.userAgentData?.platform || navigator.platform || navigator.userAgent
}

export function isAnnotationAuthorRevealKey(event: Pick<KeyboardEvent, 'key'>, isMac: boolean): boolean {
    return isMac ? event.key === 'Meta' : event.key === 'Alt'
}

export class AnnotationAuthorLabels {
    private readonly primaryColor: string
    private readonly getAnnotationsByPage: (pageNumber: number) => IAnnotationStore[]
    private readonly getAnnotationGroup: (annotation: IAnnotationStore, stage: Konva.Stage) => Konva.Group | null
    private readonly canTransform: (annotation: IAnnotationStore) => boolean
    private readonly isMac: boolean
    private readonly pages = new Map<number, AnnotationAuthorLabelsPage>()
    private readonly boundGroups = new Map<string, Konva.Group>()
    private readonly pressedRevealKeys = new Set<string>()
    private selectedId: string | null = null
    private allVisible: boolean

    constructor({ primaryColor, defaultVisible = false, getAnnotationsByPage, getAnnotationGroup, canTransform }: AnnotationAuthorLabelsOptions) {
        this.primaryColor = primaryColor
        this.allVisible = defaultVisible
        this.getAnnotationsByPage = getAnnotationsByPage
        this.getAnnotationGroup = getAnnotationGroup
        this.canTransform = canTransform
        this.isMac = /mac/i.test(getPlatform())

        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
        window.addEventListener('blur', this.clearShortcutReveal)
        document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    public registerPage(pageNumber: number, wrapper: HTMLDivElement, stage: Konva.Stage): void {
        this.unregisterPage(pageNumber)

        const layer = document.createElement('div')
        layer.className = ANNOTATION_AUTHOR_LABELS_LAYER_CLASS
        layer.setAttribute('aria-hidden', 'true')
        wrapper.appendChild(layer)

        this.pages.set(pageNumber, { stage, layer, labels: new Map() })
        this.refreshPage(pageNumber)
    }

    public unregisterPage(pageNumber: number): void {
        const page = this.pages.get(pageNumber)
        if (!page) return

        page.labels.forEach((_label, id) => this.unbindGroup(id))
        page.layer.remove()
        this.pages.delete(pageNumber)
    }

    public setSelected(id: string | null): void {
        if (this.selectedId === id) return
        const previousId = this.selectedId
        this.selectedId = id

        if (previousId) this.refreshAnnotation(previousId)
        if (id) this.refreshAnnotation(id)
    }

    public areAllVisible(): boolean {
        return this.allVisible
    }

    public setAllVisible(allVisible: boolean): void {
        if (this.allVisible === allVisible) return
        const wasVisible = this.shouldRevealAll()
        this.allVisible = allVisible
        if (wasVisible !== this.shouldRevealAll()) this.refreshAll()
    }

    public refreshAnnotation(id: string): void {
        const annotation = this.findAnnotation(id)
        if (!annotation) {
            this.remove(id)
            return
        }
        const page = this.pages.get(annotation.pageNumber)
        if (page) this.syncAnnotation(page, annotation, true)
    }

    public refreshPage(pageNumber: number): void {
        const page = this.pages.get(pageNumber)
        if (!page) return

        const annotations = this.getAnnotationsByPage(pageNumber)
        const activeIds = new Set(annotations.map((annotation) => annotation.id))
        page.labels.forEach((label, id) => {
            if (!activeIds.has(id)) {
                this.unbindGroup(id)
                label.remove()
                page.labels.delete(id)
            }
        })

        const visibleLabels: VisibleAnnotationAuthorLabel[] = []
        annotations.forEach((annotation) => {
            const visibleLabel = this.syncAnnotation(page, annotation, false)
            if (visibleLabel) visibleLabels.push(visibleLabel)
        })
        visibleLabels.forEach(({ label, group }) => this.positionLabel(page, label, group))
    }

    public refreshAll(): void {
        this.pages.forEach((_page, pageNumber) => this.refreshPage(pageNumber))
    }

    public remove(id: string): void {
        this.unbindGroup(id)
        this.pages.forEach((page) => {
            const label = page.labels.get(id)
            if (!label) return
            label.remove()
            page.labels.delete(id)
        })
        if (this.selectedId === id) this.selectedId = null
    }

    public destroy(): void {
        window.removeEventListener('keydown', this.handleKeyDown)
        window.removeEventListener('keyup', this.handleKeyUp)
        window.removeEventListener('blur', this.clearShortcutReveal)
        document.removeEventListener('visibilitychange', this.handleVisibilityChange)
        Array.from(this.pages.keys()).forEach((pageNumber) => this.unregisterPage(pageNumber))
        this.pressedRevealKeys.clear()
        this.boundGroups.clear()
        this.selectedId = null
        this.allVisible = false
    }

    private findAnnotation(id: string): IAnnotationStore | undefined {
        for (const pageNumber of this.pages.keys()) {
            const annotation = this.getAnnotationsByPage(pageNumber).find((item) => item.id === id)
            if (annotation) return annotation
        }
        return undefined
    }

    private syncAnnotation(page: AnnotationAuthorLabelsPage, annotation: IAnnotationStore, positionImmediately: boolean): VisibleAnnotationAuthorLabel | null {
        const authorName = getAnnotationAuthorName(annotation)
        const group = this.getAnnotationGroup(annotation, page.stage)
        if (!authorName || !group) {
            this.unbindGroup(annotation.id)
            const staleLabel = page.labels.get(annotation.id)
            staleLabel?.remove()
            page.labels.delete(annotation.id)
            return null
        }

        this.bindGroup(annotation.id, group)

        let label = page.labels.get(annotation.id)
        if (!label) {
            label = document.createElement('div')
            label.className = ANNOTATION_AUTHOR_LABEL_CLASS
            label.dataset.annotationId = annotation.id
            page.layer.appendChild(label)
            page.labels.set(annotation.id, label)
        }

        if (label.textContent !== authorName) label.textContent = authorName
        label.style.backgroundColor = this.primaryColor
        label.style.color = getReadableAuthorLabelTextColor(this.primaryColor)
        label.style.opacity = String(getTransformerPermissionStyle(this.canTransform(annotation)).authorLabelOpacity)

        const visible = this.shouldRevealAll() || annotation.id === this.selectedId
        label.style.display = visible ? 'block' : 'none'
        if (!visible) return null

        if (positionImmediately) this.positionLabel(page, label, group)
        return { label, group }
    }

    private positionLabel(page: AnnotationAuthorLabelsPage, label: HTMLDivElement, group: Konva.Group): void {
        const groupRect = group.getClientRect()
        const selectionPadding = 2
        const position = getAnnotationAuthorLabelPosition({
            selectionRect: {
                x: groupRect.x - selectionPadding,
                y: groupRect.y - selectionPadding,
                width: groupRect.width + selectionPadding * 2,
                height: groupRect.height + selectionPadding * 2
            },
            labelWidth: label.offsetWidth,
            labelHeight: label.offsetHeight,
            stageWidth: page.stage.width(),
            stageHeight: page.stage.height()
        })
        label.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
    }

    private bindGroup(id: string, group: Konva.Group): void {
        const currentGroup = this.boundGroups.get(id)
        if (currentGroup === group) return
        currentGroup?.off('.annotationAuthorLabels')
        group.on(
            `dragmove.annotationAuthorLabels transform.annotationAuthorLabels ${ANNOTATION_AUTHOR_LABEL_BOUNDS_CHANGE_EVENT}.annotationAuthorLabels`,
            () => {
                this.refreshAnnotation(id)
            }
        )
        this.boundGroups.set(id, group)
    }

    private unbindGroup(id: string): void {
        this.boundGroups.get(id)?.off('.annotationAuthorLabels')
        this.boundGroups.delete(id)
    }

    private shouldRevealAll(): boolean {
        return this.allVisible || this.pressedRevealKeys.size > 0
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (!isAnnotationAuthorRevealKey(event, this.isMac)) return
        const wasVisible = this.shouldRevealAll()
        this.pressedRevealKeys.add(event.code || event.key)
        if (wasVisible !== this.shouldRevealAll()) this.refreshAll()
    }

    private handleKeyUp = (event: KeyboardEvent): void => {
        if (!isAnnotationAuthorRevealKey(event, this.isMac)) return
        const wasVisible = this.shouldRevealAll()
        this.pressedRevealKeys.delete(event.code || event.key)
        if (wasVisible !== this.shouldRevealAll()) this.refreshAll()
    }

    private handleVisibilityChange = (): void => {
        if (document.hidden) this.clearShortcutReveal()
    }

    private clearShortcutReveal = (): void => {
        const wasVisible = this.shouldRevealAll()
        this.pressedRevealKeys.clear()
        if (wasVisible !== this.shouldRevealAll()) this.refreshAll()
    }
}
