export const snippets: Record<string, string> = {
  PdfAnnotatorPermissions: `const permissions = {
  mode: 'owner-only',
  can: ({ currentUser }) => currentUser?.id === 'admin' ? true : undefined
}

<PdfAnnotator
  user={currentUser}
  annotationPermissions={permissions}
  initialAnnotations={annotations}
/>`,
  PdfViewerBasic: `import React from 'react'
import { PdfViewer } from 'inklayer-react'
import 'inklayer-react/style'

const Demo = () => {
  return (
    <PdfViewer
      title="PDF VIEWER"
      url="https://inklayer.dev/inklayer-demo.pdf"
      appearance="light"
      locale="en-US"
      layoutStyle={{ width: '100vw', height: '96vh' }}
    />
  )
}

export default Demo`,

  PdfViewerData: `import React, { useState, useEffect } from 'react'
import { PdfViewer } from 'inklayer-react'
import 'inklayer-react/style'

const Demo = () => {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)

  useEffect(() => {
    fetch('https://inklayer.dev/inklayer-demo.pdf')
      .then(res => res.arrayBuffer())
      .then(setPdfData)
  }, [])

  if (!pdfData) return <div>Loading...</div>

  return (
    <PdfViewer
      title="PDF VIEWER WITH DATA"
      data={pdfData}
      appearance="light"
      locale="en-US"
      layoutStyle={{ width: '100vw', height: '96vh' }}
    />
  )
}

export default Demo`,

  PdfViewerCustom: `import React from 'react'
import { PdfViewer } from 'inklayer-react'
import { BsLayoutTextSidebar } from 'react-icons/bs'
import 'inklayer-react/style'

const Demo = () => {
  return (
    <PdfViewer
      title="PDF VIEWER CUSTOM"
      url="https://inklayer.dev/inklayer-demo.pdf"
      locale="en-US"
      appearance="light"
      showTextLayer={false}
      showAnnotations={true}
      defaultActiveSidebarKey="sidebar-1"

      actions={(ctx) => (
        <>
          <button onClick={() => console.log(ctx.pdfViewer)}>Get PDF Viewer</button>
          <button onClick={ctx.toggleSidebar}>Toggle Sidebar</button>
          <button onClick={() => ctx.print()}>Print</button>
          <button onClick={() => ctx.download('file')}>Download</button>
        </>
      )}

      toolbar={(ctx) => (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => ctx.pdfViewer?.scrollPageIntoView({ pageNumber: 1 })}>
            Page 1
          </button>
          <button onClick={() => ctx.print()}>Print</button>
        </div>
      )}

      sidebar={[{
        key: 'sidebar-1',
        title: 'Sidebar 1',
        icon: <BsLayoutTextSidebar />,
        render: (ctx) => (
          <div>
            <h3>Sidebar Content</h3>
            <button onClick={ctx.toggleSidebar}>Close</button>
          </div>
        )
      }]}

      onEventBusReady={(eventBus) => {
        eventBus?.on('pagerendered', (e) => console.log('Page:', e.pageNumber))
      }}

      onDocumentLoaded={(pdf) => console.log('Document loaded:', pdf)}

      layoutStyle={{ width: '100vw', height: '96vh' }}
    />
  )
}

export default Demo`,

  PdfAnnotatorBasic: `import React, { useCallback } from 'react'
import { PdfAnnotator } from 'inklayer-react'
import type { Annotation } from 'inklayer-react'
import 'inklayer-react/style'

const Demo = () => {
  const onSave = useCallback((annotations: Annotation[]) => {
    console.log('Saved:', annotations)
  }, [])

  return (
    <PdfAnnotator
      title="PDF ANNOTATOR"
      url="https://inklayer.dev/inklayer-demo.pdf"
      appearance="light"
      locale="en-US"
      user={{ id: 'u1', name: 'Alice' }}
      layoutStyle={{ height: '96vh' }}
      onSave={onSave}
      onLoad={() => console.log('PDF Loaded')}
      onAnnotationAdded={(a) => console.log('Added:', a)}
      onAnnotationDeleted={(id) => console.log('Deleted:', id)}
      onAnnotationUpdated={(a) => console.log('Updated:', a.id)}
    />
  )
}

export default Demo`,

  PdfAnnotatorCustom: `import React, { useCallback } from 'react'
import { PdfAnnotator } from 'inklayer-react'
import type { Annotation } from 'inklayer-react'
import 'inklayer-react/style'

import qiantubifengshouxietiFont from './fonts/qiantubifengshouxieti.ttf'

const INITIAL_STORES: Annotation[] = [
    {
        "id": "BzGHwy94HKi2Okm7ViT4a",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 114.21988950276352,
                    "y": 36.83954058623022,
                    "width": 407.7093922651926,
                    "height": 45.67810206565918
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "rect"
        },
        "appearance": {
            "strokeColor": "#da3324",
            "fillColor": "rgba(218, 51, 36, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20251208201803+08'00'",
            "updatedAt": "D:20251208201803+08'00'",
                "authorId": {
                    "id": "9528",
                    "name": "InkLayer"
                },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"BzGHwy94HKi2Okm7ViT4a\",\"draggable\":true,\"x\":-740.6292037573312,\"y\":13.564867326616417,\"scaleX\":3.943030872970916,\"scaleY\":0.6223174668345937},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":217.80000000000004,\"y\":38.400000000000006,\"width\":101.4,\"height\":71.4,\"strokeScaleEnabled\":false,\"stroke\":\"#da3324\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 114.21988950276352,
                    "y": 36.83954058623022,
                    "width": 407.7093922651926,
                    "height": 45.67810206565918
                }
            },
            "pdfjs": {
                "type": "SQUARE",
                "subtype": "Square"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": ""
                },
                "comments": [
                    {
                        "id": "yC7Jee40rC8KbgcphjwCN",
                        "title": "InkLayer",
                        "date": "D:20251217153543+08'00'",
                        "content": "Reply"
                    }
                ]
            }
        }
    },
    {
        "id": "PBo08272eddFxgo0-Us2g",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 68.296875,
                            "y": 148.20000000000002
                        },
                        "p2": {
                            "x": 516.73125,
                            "y": 148.20000000000002
                        },
                        "p3": {
                            "x": 68.296875,
                            "y": 177.253125
                        },
                        "p4": {
                            "x": 516.73125,
                            "y": 177.253125
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "highlight",
            "color": "#b4fa56"
        },
        "appearance": {
            "strokeColor": "#b4fa56",
            "fillColor": "rgba(180, 250, 86, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260611165820+08'00'",
            "updatedAt": "D:20260611165820+08'00'",
                "authorId": {
                    "id": "9527",
                    "name": "InkLayer"
                },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"PBo08272eddFxgo0-Us2g\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":93.50625000000001,\"y\":148.20000000000002,\"width\":423.225,\"height\":15.000000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":68.296875,\"y\":161.18437500000002,\"width\":143.4,\"height\":15.000000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":214.50000000000003,\"y\":162.253125,\"width\":63.139233398437504,\"height\":15.000000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 68.296875,
                    "y": 148.20000000000002,
                    "width": 448.43437500000005,
                    "height": 29.053124999999994
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "Mohammad R. Haghighat$, Blake ...n∗, Edwin Smith#, Rick Reitmai"
                },
                "comments": []
            }
        }
    }
]

const PdfAnnotatorCustom: React.FC = () => {
    const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <div>
            <PdfAnnotator
                theme="violet"
                enableRange={false}
                title={<strong>PDF ANNOTATOR CUSTOM</strong>}
                url={pdfUrl}
                defaultShowAnnotationsSidebar={true}
                user={{ id: '9527', name: 'InkLayer' }}
                enableNativeAnnotations={false}
                initialAnnotations={INITIAL_STORES}
                defaultOptions={{
                    signature: {
                        defaultSignature: [],
                        defaultFont: [
                            { label: '楷体', value: 'STKaiti', external: false },
                            { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: true, url: qiantubifengshouxietiFont },
                        ]
                    },
                    stamp: { defaultStamp: [] }
                }}
                actions={(props) => (
                    <>
                        <button onClick={() => props.save()}>💾 Save</button>
                        <button onClick={() => console.log('Core:', props.getAnnotations())}>📦 Log Data</button>
                        <button onClick={() => props.exportToExcel('Export Excel')}>📊 Excel</button>
                        <button onClick={() => props.exportToPdf('Export PDF')}>📄 PDF</button>
                    </>
                )}
                layoutStyle={{ height: '96vh' }}
                locale="en-US"
                onSave={onSave}
                onLoad={() => console.log('🎉 PDF Loaded')}
                onAnnotationAdded={(a) => console.log('➕', a.id, a.kind)}
                onAnnotationDeleted={(id) => console.log('➖', id)}
                onAnnotationUpdated={(a) => console.log('✏️', a.id)}
                onAnnotationSelected={(a, isClick) => console.log('👉', a?.id, isClick)}
            />
        </div>
    )
}

export default PdfAnnotatorCustom`,

  PdfAnnotatorFull: `import React, { useCallback } from 'react'
import { PdfAnnotator } from 'inklayer-react'
import type { Annotation } from 'inklayer-react'
import 'inklayer-react/style'
import qiantubifengshouxietiFont from './fonts/qiantubifengshouxieti.ttf'


const PdfAnnotatorFull: React.FC = () => {
    const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <div>
            <PdfAnnotator
                theme="violet"
                enableRange={true}
                title={<strong>PDF ANNOTATOR FULL</strong>}
                url={pdfUrl}
                defaultShowAnnotationsSidebar={true}
                user={{ id: '9527', name: 'InkLayer' }}
                appearance='dark'
                enableNativeAnnotations={true}
                locale="en-US"
                initialAnnotations={[]}
                defaultOptions={{
                    signature: {
                        defaultSignature: [
                            'data:image/png;base64,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',
                        ],
                        defaultFont: [
                            { label: '楷体', value: 'STKaiti', external: false },
                            { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: true, url: qiantubifengshouxietiFont },
                            { label: '平方长安体', value: 'PingFangChangAnTi-2', external: true, url: 'http://localhost:8080/PingFangChangAnTi-2.ttf' },
                        ]
                    },
                    stamp: { defaultStamp: ['data:image/png;base64,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'] }
                }}
                actions={(props) => (
                    <>
                        <button onClick={() => props.save()}>💾 Save (InkLayer)</button>
                        <button onClick={() => console.log('Core:', props.getAnnotations())}>📦 Get Annotations</button>
                        <button onClick={() => props.exportToExcel('Export Excel')}>📊 Export Excel</button>
                        <button onClick={() => props.exportToPdf('Export PDF')}>📄 Export PDF</button>
                    </>
                )}
                layoutStyle={{ height: '96vh' }}
                onSave={onSave}
                onLoad={() => console.log('🎉 PDF Loaded...')}
                onAnnotationAdded={(a) => console.log('➕', a.id, a.kind)}
                onAnnotationDeleted={(id) => console.log('➖', id)}
                onAnnotationUpdated={(a) => console.log('✏️', a.id)}
                onAnnotationSelected={(a, isClick) => console.log('👉', a?.id, isClick)}
            />
        </div>
    )
}

export default PdfAnnotatorFull
`,
}
