import '@radix-ui/themes/styles.css'
import './playground.css'
import { Button, Tabs, Theme } from '@radix-ui/themes'
import React, { useMemo, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import PdfAnnotatorBasic from './pdf_annotator_basic'
import PdfViewerBasic from './pdf_viewer_basic'
import PdfViewerCustom from './pdf_viewer_custom'
import PdfAnnotatorFull from './pdf_annotator_full'
import PdfAnnotatorCustom from './pdf_annotator_custom'
import PdfAnnotatorPermissions from './pdf_annotator_permissions'
import PdfViewerWithData from './pdf_viewer_data'
import ShowCode, { ShowCodeHandle } from './components/ShowCode'
import { snippets } from './snippets'

const DEMOS = [
    { value: 'PdfAnnotatorBasic', label: 'PdfAnnotator Basic' },
    { value: 'PdfAnnotatorCustom', label: 'PdfAnnotator Custom' },
    { value: 'PdfAnnotatorFull', label: 'PdfAnnotator Full' },
    { value: 'PdfAnnotatorPermissions', label: 'Collaboration Permissions' },
    { value: 'PdfViewerBasic', label: 'PdfViewer Basic' },
    { value: 'PdfViewerData', label: 'PdfViewer Data' },
    { value: 'PdfViewerCustom', label: 'PdfViewer Custom' },
] as const

const GithubStar: React.FC = () => (
    <a
        href="https://github.com/Laomai-codefee/inklayer-react"
        target="_blank"
        rel="noopener noreferrer"
        className="playground-github"
    >
        <img
            src="https://img.shields.io/github/stars/Laomai-codefee/inklayer-react?style=social"
            alt="GitHub stars"
        />
    </a>
)

const App = () => {
    const [activeTab, setActiveTab] = React.useState('PdfAnnotatorBasic')
    const headless = window.location.hash === '#headless'
    const showCodeRef = useRef<ShowCodeHandle>(null)

    const currentDemo = useMemo(() => `${activeTab}.tsx`, [activeTab])
    const currentCode = useMemo(() => snippets[activeTab] || '', [activeTab])

    return (
        <Theme className="playground-theme">
            {!headless && (
                <header className="playground-header">
                    <div className="playground-brand">
                        <img src="logo.svg" alt="InkLayer" />
                        <span>InkLayer React Demo</span>
                    </div>
                    <div className="playground-header-actions">
                        <Button size="1" variant="soft" onClick={() => showCodeRef.current?.open()}>
                            &lt;/&gt; Show Code
                        </Button>
                        <GithubStar />
                    </div>
                </header>
            )}

            <Tabs.Root
                className="playground-tabs"
                value={activeTab}
                orientation="vertical"
                onValueChange={setActiveTab}
            >
                {!headless && (
                    <aside className="playground-sidebar" aria-label="Playground examples">
                        <Tabs.List className="playground-nav">
                            {DEMOS.map((demo) => (
                                <Tabs.Trigger key={demo.value} value={demo.value}>
                                    {demo.label}
                                </Tabs.Trigger>
                            ))}
                        </Tabs.List>
                    </aside>
                )}

                <main className="playground-main">
                    {activeTab === 'PdfViewerBasic' && <PdfViewerBasic />}
                    {activeTab === 'PdfViewerData' && <PdfViewerWithData />}
                    {activeTab === 'PdfViewerCustom' && <PdfViewerCustom />}
                    {activeTab === 'PdfAnnotatorBasic' && <PdfAnnotatorBasic />}
                    {activeTab === 'PdfAnnotatorCustom' && <PdfAnnotatorCustom />}
                    {activeTab === 'PdfAnnotatorFull' && <PdfAnnotatorFull />}
                    {activeTab === 'PdfAnnotatorPermissions' && <PdfAnnotatorPermissions />}
                </main>
            </Tabs.Root>

            <ShowCode ref={showCodeRef} filename={currentDemo} code={currentCode} />
        </Theme>
    )
}

App.displayName = 'App'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
