/**
 * UploadTab Component
 * Educational Note: Handles file uploads via drag-and-drop or file picker.
 * Manages its own drag state while upload logic is handled by parent.
 */

import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { UploadSimple, FolderOpen, CircleNotch } from '@phosphor-icons/react';

interface UploadTabProps {
  onUpload: (files: FileList | File[]) => Promise<void>;
  uploading: boolean;
  isAtLimit: boolean;
}

/**
 * Accepted file types for the file input
 * Educational Note: This matches the backend's allowed extensions
 */
const ACCEPTED_FILE_TYPES =
  '.pdf,.txt,.md,.mp3,.avif,.bmp,.gif,.ico,.jp2,.png,.webp,.tif,.tiff,.heic,.heif,.jpeg,.jpg,.jpe,.csv';

export const UploadTab: React.FC<UploadTabProps> = ({
  onUpload,
  uploading,
  isAtLimit,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle drag events for the drop zone
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle file drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept={ACCEPTED_FILE_TYPES}
      />

      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <>
            <CircleNotch size={40} className="mx-auto mb-4 text-primary animate-spin" />
            <p className="text-sm font-medium mb-1">Uploading...</p>
          </>
        ) : (
          <>
            <UploadSimple size={40} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Upload sources</p>
            <p className="text-xs text-muted-foreground mb-4">
              Drag & drop or choose files to upload
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAtLimit}
            >
              Choose Files
            </Button>
          </>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Supported: PDF, TXT, Markdown, Audio (MP3), Images (PNG, JPG, etc.),
          CSV
        </p>
      </div>

      <Separator className="my-6" />

      {/* Google Drive Integration (Coming Soon) */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          disabled
          title="Coming soon"
        >
          <FolderOpen size={16} />
          Google Drive (Coming soon)
        </Button>
      </div>
    </>
  );
};
