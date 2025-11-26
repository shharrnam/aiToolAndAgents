import React from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  MagicWand,
  FileText,
  Envelope,
  Users,
  ListChecks,
  Brain,
  PresentationChart,
  Headphones,
  Video,
  Sparkle,
  FileCode,
  Lightning,
} from '@phosphor-icons/react';

/**
 * StudioPanel Component
 * Educational Note: Studio panel for generating various content types from project sources.
 * Organized into categories for better discoverability.
 */

interface StudioPanelProps {
  projectId: string;
}

interface GenerationOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'documents' | 'communication' | 'media' | 'analysis';
}

const generationOptions: GenerationOption[] = [
  // Documents
  {
    id: 'presentation',
    title: 'Generate Presentation',
    description: 'Create slides from your sources',
    icon: PresentationChart,
    category: 'documents',
  },
  {
    id: 'prd',
    title: 'Generate PRD / Docs',
    description: 'Product requirements document',
    icon: FileText,
    category: 'documents',
  },
  {
    id: 'todo',
    title: 'Generate To-Do List',
    description: 'Action items from your content',
    icon: ListChecks,
    category: 'documents',
  },
  // Communication
  {
    id: 'team-email',
    title: 'Draft Team Email',
    description: 'Internal communication draft',
    icon: Envelope,
    category: 'communication',
  },
  {
    id: 'stakeholder-email',
    title: 'Draft Stakeholder Email',
    description: 'External communication draft',
    icon: Users,
    category: 'communication',
  },
  // Media
  {
    id: 'audio-overview',
    title: 'Audio Overview',
    description: 'Podcast-style summary',
    icon: Headphones,
    category: 'media',
  },
  {
    id: 'video-overview',
    title: 'Video Overview',
    description: 'Visual presentation of content',
    icon: Video,
    category: 'media',
  },
  // Analysis
  {
    id: 'mindmap',
    title: 'Generate Mind Map',
    description: 'Visual knowledge structure',
    icon: Brain,
    category: 'analysis',
  },
];

export const StudioPanel: React.FC<StudioPanelProps> = ({ projectId }) => {
  const handleGenerate = (optionId: string) => {
    console.log(`Generating ${optionId} for project ${projectId}`);
  };

  const renderOptions = (category: GenerationOption['category']) => {
    const categoryOptions = generationOptions.filter(opt => opt.category === category);

    return (
      <div className="grid gap-3">
        {categoryOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto p-4 justify-start text-left hover:bg-accent"
              onClick={() => handleGenerate(option.id)}
            >
              <div className="flex gap-3 w-full">
                <Icon size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pl-12 border-b">
        <div className="flex items-center gap-2 mb-2">
          <MagicWand size={20} className="text-primary" />
          <h2 className="text-sm font-semibold">Studio</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Generate content from your sources
        </p>
      </div>

      {/* Generation Options */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              <TabsTrigger value="quick">Quick Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-0">
              {/* Documents Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileCode size={16} className="text-muted-foreground" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Documents
                  </h3>
                </div>
                {renderOptions('documents')}
              </div>

              {/* Communication Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Envelope size={16} className="text-muted-foreground" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Communication
                  </h3>
                </div>
                {renderOptions('communication')}
              </div>

              {/* Media Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Video size={16} className="text-muted-foreground" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Media
                  </h3>
                </div>
                {renderOptions('media')}
              </div>

              {/* Analysis Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} className="text-muted-foreground" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Analysis
                  </h3>
                </div>
                {renderOptions('analysis')}
              </div>
            </TabsContent>

            <TabsContent value="quick" className="space-y-3 mt-0">
              {/* Quick actions - most used */}
              <div className="text-center py-4">
                <Lightning size={32} className="mx-auto mb-3 text-primary" />
                <p className="text-sm font-medium mb-1">Quick Actions</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Your most-used generation tools
                </p>
              </div>
              {renderOptions('documents').props.children.slice(0, 2)}
              {renderOptions('media').props.children.slice(0, 1)}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Footer with AI indicator */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkle size={12} />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
};