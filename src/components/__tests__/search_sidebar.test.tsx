/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { usePdfSearch } from '@/hooks/usePdfSearch'
import { SearchSidebar } from '../search_sidebar'

jest.mock('@/hooks/usePdfSearch', () => ({
    usePdfSearch: jest.fn()
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const search = jest.fn()
const clearSearch = jest.fn()
const jumpToMatch = jest.fn()
const usePdfSearchMock = jest.mocked(usePdfSearch)

describe('SearchSidebar', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        usePdfSearchMock.mockImplementation(() => {
            const [query, setQuery] = React.useState('')
            return {
                query,
                setQuery,
                results: [],
                searching: false,
                search,
                clearSearch,
                jumpToMatch
            }
        })
    })

    it('searches on Enter and reuses the latest query when options change', () => {
        const viewer = { pdfDocument: {} } as unknown as PDFViewer
        render(<SearchSidebar pdfViewer={viewer} />)

        const input = screen.getByRole('textbox', { name: 'viewer:search.placeholder' })
        fireEvent.change(input, { target: { value: 'latest query' } })

        expect(search).not.toHaveBeenCalled()

        fireEvent.keyDown(input, { key: 'Enter' })
        expect(search).toHaveBeenLastCalledWith('latest query', {
            caseSensitive: false,
            entireWord: false
        })

        search.mockClear()
        fireEvent.click(screen.getByRole('checkbox', { name: 'viewer:search.caseSensitive' }))

        expect(search).toHaveBeenCalledTimes(1)
        expect(search).toHaveBeenCalledWith('latest query', {
            caseSensitive: true,
            entireWord: false
        })
    })
})
