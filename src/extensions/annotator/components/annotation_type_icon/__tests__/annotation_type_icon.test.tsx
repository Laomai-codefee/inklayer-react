/** @jest-environment jsdom */

import React from 'react'
import { render, screen } from '@testing-library/react'

import { AnnotationType } from '../../../const/definitions'
import { AnnotationTypeIcon } from '..'

jest.mock('@radix-ui/themes', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('AnnotationTypeIcon', () => {
    it('renders the icon associated with the InkLayer annotation type', () => {
        render(<AnnotationTypeIcon type={AnnotationType.ARROW} label="Arrow" />)

        const icon = screen.getByRole('img', { name: 'Arrow' })
        expect(icon.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 1024 1024')
    })
})
