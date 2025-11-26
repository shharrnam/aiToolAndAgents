/**
 * SourcesPanel Component
 * Educational Note: Main orchestrator for project sources management.
 * Manages state and API calls, delegates rendering to child components.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  sourcesAPI,
  MAX_SOURCES,
  type Source,
} from '../../lib/api/sources';
import { useToast, ToastContainer } from '../ui/toast';
import { SourcesHeader } from './SourcesHeader';
import { SourcesList } from './SourcesList';
import { SourcesFooter } from './SourcesFooter';
import { AddSourcesSheet } from './AddSourcesSheet';

interface SourcesPanelProps {
  projectId: string;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ projectId }) => {
  const { toasts, dismissToast, success, error } = useToast();

  // State
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  /**
   * Ref for error function to avoid infinite loop in useCallback
   * Educational Note: Toast functions are recreated each render, causing
   * useCallback to recreate loadSources, triggering useEffect infinitely.
   * Using a ref ensures we always have the latest function without re-renders.
   */
  const errorRef = useRef(error);
  errorRef.current = error;

  /**
   * Load sources from API
   */
  const loadSources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sourcesAPI.listSources(projectId);
      setSources(data);
    } catch (err) {
      console.error('Error loading sources:', err);
      errorRef.current('Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load sources on mount and when projectId changes
  useEffect(() => {
    loadSources();
  }, [loadSources]);

  /**
   * Handle file upload
   */
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Check source limit
    if (sources.length + fileArray.length > MAX_SOURCES) {
      error(`Cannot upload. Maximum ${MAX_SOURCES} sources allowed.`);
      return;
    }

    setUploading(true);

    try {
      for (const file of fileArray) {
        await sourcesAPI.uploadSource(projectId, file);
      }
      success(`Uploaded ${fileArray.length} file(s) successfully`);
      await loadSources();
      setSheetOpen(false);
    } catch (err: unknown) {
      console.error('Error uploading files:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      // Check if it's an axios error with response data
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        error(axiosErr.response?.data?.error || errorMessage);
      } else {
        error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle adding URL source
   */
  const handleAddUrl = async (url: string) => {
    // Check source limit
    if (sources.length >= MAX_SOURCES) {
      error(`Cannot add. Maximum ${MAX_SOURCES} sources allowed.`);
      return;
    }

    try {
      await sourcesAPI.addUrlSource(projectId, url);
      success('URL source added successfully');
      await loadSources();
      setSheetOpen(false);
    } catch (err: unknown) {
      console.error('Error adding URL source:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add URL';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        error(axiosErr.response?.data?.error || errorMessage);
      } else {
        error(errorMessage);
      }
    }
  };

  /**
   * Handle adding text source
   */
  const handleAddText = async (content: string, name: string) => {
    // Check source limit
    if (sources.length >= MAX_SOURCES) {
      error(`Cannot add. Maximum ${MAX_SOURCES} sources allowed.`);
      return;
    }

    try {
      await sourcesAPI.addTextSource(projectId, content, name);
      success('Text source added successfully');
      await loadSources();
      setSheetOpen(false);
    } catch (err: unknown) {
      console.error('Error adding text source:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add text';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        error(axiosErr.response?.data?.error || errorMessage);
      } else {
        error(errorMessage);
      }
    }
  };

  /**
   * Handle source deletion
   */
  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    try {
      await sourcesAPI.deleteSource(projectId, sourceId);
      success(`Deleted "${sourceName}"`);
      await loadSources();
    } catch (err) {
      console.error('Error deleting source:', err);
      error('Failed to delete source');
    }
  };

  /**
   * Handle source download
   */
  const handleDownloadSource = (sourceId: string) => {
    const url = sourcesAPI.getDownloadUrl(projectId, sourceId);
    window.open(url, '_blank');
  };

  // Calculate totals
  const totalSize = sources.reduce((sum, s) => sum + s.file_size, 0);
  const sourcesCount = sources.length;
  const isAtLimit = sourcesCount >= MAX_SOURCES;

  return (
    <>
      <div className="flex flex-col h-full">
        <SourcesHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setSheetOpen(true)}
          isAtLimit={isAtLimit}
        />

        <SourcesList
          sources={sources}
          loading={loading}
          searchQuery={searchQuery}
          onDownload={handleDownloadSource}
          onDelete={handleDeleteSource}
        />

        <SourcesFooter sourcesCount={sourcesCount} totalSize={totalSize} />
      </div>

      <AddSourcesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        sourcesCount={sourcesCount}
        onUpload={handleFileUpload}
        onAddUrl={handleAddUrl}
        onAddText={handleAddText}
        uploading={uploading}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};
