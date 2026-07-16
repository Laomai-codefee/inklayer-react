import Highlighter from 'web-highlighter'

interface HighlightCreatedEvent {
    sources: Array<{ id: string }>
}

/**
 * WebSelection 类用于处理网页选区的实用工具类。
 */
export class WebSelection {
    isEditing: boolean // 指示是否启用编辑模式
    onSelect: (range: Range | null) => void // 当选区被选中时调用的回调函数
    onHighlight: (selection: Partial<Record<string, HTMLElement[]>>) => void
    highlighterObj: null | Highlighter
    private root: HTMLDivElement | null = null
    private isSelecting = false

    private readonly handleSelectionChange = () => {
        const selection = window.getSelection()
        if (selection?.type === 'Caret' || selection?.anchorNode === null) {
            this.onSelect(null)
            return
        }
        if (selection && selection.toString()) {
            const range = selection.getRangeAt(0)
            const selectedElement = range.commonAncestorContainer
            if (this.root?.contains(selectedElement)) {
                this.isSelecting = true
            }
        }
    }

    private readonly handleSelectionEnd = () => {
        if (!this.isSelecting) return

        this.isSelecting = false
        const selection = window.getSelection()
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        this.onSelect(range)
    }

    private readonly handleHighlightCreated = (data: HighlightCreatedEvent) => {
        const highlighter = this.highlighterObj
        if (!highlighter) return

        const allSourcesSpan = data.sources.flatMap((source) => highlighter.getDoms(source.id))
        const pageSelection = allSourcesSpan.reduce<Record<string, HTMLElement[]>>((acc, span) => {
            const page = span.closest('.page')?.getAttribute('data-page-number') ?? '-1'
            ;(acc[page] ||= []).push(span)
            return acc
        }, {})

        this.onHighlight(pageSelection)
        highlighter.removeAll()
        window.getSelection()?.removeAllRanges()
    }

    /**
     * 构造一个新的 WebSelection 实例。
     * @param onSelect 当选区被选中时调用的回调函数
     */
    constructor({
        onSelect,
        onHighlight
    }: {
        onSelect: (range: Range | null) => void
        onHighlight: (selection: Partial<Record<string, HTMLElement[]>>) => void
    }) {
        this.isEditing = false
        this.onSelect = onSelect
        this.onHighlight = onHighlight
        this.highlighterObj = null
    }

    /**
     * 在指定的根元素和页码上创建一个高亮器。
     * @param root 要应用高亮器的根元素
     */
    public create(root: HTMLDivElement) {
        this.destroy()
        this.root = root

        this.highlighterObj = new Highlighter({
            $root: root,
            wrapTag: 'mark'
        })
        this.highlighterObj.stop()
        document.addEventListener('selectionchange', this.handleSelectionChange)
        document.addEventListener('mouseup', this.handleSelectionEnd)
        document.addEventListener('touchend', this.handleSelectionEnd)
        this.highlighterObj.on('selection:create', this.handleHighlightCreated)
    }

    public highlight(range: Range | null) {
        if (range) {
            this.highlighterObj?.fromRange(range)
        }
    }

    public destroy() {
        document.removeEventListener('selectionchange', this.handleSelectionChange)
        document.removeEventListener('mouseup', this.handleSelectionEnd)
        document.removeEventListener('touchend', this.handleSelectionEnd)

        if (this.highlighterObj) {
            this.highlighterObj.off('selection:create', this.handleHighlightCreated)
            this.highlighterObj.dispose()
            this.highlighterObj = null
        }

        this.root = null
        this.isSelecting = false
    }
}
