import '@radix-ui/themes/styles.css'
import { Box, Tabs, Theme, Flex, Button } from '@radix-ui/themes';
import React, { useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import PdfAnnotatorBasic from './pdf_annotator_basic';
import PdfViewerBasic from './pdf_viewer_basic';
import PdfViewerCustom from './pdf_viewer_custom';
import PdfAnnotatorFull from './pdf_annotator_full';
import PdfAnnotatorCustom from './pdf_annotator_custom';
import PdfViewerWithData from './pdf_viewer_data';
import ShowCode, { ShowCodeHandle } from './components/ShowCode';
import { snippets } from './snippets';


const GithubStar: React.FC = () => (
    <a href="https://github.com/Laomai-codefee/inklayer-react" target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center' }}>
        <img
            src="https://img.shields.io/github/stars/Laomai-codefee/inklayer-react?style=social"
            alt="GitHub stars"
            style={{ height: 20, marginRight: 10 }}
        />
    </a>
);

const App = () => {
    const [activeTab, setActiveTab] = React.useState('PdfViewerBasic');
    const showCodeRef = useRef<ShowCodeHandle>(null);

    const currentDemo = useMemo(() => `${activeTab}.tsx`, [activeTab]);
    const currentCode = useMemo(() => snippets[activeTab] || '', [activeTab]);

    return (
        <Theme>
            <Tabs.Root defaultValue="PdfViewerBasic" onValueChange={setActiveTab}>
                <Flex align="center" gap="2" ml="3">
                    <img src="https://laomai-codefee.github.io/inklayer-react/logo.svg" alt="InkLayer" style={{ height: 20 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, marginRight: 12 }}>InkLayer React</span>
                    <Tabs.List>
                    <Tabs.Trigger value="PdfViewerBasic">PdfViewer Basic</Tabs.Trigger>
                    <Tabs.Trigger value="PdfViewerData">PdfViewer Width Data</Tabs.Trigger>
                    <Tabs.Trigger value="PdfViewerCustom">PdfViewer Custom</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorBasic">PdfAnnotator Basic</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorCustom">PdfAnnotator Custom</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorFull">PdfAnnotator Full</Tabs.Trigger>
                </Tabs.List>
                    <div style={{ flex: 1 }} />
                    <Button
                        onClick={() => showCodeRef.current?.open()}
                    >
                        &lt;/&gt; Show Code
                    </Button>
                    <GithubStar />
                    
                </Flex>
            </Tabs.Root>
            <Box pt="0">
    {activeTab === 'PdfViewerBasic' && <PdfViewerBasic />}
    {activeTab === 'PdfViewerData' && <PdfViewerWithData />}
    {activeTab === 'PdfViewerCustom' && <PdfViewerCustom />}
    {activeTab === 'PdfAnnotatorBasic' && <PdfAnnotatorBasic />}
    {activeTab === 'PdfAnnotatorCustom' && <PdfAnnotatorCustom />}
    {activeTab === 'PdfAnnotatorFull' && <PdfAnnotatorFull />}
</Box>
            <ShowCode ref={showCodeRef} filename={currentDemo} code={currentCode} />
        </Theme>
    );
};

App.displayName = 'App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);