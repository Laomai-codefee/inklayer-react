import React from 'react';
import { PdfViewer } from '@/features/viewer';
const PdfViewerBasic: React.FC = () => {
    const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf';
    return (
        <PdfViewer
            title="PDF VIEWER"
            url={pdfUrl}
            appearance="light"
            enableRange={false}
            locale="en-US"
            layoutStyle={{ width: '100%', height: 'calc(100vh - 45px)' }}
        />
    );
}
export default PdfViewerBasic;
