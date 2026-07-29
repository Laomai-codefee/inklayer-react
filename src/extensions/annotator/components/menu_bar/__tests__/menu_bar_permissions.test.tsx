/** @jest-environment jsdom */

import React, { createRef } from 'react'
import { act, render } from '@testing-library/react'
import { MenuBar, MenuBarRef } from '..'
import type { IAnnotationStore } from '../../../const/definitions'

const mockCan = jest.fn()
const mockOpenSidebar = jest.fn()
const mockSetSelectedAnnotation = jest.fn()
let renderButtons: (() => Array<{ key: string; onClick?: () => void }>) | undefined

jest.mock('konva', () => ({
    Node: {
        create: () => ({
            children: [{ strokeWidth: () => 2, opacity: () => 1 }]
        })
    }
}))

jest.mock('@/components/popover_bar', () => {
    const React = jest.requireActual('react')
    return {
        PopoverBar: React.forwardRef((props: { renderButtons: () => Array<{ key: string; onClick?: () => void }> }, ref: React.Ref<unknown>) => {
            renderButtons = props.renderButtons
            React.useImperativeHandle(ref, () => ({ openWithRect: jest.fn(), close: jest.fn() }))
            return null
        })
    }
})

jest.mock('../../../context/use_painter', () => ({
    usePainter: () => ({ painter: { can: mockCan } })
}))

jest.mock('../../../context/options_context', () => ({
    useOptionsContext: () => ({ defaultOptions: { colors: ['#000000'] } })
}))

jest.mock('@/context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({ openSidebar: mockOpenSidebar, activeSidebarPanel: null })
}))

jest.mock('../../../store', () => ({
    SelectionSource: { CANVAS: 'canvas' },
    useAnnotationStore: { getState: () => ({ setSelectedAnnotation: mockSetSelectedAnnotation }) }
}))

jest.mock('@/components/color_picker', () => ({ ColorPicker: () => null }))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    })
}))

const annotation = {
    id: 'annotation-1',
    pageNumber: 1,
    type: 3,
    pdfjsType: 5,
    subtype: 'Square',
    title: 'Alice',
    date: '',
    user: { id: 'alice', name: 'Alice' },
    comments: [],
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    native: false
} as IAnnotationStore

describe('MenuBar permissions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        renderButtons = undefined
        document.body.innerHTML = '<div id="painter_wrapper_page_1"><div class="konvajs-content"></div></div>'
    })

    it('keeps comments available while hiding mutation controls for a non-owner', () => {
        mockCan.mockImplementation((action: string) => action === 'annotation.comment')
        const ref = createRef<MenuBarRef>()
        render(<MenuBar ref={ref} />)

        act(() => ref.current?.open(annotation, annotation.konvaClientRect))

        expect(renderButtons?.().map(button => button.key)).toEqual(['comment'])
    })

    it('shows all applicable controls when the owner is allowed', () => {
        mockCan.mockReturnValue(true)
        const ref = createRef<MenuBarRef>()
        render(<MenuBar ref={ref} />)

        act(() => ref.current?.open(annotation, annotation.konvaClientRect))

        expect(renderButtons?.().map(button => button.key)).toEqual(['comment', 'palette', 'delete'])
    })

    it('opens comments with one synchronous Canvas selection', () => {
        mockCan.mockImplementation((action: string) => action === 'annotation.comment')
        const ref = createRef<MenuBarRef>()
        render(<MenuBar ref={ref} />)
        act(() => ref.current?.open(annotation, annotation.konvaClientRect))

        act(() => renderButtons?.().find((button) => button.key === 'comment')?.onClick?.())

        expect(mockOpenSidebar).toHaveBeenCalledWith('annotator-sidebar-toggle')
        expect(mockSetSelectedAnnotation).toHaveBeenCalledTimes(1)
        expect(mockSetSelectedAnnotation).toHaveBeenCalledWith(annotation, 'canvas')
    })
})
