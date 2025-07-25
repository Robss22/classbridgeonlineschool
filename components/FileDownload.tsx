import React from "react";
import { Download } from "lucide-react";

interface FileDownloadProps {
  fileUrl: string;
  label?: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({ fileUrl, label = "Download Attachment" }) => {
  if (!fileUrl) return null;
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
      download
    >
      <Download className="w-4 h-4" />
      {label}
    </a>
  );
};

export default FileDownload; 