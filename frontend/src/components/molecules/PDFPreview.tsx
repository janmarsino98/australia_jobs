import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border", className)}>
        <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("pdf-preview bg-white border rounded-lg overflow-hidden", className)}>
      {loading && (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      )}
      
      <Document
        file={file || fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        }
        className="flex justify-center"
      >
        <Page 
          pageNumber={1} 
          width={400}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          className="shadow-sm"
        />
      </Document>
      
      {numPages > 1 && !loading && (
        <div className="p-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-500 text-center">
            Showing page 1 of {numPages}
          </p>
        </div>
      )}
    </div>
  );
}; 