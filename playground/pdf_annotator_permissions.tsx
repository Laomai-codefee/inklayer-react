import React, { useState } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'
import type { AnnotationPermissions } from '@/extensions/annotator/types/annotator'
import type { User } from '@/types'

const USERS: User[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'admin', name: 'Admin' }
]

const OWNER_ONLY_PERMISSIONS: AnnotationPermissions = {
    mode: 'owner-only',
    can: ({ currentUser }) => currentUser?.id === 'admin' ? true : undefined
}

const READ_ONLY_PERMISSIONS: AnnotationPermissions = {
    can: () => false
}

const INITIAL_ANNOTATIONS: Annotation[] = [
    {
        id: 'collaboration-alice',
        kind: 'shape',
        target: {
            pageIndex: 0,
            geometry: { type: 'rect', rect: { x: 110, y: 70, width: 220, height: 90 } },
            coordinateSystem: 'pdf-user-space'
        },
        payload: { kind: 'shape', shape: 'rect' },
        appearance: { strokeColor: '#da3324', fillColor: 'rgba(218, 51, 36, 0.3)', opacity: 1 },
        relations: {},
        meta: {
            createdAt: "D:20260718090000+08'00'",
            updatedAt: "D:20260718090000+08'00'",
            authorId: USERS[0],
            isNative: false,
            source: 'inklayer'
        },
        extensions: {
            konva: {
                serialized: JSON.stringify({
                    attrs: { name: 'InkLayer_Annotator_shape_group', id: 'collaboration-alice' },
                    className: 'Group',
                    children: [{
                        attrs: {
                            x: 110,
                            y: 70,
                            width: 220,
                            height: 90,
                            strokeScaleEnabled: false,
                            stroke: '#da3324'
                        },
                        className: 'Rect'
                    }]
                }),
                clientRect: { x: 110, y: 70, width: 220, height: 90 }
            },
            pdfjs: { type: 'SQUARE', subtype: 'Square' },
            legacy: {
                title: 'Alice',
                contentsObj: { text: 'Alice owns this annotation.' },
                comments: [{
                    id: 'alice-comment',
                    title: 'Alice',
                    date: "D:20260718090100+08'00'",
                    content: 'Bob may reply, but cannot edit this comment.',
                    user: USERS[0]
                }]
            }
        }
    }
]

const PdfAnnotatorPermissions: React.FC = () => {
    const [user, setUser] = useState(USERS[1])
    const [permissionPreset, setPermissionPreset] = useState<'owner-only' | 'read-only'>('owner-only')
    const [lastEvent, setLastEvent] = useState('Waiting for PDF')
    const permissions = permissionPreset === 'read-only' ? READ_ONLY_PERMISSIONS : OWNER_ONLY_PERMISSIONS

    return (
        <div style={{ display: 'grid', height: '100%', gridTemplateRows: 'auto minmax(0, 1fr)' }}>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderTop: '1px solid var(--gray-5)',
                    borderBottom: '1px solid var(--gray-5)'
                }}
            >
                <strong>Current user: <span data-testid="current-user">{user.name}</span></strong>
                {USERS.map(option => (
                    <button
                        key={option.id}
                        data-testid={`switch-${option.id}`}
                        aria-pressed={option.id === user.id}
                        onClick={() => setUser(option)}
                    >
                        {option.name}
                    </button>
                ))}
                <strong style={{ marginLeft: 12 }}>
                    Permission: <span data-testid="current-permission">{permissionPreset === 'read-only' ? 'Read only' : 'Owner only'}</span>
                </strong>
                <button
                    data-testid="permission-owner-only"
                    aria-pressed={permissionPreset === 'owner-only'}
                    onClick={() => setPermissionPreset('owner-only')}
                >
                    Owner only
                </button>
                <button
                    data-testid="permission-read-only"
                    aria-pressed={permissionPreset === 'read-only'}
                    onClick={() => setPermissionPreset('read-only')}
                >
                    Read only
                </button>
                <span style={{ marginLeft: 'auto' }} data-testid="permission-event">{lastEvent}</span>
            </div>
            <PdfAnnotator
                title={<strong>COLLABORATION PERMISSIONS</strong>}
                url="https://inklayer.dev/inklayer-demo.pdf"
                user={user}
                annotationPermissions={permissions}
                initialAnnotations={INITIAL_ANNOTATIONS}
                defaultShowAnnotationAuthorLabels
                defaultShowAnnotationsSidebar
                locale="en-US"
                layoutStyle={{ height: '100%' }}
                onLoad={() => setLastEvent('PDF loaded')}
                onAnnotationAdded={(annotation) => setLastEvent(`Added ${annotation.id}`)}
                onAnnotationUpdated={(annotation) => setLastEvent(`Updated ${annotation.id}`)}
                onAnnotationDeleted={(id) => setLastEvent(`Deleted ${id}`)}
            />
        </div>
    )
}

export default PdfAnnotatorPermissions
