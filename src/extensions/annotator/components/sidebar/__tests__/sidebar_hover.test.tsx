/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'

import { UserContext } from '@/context/user_context'
import type { IAnnotationStore } from '../../../const/definitions'
import { Sidebar } from '..'

jest.mock('../styles.module.scss', () => ({
    sidebar: 'sidebar',
    list: 'list',
    group: 'group',
    comment: 'comment',
    selected: 'selected',
    title: 'title',
    annotationHeader: 'annotationHeader',
    annotationHeading: 'annotationHeading',
    annotationHeadingActive: 'annotationHeadingActive',
    annotationMeta: 'annotationMeta',
    annotationAuthor: 'annotationAuthor',
    annotationDateTime: 'annotationDateTime',
    annotationTypeIcon: 'annotationTypeIcon',
    toolButton: 'toolButton',
    reply: 'reply',
    replyMeta: 'replyMeta',
    filter: 'filter'
}))

jest.mock('../../../utils/utils', () => ({
    formatPDFCompactDateTime: jest.fn(() => '07-28 12:00'),
    formatPDFDate: jest.fn(() => '07-28'),
    formatTimestamp: jest.fn(() => ''),
    generateUUID: jest.fn(() => 'generated-id')
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

let mockPainter: Record<string, unknown>
let mockStoreState: Record<string, unknown>

jest.mock('../../../context/use_painter', () => ({
    usePainter: () => ({ painter: mockPainter })
}))

jest.mock('@/context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({ isSidebarCollapsed: false })
}))

jest.mock('../../../store', () => ({
    SelectionSource: { CANVAS: 'canvas', SIDEBAR: 'sidebar' },
    useAnnotationStore: Object.assign(
        (selector: (state: Record<string, unknown>) => unknown) =>
            selector(mockStoreState),
        {
            getState: () => mockStoreState
        }
    )
}))

const annotation = {
    id: 'annotation-1',
    referenceNumber: 1,
    pageNumber: 1,
    type: 3,
    pdfjsType: 5,
    subtype: 'Square',
    title: 'Alice',
    date: 'D:20260728120000+08\'00\'',
    user: { id: 'alice', name: 'Alice' },
    comments: [],
    contentsObj: { text: '' },
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    native: false
} as IAnnotationStore

const secondAnnotation = {
    ...annotation,
    id: 'annotation-2',
    referenceNumber: 2,
    title: 'Bob',
    user: { id: 'bob', name: 'Bob' }
} as IAnnotationStore

function renderSidebar(
    selected = false,
    annotationList = [annotation],
    can: (action: string) => boolean = () => false,
    selectionSource = 'sidebar'
) {
    const setSelectedAnnotation = jest.fn()
    const clearSelectedAnnotation = jest.fn()
    const highlight = jest.fn()
    const setAnnotationHover = jest.fn()
    const clearAnnotationHover = jest.fn()
    const subscribeAnnotationHover = jest.fn()
    mockPainter = {
        can: jest.fn(can),
        highlight,
        update: jest.fn(),
        setAnnotationHover,
        clearAnnotationHover,
        subscribeAnnotationHover
    }
    mockStoreState = {
        annotations: new Map(annotationList.map((item) => [item.id, item])),
        selectedAnnotation: selected
            ? { store: annotation, source: selectionSource }
            : null,
        selectionRevision: 0,
        getAnnotation: (id: string) => annotationList.find((item) => item.id === id),
        setSelectedAnnotation,
        clearSelectedAnnotation
    }

    const renderTree = () => (
        <Theme>
            <UserContext.Provider value={{ user: annotation.user! }}>
                <Sidebar />
            </UserContext.Provider>
        </Theme>
    )
    const view = render(renderTree())

    return {
        ...view,
        rerenderSidebar: () => view.rerender(renderTree()),
        setSelectedAnnotation,
        clearSelectedAnnotation,
        setAnnotationHover,
        clearAnnotationHover,
        subscribeAnnotationHover,
        highlight
    }
}

describe('Sidebar annotation interaction', () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView

    afterEach(() => {
        if (originalScrollIntoView) {
            Object.defineProperty(Element.prototype, 'scrollIntoView', {
                configurable: true,
                value: originalScrollIntoView
            })
        } else {
            delete (Element.prototype as { scrollIntoView?: Element['scrollIntoView'] }).scrollIntoView
        }
    })

    it('keeps pointer hover local without selecting, navigating, scrolling, or notifying Canvas', () => {
        const {
            setAnnotationHover,
            clearAnnotationHover,
            setSelectedAnnotation,
            highlight
        } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!
        const list = document.querySelector('.list') as HTMLDivElement
        list.scrollTop = 120

        fireEvent.pointerEnter(card, { pointerType: 'mouse' })

        expect(setAnnotationHover).not.toHaveBeenCalled()
        expect(setSelectedAnnotation).not.toHaveBeenCalled()
        expect(highlight).not.toHaveBeenCalled()
        expect(list.scrollTop).toBe(120)

        fireEvent.pointerLeave(card, { pointerType: 'mouse' })
        expect(clearAnnotationHover).not.toHaveBeenCalled()
    })

    it('does not subscribe the Sidebar to Canvas hover changes', () => {
        const { subscribeAnnotationHover } = renderSidebar()

        expect(subscribeAnnotationHover).not.toHaveBeenCalled()
    })

    it('shows cross-panel state only after selection', () => {
        const { setSelectedAnnotation, highlight } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!

        fireEvent.click(card)

        expect(setSelectedAnnotation).toHaveBeenCalledWith(annotation, 'sidebar')
        expect(highlight).toHaveBeenCalledWith(annotation)
    })

    it('scrolls a newly opened Canvas editor into view after it mounts', async () => {
        const scrollIntoView = jest.fn()
        Object.defineProperty(Element.prototype, 'scrollIntoView', {
            configurable: true,
            value: scrollIntoView
        })

        renderSidebar(
            true,
            [annotation],
            (action) => action === 'annotation.edit',
            'canvas'
        )

        const input = await screen.findByRole('combobox')
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
        expect(scrollIntoView.mock.instances[0]).toBe(input.closest('[data-annotation-editor]'))
        expect(scrollIntoView).toHaveBeenCalledWith({
            behavior: 'auto',
            block: 'nearest',
            inline: 'nearest'
        })
    })

    it('uses distinct placeholders for annotation comments and replies', async () => {
        const commentView = renderSidebar(
            true,
            [annotation],
            (action) => action === 'annotation.edit',
            'canvas'
        )
        expect(
            (await screen.findByRole('combobox')).getAttribute('placeholder')
        ).toBe('annotator:comment.reference.commentPlaceholder')
        commentView.unmount()

        renderSidebar(
            true,
            [annotation],
            (action) => action === 'annotation.comment',
            'canvas'
        )
        expect(
            (await screen.findByRole('combobox')).getAttribute('placeholder')
        ).toBe('annotator:comment.reference.replyPlaceholder')
    })

    it('replaces the active editor when Canvas selection moves to another annotation', async () => {
        const annotationWithContent = {
            ...secondAnnotation,
            contentsObj: { text: 'Existing comment' }
        }
        const { rerenderSidebar } = renderSidebar(
            true,
            [annotation, annotationWithContent],
            (action) => action === 'annotation.edit' || action === 'annotation.comment',
            'canvas'
        )

        await screen.findByRole('combobox')

        mockStoreState = {
            ...mockStoreState,
            selectedAnnotation: {
                store: annotationWithContent,
                source: 'canvas'
            },
            selectionRevision: 1
        }
        rerenderSidebar()

        await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(1))
        expect((screen.getByRole('combobox') as HTMLTextAreaElement).value).toBe('')
    })

    it('uses the first pointer click on another menu to collapse the active editor', async () => {
        renderSidebar(
            true,
            [annotation, secondAnnotation],
            (action) => action === 'annotation.edit',
            'canvas'
        )
        await screen.findByRole('combobox')

        const secondCard = document.getElementById(`annotation-${secondAnnotation.id}`)!
        const menuTrigger = within(secondCard).getByRole('button', { name: 'more' })

        fireEvent.pointerDown(menuTrigger, { button: 0, ctrlKey: false })
        await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
        expect(screen.queryByRole('menu')).toBeNull()
    })

    it('preserves user filters when annotation content changes', async () => {
        const { rerenderSidebar } = renderSidebar(false, [annotation, secondAnnotation])

        fireEvent.click(screen.getAllByRole('button')[0])
        const aliceFilter = await screen.findByRole('checkbox', { name: /Alice/ })
        fireEvent.click(aliceFilter)
        expect(aliceFilter.getAttribute('data-state')).toBe('unchecked')

        const updatedAnnotation = {
            ...annotation,
            contentsObj: { text: 'Updated comment' }
        }
        mockStoreState = {
            ...mockStoreState,
            annotations: new Map([
                [updatedAnnotation.id, updatedAnnotation],
                [secondAnnotation.id, secondAnnotation]
            ])
        }
        rerenderSidebar()

        expect(
            (await screen.findByRole('checkbox', { name: /Alice/ }))
                .getAttribute('data-state')
        ).toBe('unchecked')
    })

    it('uses translated InkLayer tool names in the annotation type filter', async () => {
        renderSidebar(false, [annotation])

        fireEvent.click(screen.getAllByRole('button')[0])

        expect(
            await screen.findByRole('checkbox', { name: /annotator:tool\.underline \(1\)/ })
        ).not.toBeNull()
        expect(screen.queryByText(/Square/)).toBeNull()
    })

    it('does not broadcast hover sources when it unmounts', () => {
        const {
            unmount,
            setAnnotationHover,
            clearAnnotationHover
        } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!

        fireEvent.pointerEnter(card, { pointerType: 'mouse' })
        fireEvent.focus(card)
        unmount()

        expect(setAnnotationHover).not.toHaveBeenCalled()
        expect(clearAnnotationHover).not.toHaveBeenCalled()
    })
})
