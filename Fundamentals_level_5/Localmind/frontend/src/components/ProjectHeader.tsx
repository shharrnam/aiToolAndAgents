import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ArrowLeft, MoreVertical, Plus, Trash2, FolderOpen, Settings } from 'lucide-react';

/**
 * ProjectHeader Component
 * Educational Note: Header for project workspace with navigation and project actions.
 * Uses DropdownMenu for additional options and AlertDialog for delete confirmation.
 */

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    description?: string;
  };
  onBack: () => void;
  onDelete: () => void;
}

// Default system prompt for all projects
const DEFAULT_SYSTEM_PROMPT = `You are LocalMind, an AI assistant helping users analyze and understand their project sources. You have access to documents, notes, and other materials the user has added to this project.

Your role is to:
1. Answer questions based on the provided sources
2. Help synthesize information across multiple documents
3. Generate insights and summaries
4. Assist with content creation based on the project materials

Always cite relevant sources when providing information. Be accurate, helpful, and concise in your responses.`;

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onBack,
  onDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [systemPrompt, setSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT);
  const [tempSystemPrompt, setTempSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT);

  const handleNewProject = () => {
    console.log('Creating new project...');
    // For now, just navigate back to project list
    onBack();
  };

  const handleOpenSettings = () => {
    setTempSystemPrompt(systemPrompt);
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    console.log('Saving system prompt for project:', project.id);
    setSystemPrompt(tempSystemPrompt);
    setSettingsDialogOpen(false);
  };

  const handleResetPrompt = () => {
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  return (
    <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
      {/* Left side - Back button and project name */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenSettings}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Project Settings
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNewProject}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log('Rename project')}>
              Rename Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Duplicate project')}>
              Duplicate Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Export project')}>
              Export Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.name}" and all of its data.
              This action cannot be undone. All sources, chats, and generated content
              will be lost forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Configure settings for "{project.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="system-prompt" className="text-sm font-medium">
                System Prompt
              </label>
              <p className="text-xs text-muted-foreground">
                This prompt defines how the AI assistant behaves when responding to queries about this project.
                Customize it to match your project's specific needs and context.
              </p>
              <textarea
                id="system-prompt"
                value={tempSystemPrompt}
                onChange={(e) => setTempSystemPrompt(e.target.value)}
                className="w-full h-64 p-3 border rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter system prompt..."
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {tempSystemPrompt.length} characters
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPrompt}
                  disabled={tempSystemPrompt === DEFAULT_SYSTEM_PROMPT}
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={tempSystemPrompt === systemPrompt}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};