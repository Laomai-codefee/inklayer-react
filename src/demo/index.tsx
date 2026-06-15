import '@radix-ui/themes/styles.css'
import { Box, Tabs, Theme, Flex } from '@radix-ui/themes';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PdfAnnotatorBasic from './pdf_annotator_basic';
import PdfViewerBasic from './pdf_viewer_basic';
import PdfViewerCustom from './pdf_viewer_custom';
import PdfAnnotatorFull from './pdf_annotator_full';
import PdfAnnotatorCustom from './pdf_annotator_custom';
import PdfViewerWithData from './pdf_viewer_data';


const App = () => {
    const [activeTab, setActiveTab] = React.useState('PdfViewerBasic');
    return (
        <Theme>
            <Tabs.Root defaultValue="PdfViewerBasic" onValueChange={setActiveTab}>
                <Flex align="center" gap="2" ml="3">
                    <img src="/logo.svg" alt="InkLayer" style={{ height: 28 }} />
                    <span style={{ fontSize: 18, fontWeight: 600, marginRight: 12 }}>InkLayer</span>
                    <Tabs.List>
                    <Tabs.Trigger value="PdfViewerBasic">PdfViewer Basic</Tabs.Trigger>
                    <Tabs.Trigger value="PdfViewerData">PdfViewer Width Data</Tabs.Trigger>
                    <Tabs.Trigger value="PdfViewerCustom">PdfViewer Custom</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorBasic">PdfAnnotator Basic</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorCustom">PdfAnnotator Custom</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorFull">PdfAnnotator Full</Tabs.Trigger>
                </Tabs.List>
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
        </Theme>
    );
};

App.displayName = 'App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);