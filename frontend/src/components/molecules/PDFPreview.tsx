import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import httpClient from '@/httpClient';
import useAuthStore from '@/stores/useAuthStore';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Configure PDF.js options to reduce warnings
const pdfOptions = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
};

interface PDFPreviewProps {
  fileUrl?: string;
  file?: File;
  className?: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ 
  fileUrl, 
  file, 
  className 
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Fetch PDF when fileUrl is provided and user is authenticated
  useEffect(() => {
    const fetchPDF = async () => {
      if (!fileUrl || !isAuthenticated || file) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await httpClient.get(fileUrl.replace(httpClient.defaults.baseURL || '', ''), {
          responseType: 'blob'
        });
        
        setPdfBlob(response.data);
      } catch (err: any) {
        console.error('Failed to fetch PDF:', err);
        setError('Failed to load PDF preview - authentication required');
        setLoading(false);
      }
    };

    fetchPDF();
  }, [fileUrl, isAuthenticated, file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF preview');
    setLoading(false);
  };

  // Show authentication required message
  if (fileUrl && !isAuthenticated) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border", className)}>
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">Please log in to view PDF preview</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border", className)}>
        <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  // Don't render Document until we have the data we need
  const shouldRender = file || (fileUrl && pdfBlob) || (!fileUrl && !file);
  
  return (
    <div className={cn("pdf-preview bg-white border rounded-lg overflow-hidden", className)}>
      {(loading || !shouldRender) && (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      )}
      
      {shouldRender && (
        <Document
          file={file || pdfBlob}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          }
          className="flex justify-center"
          options={pdfOptions}
        >
          <Page 
            pageNumber={1} 
            width={400}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="shadow-sm"
          />
        </Document>
      )}
      
      {shouldRender && numPages > 1 && !loading && (
        <div className="p-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500 text-center">
            Showing page 1 of {numPages}
          </p>
        </div>
      )}
    </div>
  );
}; 