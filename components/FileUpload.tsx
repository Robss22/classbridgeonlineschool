import React, { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UploadCloud } from "lucide-react";

interface FileUploadProps {
  bucket: string; // Supabase Storage bucket name
  folder?: string; // Optional folder path inside bucket
  onUpload: (url: string) => void; // Callback with public URL
  label?: string;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  folder = "",
  onUpload,
  label = "Upload File",
  accept = "*/*",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    setFileName(file.name);
    setUploaded(false);
    // Simulate progress
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev === null) return 0;
        // Cap at 95% until upload is done
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 4 + 2); // increment 2-5%
      });
    }, 300);
    try {
      const filePath = `${folder ? folder + "/" : ""}${Date.now()}_${file.name}`;
      // Supabase JS does not support progress natively, so we just show uploading state
      const { error } = await supabase.storage.from(bucket).upload(filePath, file);
      if (error) throw error;
      // Get public URL
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;
      onUpload(publicUrl);
      setUploaded(true);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setUploaded(false);
    } finally {
      setUploading(false);
      setProgress(100);
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const handleButtonClick = () => {
    if (!uploading && inputRef.current) {
      inputRef.current.click();
    }
  };

  // Helper to get color based on progress
  const getBarColor = (progress: number | null) => {
    if (progress === null) return 'bg-gray-200';
    if (progress < 50) return 'bg-blue-500';
    if (progress < 80) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={!!uploading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <UploadCloud className="w-5 h-5" />
        {uploading ? "Uploading..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={!!uploading}
      />
      {/* File name and upload status */}
      {fileName && (
        <div className="flex items-center gap-2 text-sm w-full">
          <span className="truncate max-w-xs" title={fileName}>{fileName}</span>
          {uploading && (
            <span className="flex-1 min-w-[100px] max-w-[200px] h-2 bg-gray-200 rounded overflow-hidden">
              <span
                className={`block h-full transition-all duration-200 ${getBarColor(progress)}`}
                style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
              ></span>
            </span>
            )}
          {uploading && (
            <span className="ml-2 text-xs text-gray-500">{Math.min(progress ?? 0, 100)}%</span>
          )}
          {!uploading && uploaded && (
            <span className="text-green-600 font-bold ml-2">&#10003; Uploaded</span>
          )}
        </div>
      )}
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
};

export default FileUpload; 