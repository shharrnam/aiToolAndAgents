/**
 * SourcesHeader Component
 * Educational Note: Header section with title, search input, and add sources button.
 * Receives state and callbacks from parent SourcesPanel.
 */

import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, MagnifyingGlass, Books } from '@phosphor-icons/react';

interface SourcesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  isAtLimit: boolean;
}

export const SourcesHeader: React.FC<SourcesHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onAddClick,
  isAtLimit,
}) => {
  return (
    <div className="p-4 pr-12 border-b">
      <div className="flex items-center gap-2 mb-3">
        <Books size={20} className="text-primary" />
        <h2 className="text-sm font-semibold">Sources</h2>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlass size={16} className="absolute left-2 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search sources..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Add Source Button */}
      <Button
        onClick={onAddClick}
        className="w-full gap-2"
        variant="outline"
        size="sm"
        disabled={isAtLimit}
      >
        <Plus size={16} />
        Add sources
      </Button>
    </div>
  );
};
