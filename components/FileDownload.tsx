'use client';

import { useState } from 'react';
import { Download, Eye, FileText, AlertCircle } from 'lucide-react';

interface FileDownloadProps {
  fileUrl: string | null;
  fileName?: string;
  className?: string;
}

export default function FileDownload({ fileUrl, fileName, className = '' }: FileDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!fileUrl) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">No file attached</span>
      </div>
    );
  }

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'assessment-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed. Please try again.');
      console.error('Download error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const getFileIcon = () => {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getFileIcon()}
      
      <div className="flex items-center gap-1">
        <button
          onClick={handleView}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
          title="View file"
        >
          <Eye className="h-3 w-3" />
          View
        </button>
        
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
          title="Download file"
        >
          <Download className="h-3 w-3" />
          {isLoading ? '...' : 'Download'}
        </button>
      </div>
      
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
} 