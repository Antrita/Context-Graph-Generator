import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, FileText, Link } from 'lucide-react';
import { FileNode } from './FileExplorer';
import { useToast } from '@/hooks/use-toast';

interface TextEditorProps {
  selectedFile: FileNode | null;
  onSave: (fileId: string, content: string) => void;
  files: FileNode[];
  onFileSelect: (fileId: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ selectedFile, onSave, files, onFileSelect }) => {
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedFile) {
      setContent(selectedFile.content || '');
      setHasChanges(false);
    }
  }, [selectedFile]);

  const handleSave = () => {
    if (selectedFile && hasChanges) {
      onSave(selectedFile.id, content);
      setHasChanges(false);
      toast({
        title: "File saved",
        description: `${selectedFile.name} has been saved successfully.`,
      });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== (selectedFile?.content || ''));
  };

  // Extract backlinks from content
  const extractBacklinks = (content: string): string[] => {
    const backlinkRegex = /\[\[([^\]]+)\]\]/g;
    const matches = [];
    let match;
    while ((match = backlinkRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  // Get all files for backlink suggestions
  const getAllFiles = (files: FileNode[]): FileNode[] => {
    const allFiles: FileNode[] = [];
    const traverse = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file') {
          allFiles.push(node);
        } else if (node.type === 'folder' && node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(files);
    return allFiles;
  };

  // Render content with clickable backlinks
  const renderContentWithBacklinks = (content: string) => {
    const backlinkRegex = /\[\[([^\]]+)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = backlinkRegex.exec(content)) !== null) {
      // Add text before the backlink
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Add the clickable backlink
      const linkText = match[1];
      const linkedFile = getAllFiles(files).find(f => 
        f.name.toLowerCase().includes(linkText.toLowerCase()) ||
        linkText.toLowerCase().includes(f.name.replace(/\.[^/.]+$/, '').toLowerCase())
      );
      
      parts.push(
        <button
          key={match.index}
          onClick={() => linkedFile && onFileSelect(linkedFile.id)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
            linkedFile 
              ? 'bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer' 
              : 'bg-muted text-muted-foreground cursor-default'
          }`}
        >
          <Link className="h-3 w-3" />
          {linkText}
        </button>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  const currentBacklinks = selectedFile ? extractBacklinks(selectedFile.content || '') : [];
  const linkedFiles = getAllFiles(files).filter(f => 
    currentBacklinks.some(link => 
      f.name.toLowerCase().includes(link.toLowerCase()) ||
      link.toLowerCase().includes(f.name.replace(/\.[^/.]+$/, '').toLowerCase())
    )
  );

  if (!selectedFile) {
    return (
      <div className="h-full bg-gradient-card rounded-lg border border-border p-8 shadow-md flex flex-col items-center justify-center text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No file selected</h3>
        <p className="text-muted-foreground">
          Select a file from the explorer to start editing
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-card rounded-lg border border-border shadow-md flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
          {hasChanges && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              Unsaved
            </span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          size="sm"
          className="bg-gradient-primary"
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your notes... Use [[filename]] to create backlinks"
          className="h-full resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
          style={{ minHeight: 'calc(100vh - 350px)' }}
        />
        
        {/* Backlinks Preview */}
        {selectedFile && currentBacklinks.length > 0 && (
          <div className="bg-background/30 rounded-lg p-4 border border-border/50">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Link className="h-4 w-4" />
              Backlinks ({currentBacklinks.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {linkedFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => onFileSelect(file.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  {file.name}
                </button>
              ))}
              {currentBacklinks.filter(link => 
                !linkedFiles.some(f => 
                  f.name.toLowerCase().includes(link.toLowerCase()) ||
                  link.toLowerCase().includes(f.name.replace(/\.[^/.]+$/, '').toLowerCase())
                )
              ).map(link => (
                <span
                  key={link}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded text-sm"
                >
                  <Link className="h-3 w-3" />
                  {link} (not found)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextEditor;
