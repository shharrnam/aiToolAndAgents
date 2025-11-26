import React, { useState } from 'react';
import { ProjectList } from './ProjectList';
import { AppSettings } from './AppSettings';
import { Button } from './ui/button';
import { Gear, Brain, Sparkle, GithubLogo, YoutubeLogo, BookOpen } from '@phosphor-icons/react';
import { ToastContainer, useToast } from './ui/toast';

/**
 * Dashboard Component
 * Educational Note: Main dashboard layout for the NotebookLM clone application.
 * This component manages the projects list and application settings.
 */

interface DashboardProps {
  onSelectProject: (project: any) => void;
  onCreateNewProject: () => void;
  refreshTrigger?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectProject,
  onCreateNewProject,
  refreshTrigger = 0
}) => {
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const { toasts, dismissToast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold">LocalLm</h1>
                <p className="text-xs text-muted-foreground">Your private AI knowledge hub</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppSettingsOpen(true)}
              className="gap-2"
            >
              <Gear size={16} />
              App Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Part Layout */}
      <main className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-73px)]">
        {/* Top Section: Projects (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto mb-6">
          <ProjectList
            onSelectProject={onSelectProject}
            onCreateNew={onCreateNewProject}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Bottom Section: Learning Info Cards */}
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {/* Card 1: Session 3 - What We're Building */}
          <div className="border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Sparkle size={20} className="text-primary" />
              <h3 className="font-semibold">Session 3: The Complete AI Tool</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Build a production-ready AI application combining everything from the course into one powerful tool.
            </p>
            <div className="flex flex-wrap gap-2">
              {['AI Chat', 'RAG', 'Image Gen', 'Video Gen', 'Realtime Transcription', 'Memories', 'Subagents', 'Deep Research', 'Web Search'].map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded-md"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: Previous Sessions & Resources */}
          <div className="border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={20} className="text-primary" />
              <h3 className="font-semibold">Previous Sessions & Resources</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Catch up on the fundamentals from Sessions 1 & 2, and access all course materials on GitHub.
            </p>
            <div className="space-y-2">
              <a
                href="https://www.youtube.com/watch?v=jsdKgmU3DJA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <YoutubeLogo size={18} className="text-red-500" />
                <span>Session 1: API Basics, Parameters & Tool Use</span>
              </a>
              <a
                href="https://www.youtube.com/watch?v=RgykmlWXzns"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <YoutubeLogo size={18} className="text-red-500" />
                <span>Session 2: Chat, Memory & AI Agents</span>
              </a>
              <a
                href="https://github.com/TeacherOp/growthx_1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <GithubLogo size={18} />
                <span>Course Code & Notes Repository</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* App Settings Dialog */}
      <AppSettings open={appSettingsOpen} onOpenChange={setAppSettingsOpen} />
    </div>
  );
};