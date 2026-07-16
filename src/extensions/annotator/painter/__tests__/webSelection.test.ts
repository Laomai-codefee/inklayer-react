/** @jest-environment jsdom */

import Highlighter from 'web-highlighter'
import { WebSelection } from '../webSelection'

jest.mock('web-highlighter', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        stop: jest.fn(),
        on: jest.fn(function () {
            return this
        }),
        off: jest.fn(function () {
            return this
        }),
        dispose: jest.fn(),
        getDoms: jest.fn(() => []),
        removeAll: jest.fn(),
        fromRange: jest.fn()
    }))
}))

interface MockHighlighter {
    off: jest.Mock
    dispose: jest.Mock
}

const getHighlighterInstance = (index: number) =>
    jest.mocked(Highlighter).mock.results[index].value as unknown as MockHighlighter

describe('WebSelection', () => {
    beforeEach(() => {
        jest.mocked(Highlighter).mockClear()
    })

    it('removes document and highlighter listeners when destroyed', () => {
        const onSelect = jest.fn()
        const selection = { type: 'Caret', anchorNode: null } as unknown as Selection
        const getSelection = jest.spyOn(window, 'getSelection').mockReturnValue(selection)
        const webSelection = new WebSelection({ onSelect, onHighlight: jest.fn() })

        webSelection.create(document.createElement('div'))
        document.dispatchEvent(new Event('selectionchange'))
        expect(onSelect).toHaveBeenCalledTimes(1)

        const highlighter = getHighlighterInstance(0)
        webSelection.destroy()
        document.dispatchEvent(new Event('selectionchange'))

        expect(onSelect).toHaveBeenCalledTimes(1)
        expect(highlighter.off).toHaveBeenCalledWith('selection:create', expect.any(Function))
        expect(highlighter.dispose).toHaveBeenCalledTimes(1)
        getSelection.mockRestore()
    })

    it('cleans up the previous instance before creating another one', () => {
        const webSelection = new WebSelection({ onSelect: jest.fn(), onHighlight: jest.fn() })

        webSelection.create(document.createElement('div'))
        const firstHighlighter = getHighlighterInstance(0)
        webSelection.create(document.createElement('div'))

        expect(firstHighlighter.off).toHaveBeenCalledTimes(1)
        expect(firstHighlighter.dispose).toHaveBeenCalledTimes(1)
        expect(Highlighter).toHaveBeenCalledTimes(2)

        webSelection.destroy()
    })

    it('does not retain document listeners across repeated mount cycles', () => {
        const onSelect = jest.fn()
        const selection = { type: 'Caret', anchorNode: null } as unknown as Selection
        const getSelection = jest.spyOn(window, 'getSelection').mockReturnValue(selection)
        const webSelection = new WebSelection({ onSelect, onHighlight: jest.fn() })

        for (let index = 0; index < 50; index++) {
            webSelection.create(document.createElement('div'))
            webSelection.destroy()
        }

        document.dispatchEvent(new Event('selectionchange'))
        expect(onSelect).not.toHaveBeenCalled()
        expect(Highlighter).toHaveBeenCalledTimes(50)
        for (let index = 0; index < 50; index++) {
            expect(getHighlighterInstance(index).dispose).toHaveBeenCalledTimes(1)
        }

        getSelection.mockRestore()
    })
})
