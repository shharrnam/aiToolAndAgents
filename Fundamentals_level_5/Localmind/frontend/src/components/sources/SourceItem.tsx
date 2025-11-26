/**
 * SourceItem Component
 * Educational Note: Displays a single source with icon, name, size, and action buttons.
 * Reusable component that receives source data and action callbacks via props.
 */

import React from 'react';
import { Button } from '../ui/button';
import {
  FileText,
  File,
  MusicNote,
  Image,
  Table,
  Trash,
  DownloadSimple,
  Link,
} from '@phosphor-icons/react';
import { formatFileSize, type Source } from '../../lib/api/sources';

interface SourceItemProps {
  source: Source;
  onDownload: (sourceId: string) => void;
  onDelete: (sourceId: string, sourceName: string) => void;
}

/**
 * Get the appropriate icon component for a source category
 */
const getCategoryIconComponent = (category: string) => {
  switch (category) {
    case 'document':
      return FileText;
    case 'audio':
      return MusicNote;
    case 'image':
      return Image;
    case 'data':
      return Table;
    case 'link':
      return Link;
    default:
      return File;
  }
};

export const SourceItem: React.FC<SourceItemProps> = ({
  source,
  onDownload,
  onDelete,
}) => {
  const Icon = getCategoryIconComponent(source.category);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent group transition-colors">
      <Icon size={16} className="text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{source.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(source.file_size)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDownload(source.id)}
          title="Download"
        >
          <DownloadSimple size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(source.id, source.name)}
          title="Delete"
        >
          <Trash size={14} />
        </Button>
      </div>
    </div>
  );
};
