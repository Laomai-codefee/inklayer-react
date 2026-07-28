/** @jest-environment jsdom */

import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'

import { UserContext } from '@/context/user_context'
import type { IAnnotationStore } from '../../../const/definitions'
import { AnnotationHoverCoordinator } from '../../../painter/annotation_hover'
import { Sidebar } from '..'

jest.mock('../styles.module.scss', () => ({
    sidebar: 'sidebar',
    list: 'list',
    group: 'group',
    comment: 'comment',
    preview: 'preview',
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
    useAnnotationStore: (selector: (state: Record<string, unknown>) => unknown) =>
        selector(mockStoreState)
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
    const coordinator = new AnnotationHoverCoordinator()
    const setSelectedAnnotation = jest.fn()
    const clearSelectedAnnotation = jest.fn()
    const highlight = jest.fn()
    const setAnnotationHover = jest.fn((source, annotationId) => {
        coordinator.set(source, annotationId)
    })
    const clearAnnotationHover = jest.fn((source, annotationId) => {
        coordinator.clear(source, annotationId)
    })
    mockPainter = {
        can: jest.fn(can),
        highlight,
        update: jest.fn(),
        setAnnotationHover,
        clearAnnotationHover,
        subscribeAnnotationHover: coordinator.subscribe,
        getAnnotationHoverSnapshot: coordinator.getSnapshot
    }
    mockStoreState = {
        annotations: new Map(annotationList.map((item) => [item.id, item])),
        selectedAnnotation: selected
            ? { store: annotation, source: selectionSource }
            : null,
        setSelectedAnnotation,
        clearSelectedAnnotation
    }

    const view = render(
        <Theme>
            <UserContext.Provider value={{ user: annotation.user! }}>
                <Sidebar />
            </UserContext.Provider>
        </Theme>
    )

    return {
        ...view,
        coordinator,
        setSelectedAnnotation,
        clearSelectedAnnotation,
        setAnnotationHover,
        clearAnnotationHover,
        highlight
    }
}

describe('Sidebar annotation hover', () => {
    it('previews a card from a mouse pointer without selecting, navigating, or scrolling', () => {
        const {
            setAnnotationHover,
            clearAnnotationHover,
            setSelectedAnnotation,
            highlight
        } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!
        const heading = card.querySelector('.annotationHeading')!
        const list = document.querySelector('.list') as HTMLDivElement
        list.scrollTop = 120

        fireEvent.pointerEnter(card, { pointerType: 'mouse' })

        expect(setAnnotationHover).toHaveBeenCalledWith('sidebar-pointer', annotation.id)
        expect(card.classList.contains('preview')).toBe(true)
        expect(heading.classList.contains('annotationHeadingActive')).toBe(true)
        expect(setSelectedAnnotation).not.toHaveBeenCalled()
        expect(highlight).not.toHaveBeenCalled()
        expect(list.scrollTop).toBe(120)

        fireEvent.pointerLeave(card, { pointerType: 'mouse' })
        expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-pointer', annotation.id)
        expect(card.classList.contains('preview')).toBe(false)
        expect(heading.classList.contains('annotationHeadingActive')).toBe(false)
    })

    it('ignores touch pointer entry', () => {
        const { setAnnotationHover } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!

        const touchEnter = createEvent.pointerEnter(card)
        Object.defineProperty(touchEnter, 'pointerType', { value: 'touch' })
        fireEvent(card, touchEnter)

        expect(setAnnotationHover).not.toHaveBeenCalled()
        expect(card.classList.contains('preview')).toBe(false)
    })

    it('keeps focus preview while focus moves within the same annotation owner', () => {
        const { setAnnotationHover, clearAnnotationHover } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!
        const ownedPortal = document.createElement('div')
        ownedPortal.dataset.annotationHoverOwner = annotation.id
        document.body.appendChild(ownedPortal)
        const outside = document.createElement('button')
        document.body.appendChild(outside)

        fireEvent.focus(card)
        expect(setAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)
        expect(card.classList.contains('preview')).toBe(true)

        fireEvent.blur(card, { relatedTarget: ownedPortal })
        expect(clearAnnotationHover).not.toHaveBeenCalledWith('sidebar-focus', annotation.id)

        fireEvent.blur(card, { relatedTarget: outside })
        expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)
        expect(card.classList.contains('preview')).toBe(false)

        ownedPortal.remove()
        outside.remove()
    })

    it('adds preview styling while the selected annotation is actively hovered', () => {
        const { coordinator } = renderSidebar(true)
        const card = document.getElementById(`annotation-${annotation.id}`)!
        const heading = card.querySelector('.annotationHeading')!
        const list = document.querySelector('.list') as HTMLDivElement
        list.scrollTop = 80

        act(() => coordinator.set('canvas', annotation.id))

        expect(card.classList.contains('preview')).toBe(true)
        expect(card.classList.contains('selected')).toBe(true)
        expect(heading.classList.contains('annotationHeadingActive')).toBe(true)
        expect(list.scrollTop).toBe(80)
    })

    it('does not use a focus preview as a hover border on a selected card', () => {
        const { coordinator } = renderSidebar(true)
        const selectedCard = document.getElementById(`annotation-${annotation.id}`)!

        act(() => coordinator.set('sidebar-focus', annotation.id))

        expect(selectedCard.classList.contains('selected')).toBe(true)
        expect(selectedCard.classList.contains('preview')).toBe(false)
    })

    it('removes preview styling from a selected card after its pointer hover clears', () => {
        const { coordinator } = renderSidebar(true, [annotation, secondAnnotation])
        const selectedCard = document.getElementById(`annotation-${annotation.id}`)!
        const otherCard = document.getElementById(`annotation-${secondAnnotation.id}`)!

        act(() => coordinator.set('sidebar-pointer', annotation.id))
        expect(selectedCard.classList.contains('selected')).toBe(true)
        expect(selectedCard.classList.contains('preview')).toBe(true)

        act(() => coordinator.clear('sidebar-pointer', annotation.id))
        expect(selectedCard.classList.contains('preview')).toBe(false)

        act(() => coordinator.set('sidebar-pointer', secondAnnotation.id))
        expect(otherCard.classList.contains('preview')).toBe(true)

        act(() => coordinator.clear('sidebar-pointer', secondAnnotation.id))
        expect(selectedCard.classList.contains('preview')).toBe(false)
        expect(otherCard.classList.contains('preview')).toBe(false)
    })

    it('clears focus hover when a focused reply editor is submitted and unmounted', async () => {
        const {
            coordinator,
            clearAnnotationHover
        } = renderSidebar(
            true,
            [annotation],
            (action) => action === 'annotation.comment',
            'canvas'
        )
        const input = await screen.findByRole('combobox')
        await waitFor(() => expect(document.activeElement).toBe(input))
        expect(coordinator.getSnapshot()).toEqual({
            annotationId: annotation.id,
            source: 'sidebar-focus'
        })

        fireEvent.change(input, { target: { value: 'Reply' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
        expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)
        expect(coordinator.getSnapshot()).toEqual({
            annotationId: null,
            source: null
        })
    })

    it('clears active Sidebar sources when it unmounts', () => {
        const {
            unmount,
            clearAnnotationHover
        } = renderSidebar()
        const card = document.getElementById(`annotation-${annotation.id}`)!

        fireEvent.pointerEnter(card, { pointerType: 'mouse' })
        fireEvent.focus(card)
        unmount()

        expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-pointer', annotation.id)
        expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)
    })
})
