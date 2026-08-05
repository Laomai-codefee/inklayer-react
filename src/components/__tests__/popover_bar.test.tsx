/** @jest-environment jsdom */

import React, { createRef } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'

import { PopoverBar, type PopoverBarRef } from '../popover_bar'

const mockComputePosition = jest.fn()

jest.mock('@floating-ui/dom', () => ({
    computePosition: (...args: unknown[]) => mockComputePosition(...args),
    flip: jest.fn(() => ({ name: 'flip' }))
}))

describe('PopoverBar positioning', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockComputePosition.mockResolvedValue({ x: 120, y: 80 })
    })

    it('positions itself when dynamic buttons appear after the anchor was opened', async () => {
        const ref = createRef<PopoverBarRef>()
        const renderBar = (showButton: boolean) => (
            <Theme>
                <PopoverBar
                    ref={ref}
                    renderButtons={() => showButton
                        ? [{ key: 'edit', icon: 'Edit', onClick: jest.fn() }]
                        : []}
                />
            </Theme>
        )
        const view = render(renderBar(false))
        const rect = {
            x: 20,
            y: 30,
            width: 40,
            height: 50,
            top: 30,
            right: 60,
            bottom: 80,
            left: 20,
            toJSON: () => ({})
        } as DOMRect

        act(() => ref.current?.openWithRect(rect))
        expect(mockComputePosition).not.toHaveBeenCalled()

        view.rerender(renderBar(true))

        await waitFor(() => expect(mockComputePosition).toHaveBeenCalledWith(
            expect.objectContaining({ getBoundingClientRect: expect.any(Function) }),
            expect.any(HTMLElement),
            expect.any(Object)
        ))
        await waitFor(() => {
            const popover = view.getByText('Edit').closest('div[style]') as HTMLDivElement
            expect(popover.style.left).toBe('120px')
            expect(popover.style.top).toBe('80px')
        })
    })
})
