import React, { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import {
  Plus,
  Upload,
  Link2,
  FileText,
  FolderOpen,
  Youtube,
  Globe,
  ClipboardPaste,
  File,
  Search,
  Library,
} from 'lucide-react';

/**
 * SourcesPanel Component
 * Educational Note: Manages project sources (documents, links, notes, etc.)
 * Uses Sheet component for slide-out modal and Tabs for different source types.
 */

interface SourcesPanelProps {
  projectId: string;
}

// Dummy data for sources
const dummySources = [
  { id: '1', type: 'document', name: 'Project Requirements.pdf', icon: File },
  { id: '2', type: 'link', name: 'Research Article', icon: Globe },
  { id: '3', type: 'note', name: 'Research Notes', icon: FileText },
  { id: '4', type: 'document', name: 'Technical Specs.docx', icon: FileText },
];

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ projectId }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSources = dummySources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 pr-12 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Library className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Sources</h2>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Add Source Button */}
          <Button
            onClick={() => setSheetOpen(true)}
            className="w-full gap-2"
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add sources
          </Button>
        </div>

        {/* Sources List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredSources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No sources yet</p>
                <p className="text-xs mt-1">Add documents, links, or notes to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSources.map((source) => {
                  const Icon = source.icon;
                  return (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{source.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            {dummySources.length} sources • 2.3MB total
          </div>
        </div>
      </div>

      {/* Add Sources Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Add sources</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Sources let LocalMind base its responses on the information that matters most to you.
              (Examples: documents, research notes, web articles, etc.)
            </p>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
                <TabsTrigger value="paste">Paste</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Upload sources</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Drag & drop or choose file to upload
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported: PDF, .txt, Markdown, Audio (mp3), .avif, .bmp, .gif, .ico, .jp2, .png, .webp, .tif, .tiff, .heic, .heif, .jpeg, .jpg, .jpe
                  </p>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => console.log('Connect Google Drive')}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Google Drive
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="link" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Website URL</label>
                    <div className="flex gap-2">
                      <Input placeholder="https://example.com" />
                      <Button size="icon" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">YouTube Video</label>
                    <div className="flex gap-2">
                      <Input placeholder="https://youtube.com/watch?v=..." />
                      <Button size="icon" variant="outline">
                        <Youtube className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paste" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Paste Text</label>
                    <textarea
                      className="w-full h-32 p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Paste your text content here..."
                    />
                  </div>
                  <Button className="w-full">
                    <ClipboardPaste className="h-4 w-4 mr-2" />
                    Add Pasted Content
                  </Button>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};