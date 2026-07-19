import React, { useState, useEffect } from 'react';
import { PdfViewer } from '@/features/viewer';

const PdfViewerWithData: React.FC = () => {
    const [pdfData, setPdfData] = useState<ArrayBuffer | Uint8Array | null>(null);
    const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf';

    useEffect(() => {
        const fetchPdfAsData = async () => {
            try {
                const response = await fetch(pdfUrl);
                const arrayBuffer = await response.arrayBuffer();
                setPdfData(arrayBuffer);
                console.log('PDF data:', arrayBuffer);
            } catch (error) {
                console.error('Failed to fetch PDF:', error);
            }
        };

        fetchPdfAsData();
    }, []);

    if (!pdfData) {
        return <div>Loading PDF...</div>;
    }

    return (
        <PdfViewer
            title="PDF VIEWER WITH DATA"
            data={pdfData}
            appearance="light"
            enableRange={false}
            locale="en-US"
            layoutStyle={{ width: '100%', height: 'calc(100vh - 45px)' }}
        />
    );
}

export default PdfViewerWithData;
