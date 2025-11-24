import React, { useState } from 'react';
import { Button } from './ui/button';
import { SourcesPanel } from './SourcesPanel';
import { ChatPanel } from './ChatPanel';
import { StudioPanel } from './StudioPanel';
import { ProjectHeader } from './ProjectHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ProjectWorkspace Component
 * Educational Note: This is the main workspace view for a project, inspired by NotebookLM.
 * It uses a three-panel layout: Sources (left), Chat (center), and Studio (right).
 * Panels can be collapsed/expanded for better focus.
 */

interface ProjectWorkspaceProps {
  project: {
    id: string;
    name: string;
    description: string;
  };
  onBack: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBack,
  onDeleteProject
}) => {
  // State for panel visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Project Header */}
      <ProjectHeader
        project={project}
        onBack={onBack}
        onDelete={() => onDeleteProject(project.id)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sources */}
        <div
          className={`transition-all duration-300 ${
            leftPanelOpen ? 'w-80' : 'w-12'
          } border-r flex flex-col relative bg-muted/30`}
        >
          {leftPanelOpen ? (
            <>
              <SourcesPanel projectId={project.id} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(false)}
                className="absolute top-2 right-2 z-10 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(true)}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Center Panel - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel projectName={project.name} />
        </div>

        {/* Right Panel - Studio */}
        <div
          className={`transition-all duration-300 ${
            rightPanelOpen ? 'w-80' : 'w-12'
          } border-l flex flex-col relative bg-muted/30`}
        >
          {rightPanelOpen ? (
            <>
              <StudioPanel projectId={project.id} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightPanelOpen(false)}
                className="absolute top-2 left-2 z-10 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightPanelOpen(true)}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};