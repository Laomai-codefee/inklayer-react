import React from 'react'
import { Tooltip } from '@radix-ui/themes'

import {
    annotationDefinitions,
    type AnnotationType
} from '../../const/definitions'

const annotationIcons = new Map(
    annotationDefinitions.map((annotation) => [annotation.type, annotation.icon])
)

interface AnnotationTypeIconProps {
    type: AnnotationType
    label: string
    className?: string
    decorative?: boolean
    showTooltip?: boolean
}

export const AnnotationTypeIcon: React.FC<AnnotationTypeIconProps> = ({
    type,
    label,
    className,
    decorative = false,
    showTooltip = true
}) => {
    const icon = annotationIcons.get(type)
    if (!icon) return null

    const content = (
        <span
            className={className}
            role={decorative ? undefined : 'img'}
            aria-hidden={decorative || undefined}
            aria-label={decorative ? undefined : label}
        >
            {icon}
        </span>
    )

    return showTooltip ? <Tooltip content={label}>{content}</Tooltip> : content
}
