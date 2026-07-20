import React, { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef } from 'react'
import { ZoomTool } from '@/components/zoom_tool'
import { ToolbarButton } from '@/components/toolbar_button'
import {
    annotationDefinitions,
    AnnotationType,
    IAnnotationType,
} from '../../const/definitions'
import { useTranslation } from 'react-i18next'
import { StampTool } from './stamp'
import { SignatureTool } from './signature'
import { usePainter } from '../../context/painter_context'
import { AuthorLabelsIcon, PaletteIcon } from '../../const/icons'
import { useOptionsContext } from '../../context/options_context'
import { useAnnotationStore } from '../../store'
import { Flex, Separator } from '@radix-ui/themes'
import { ColorPicker } from '@/components/color_picker'

interface ToolbarProps {
    defaultAnnotationName: string
    stamps?: string[]
    signatures?: string[]
}

export const Toolbar: React.FC<ToolbarProps> = ({ defaultAnnotationName, stamps, signatures }) => {
    const { t } = useTranslation(['annotator'], { useSuspense: false })
    const { defaultOptions } = useOptionsContext()
    const { painter } = usePainter()

    /**
     * 防止 activate 重复执行（只在类型变化时激活）
     */
    const lastActivatedType = useRef<number | null>(null)

    const safeActivate = useCallback(
        (annotation: IAnnotationType | null, dataTransfer: string | null) => {
            const newType = annotation?.type ?? null
            if (lastActivatedType.current === newType) return
            lastActivatedType.current = newType
            const acceptsDataTransfer = newType !== null && [AnnotationType.SIGNATURE, AnnotationType.STAMP].includes(newType)
            const _dataTransfer = acceptsDataTransfer
                ? dataTransfer
                : null
            painter?.activate(annotation, _dataTransfer)
        },
        [painter]
    )


    /**
     * 默认 annotation
     */
    const defaultAnnotation = useMemo(() => {
        if (!defaultAnnotationName) return null
        return (
            annotationDefinitions.find((item) => item.name === defaultAnnotationName) ||
            null
        )
    }, [defaultAnnotationName])

    /**
     * store 状态
     */
    const currentAnnotationType = useAnnotationStore((s) => s.currentAnnotationType)
    const setCurrentAnnotationType = useAnnotationStore((s) => s.setCurrentAnnotationType)
    const selectedType = currentAnnotationType?.type
    const canCreate = painter?.can('annotation.create') ?? true

    const isColorDisabled = !currentAnnotationType?.styleEditable?.color
    const [authorLabelsVisible, setAuthorLabelsVisible] = useState(false)
    const authorLabelShortcut = useMemo(() => {
        if (typeof navigator === 'undefined') return 'Alt'
        const platform = navigator.platform || navigator.userAgent
        return /mac/i.test(platform) ? '⌘' : 'Alt'
    }, [])

    /**
     * 本地 annotations 列表
     */
    const [annotations, setAnnotations] = useState<IAnnotationType[]>(
        annotationDefinitions.filter(
            (item) => item.webSelectionDependencies === false
        )
    )

    useEffect(() => {
        return () => {
            // 重置激活类型
            lastActivatedType.current = null
            // 重置 store 中的当前注释类型
            setCurrentAnnotationType(null)
            safeActivate(null, null)
        }
    }, [safeActivate, setCurrentAnnotationType])

    /**
     * 初始化 defaultAnnotation
     */
    useEffect(() => {
        if (defaultAnnotation) {
            setCurrentAnnotationType(defaultAnnotation)
            safeActivate(defaultAnnotation, null)
        }
    }, [defaultAnnotation, setCurrentAnnotationType, safeActivate])

    /**
     * 切换 annotation 类型
     */
    const handleAnnotationClick = useCallback(
        (annotation: IAnnotationType | null, dataTransfer: string | null) => {
            setCurrentAnnotationType(annotation)
            safeActivate(annotation, dataTransfer)
        },
        [safeActivate, setCurrentAnnotationType]
    )

    useEffect(() => {
        safeActivate(currentAnnotationType, null)
    }, [currentAnnotationType, safeActivate])

    useLayoutEffect(() => {
        setAuthorLabelsVisible(painter?.areAnnotationAuthorLabelsVisible() ?? false)
    }, [painter])

    const handleAuthorLabelsToggle = useCallback(() => {
        if (!painter) return
        const visible = !painter.areAnnotationAuthorLabelsVisible()
        painter.setAnnotationAuthorLabelsVisible(visible)
        setAuthorLabelsVisible(visible)
    }, [painter])
    /**
     * 颜色修改（不重复 activate）
     */
    const handleColorChange = (color: string) => {
        if (!currentAnnotationType) return

        // 更新当前注释类型颜色
        const updatedAnnotation = {
            ...currentAnnotationType,
            style: { ...currentAnnotationType.style, color }
        }

        // 更新本地 annotations 列表中的对应项
        const updatedAnnotations = annotations.map(annotation =>
            annotation.type === currentAnnotationType.type
                ? { ...annotation, style: { ...annotation.style, color } }
                : annotation
        )

        // 更新状态
        setAnnotations(updatedAnnotations)
        setCurrentAnnotationType(updatedAnnotation)

        // 激活 painter 以确保颜色更新到 painter 中
        painter?.activate(updatedAnnotation, null)
    }

    /**
     * 生成按钮
     */
    const buttons = annotations.map((annotation, index) => {
        const isSelected = annotation.type === selectedType

        switch (annotation.type) {
            case AnnotationType.STAMP:
                return (
                    <StampTool
                        disabled={!canCreate}
                        default_stamps={stamps}
                        key={index}
                        annotation={annotation}
                        onAdd={(dataUrl) => handleAnnotationClick(annotation, dataUrl)}
                    />
                )

            case AnnotationType.SIGNATURE:
                return (
                    <SignatureTool
                        disabled={!canCreate}
                        default_signatures={signatures}
                        key={index}
                        annotation={annotation}
                        onAdd={(dataUrl) => handleAnnotationClick(annotation, dataUrl)}
                    />
                )

            default:
                return (
                    <ToolbarButton
                        disabled={annotation.type !== AnnotationType.SELECT && !canCreate}
                        selected={isSelected}
                        key={index}
                        title={t(`annotator:tool.${annotation.name}`)}
                        icon={annotation.icon}
                        onClick={() =>
                            handleAnnotationClick(isSelected ? null : annotation, null)
                        }
                    />
                )
        }
    })

    return (
        <Flex gap="3" align="center">
            <ZoomTool />
            <Separator orientation="vertical" />
            {buttons}
            <Separator orientation="vertical" />
            <ColorPicker
                value={currentAnnotationType?.style?.color || defaultOptions!.colors![0]}
                onChange={handleColorChange}
                presets={defaultOptions.colors!}
                popover={true}
                trigger={<ToolbarButton
                    disabled={isColorDisabled || !canCreate}
                    icon={
                        <PaletteIcon
                            style={{ '--palette-preview-color': currentAnnotationType?.style?.color } as React.CSSProperties}
                        />
                    }
                />}
            />
            <Separator orientation="vertical" />
            <ToolbarButton
                disabled={!painter}
                selected={authorLabelsVisible}
                title={
                    authorLabelsVisible
                        ? t('annotator:authorLabels.hide')
                        : t('annotator:authorLabels.show', { shortcut: authorLabelShortcut })
                }
                icon={<AuthorLabelsIcon />}
                onClick={handleAuthorLabelsToggle}
            />
        </Flex>
    )
}
