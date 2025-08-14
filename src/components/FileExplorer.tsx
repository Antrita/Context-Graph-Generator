import React, { useState } from 'react';
import { Folder, FileText, Plus, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  parentId?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreate = () => {
    if (newItemName.trim()) {
      onFileCreate(createParentId, newItemName.trim(), newItemType);
      setNewItemName('');
      setCreateModalOpen(false);
    }
  };

  const handleRename = (id: string) => {
    if (renameValue.trim()) {
      onFileRename(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const startRename = (file: FileNode) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const renderFileNode = (file: FileNode, depth = 0) => {
    const isSelected = selectedFileId === file.id;
    const isExpanded = expandedFolders.has(file.id);
    const isRenaming = renamingId === file.id;

    return (
      <div key={file.id} className="w-full">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer group",
            isSelected && "bg-primary/20 border border-primary/30",
            "ml-" + (depth * 4)
          )}
          onClick={() => file.type === 'file' && onFileSelect(file)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {file.type === 'folder' ? (
              <Folder
                className="h-4 w-4 text-accent flex-shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(file.id);
                }}
              />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            
            {isRenaming ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(file.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(file.id);
                  if (e.key === 'Escape') {
                    setRenamingId(null);
                    setRenameValue('');
                  }
                }}
                className="h-6 px-1 text-sm bg-background border-primary"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium truncate">{file.name}</span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.type === 'folder' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateParentId(file.id);
                  setCreateModalOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startRename(file)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFileDelete(file.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gradient-card rounded-lg border border-border p-4 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Files</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCreateParentId(null);
            setCreateModalOpen(true);
          }}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      <div className="space-y-1 max-h-full overflow-y-auto">
        {files.map((file) => renderFileNode(file))}
      </div>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={newItemType === 'file' ? 'default' : 'outline'}
                onClick={() => setNewItemType('file')}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-1" />
                File
              </Button>
              <Button
                variant={newItemType === 'folder' ? 'default' : 'outline'}
                onClick={() => setNewItemType('folder')}
                size="sm"
              >
                <Folder className="h-4 w-4 mr-1" />
                Folder
              </Button>
            </div>
            <Input
              placeholder={`Enter ${newItemType} name`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newItemName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileExplorer;
