import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileExplorer, { FileNode } from '@/components/FileExplorer';
import TextEditor from '@/components/TextEditor';
import ContextGraph from '@/components/ContextGraph';
import { Button } from '@/components/ui/button';
import { Brain, FileText, Network } from 'lucide-react';

const Index = () => {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: 'welcome',
      name: 'Welcome.md',
      type: 'file',
      content: `# Welcome to Context Graph Generator

This is a powerful tool for creating and visualizing connections between your notes and documents.

## Features
- **File Management**: Create, edit, and organize your files and folders
- **Smart Connections**: Automatically detect relationships between documents
- **Interactive Graph**: Visualize your knowledge network with D3.js
- **Customizable**: Adjust graph appearance and behavior to your needs

Start by creating some notes and watch the connections emerge!

## Getting Started
1. Create new files using the "New" button in the file explorer
2. Write some content in your files
3. Switch to the Graph view to see connections
4. Customize the graph settings to your preference

Happy note-taking! 🚀`,
    },
    {
      id: 'concepts',
      name: 'Key Concepts.md',
      type: 'file',
      content: `# Key Concepts in Knowledge Management

## Network Theory
Understanding how information connects and flows through different nodes in a system.

## Graph Visualization
Visual representation of data structures using nodes and edges to show relationships.

## Context Mapping
The process of identifying and mapping contextual relationships between different pieces of information.

## Knowledge Graphs
Structured representations of knowledge that capture entities and their relationships.

These concepts form the foundation of effective knowledge management systems.`,
    },
    {
      id: 'folder1',
      name: 'Research',
      type: 'folder',
      children: [
        {
          id: 'research1',
          name: 'Network Analysis.md',
          type: 'file',
          content: `# Network Analysis Research

## Introduction
Network analysis is a powerful method for understanding complex systems through the study of relationships between entities.

## Applications
- Social network analysis
- Information flow mapping
- Knowledge graph construction
- System architecture visualization

## Tools and Techniques
- Graph theory fundamentals
- Centrality measures
- Community detection algorithms
- Visualization techniques

This research connects closely with knowledge management and graph visualization concepts.`,
          parentId: 'folder1',
        },
      ],
    },
  ]);
  
  const [selectedFileId, setSelectedFileId] = useState<string | null>('welcome');
  const [activeTab, setActiveTab] = useState('editor');

  const selectedFile = findFileById(files, selectedFileId);

  function findFileById(files: FileNode[], id: string | null): FileNode | null {
    if (!id) return null;
    
    for (const file of files) {
      if (file.id === id) return file;
      if (file.children) {
        const found = findFileById(file.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileCreate = (parentId: string | null, name: string, type: 'file' | 'folder') => {
    const newFile: FileNode = {
      id: generateId(),
      name: name,
      type: type,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      parentId: parentId || undefined,
    };

    if (!parentId) {
      setFiles([...files, newFile]);
    } else {
      const addToParent = (files: FileNode[]): FileNode[] => {
        return files.map(file => {
          if (file.id === parentId && file.children) {
            return { ...file, children: [...file.children, newFile] };
          }
          if (file.children) {
            return { ...file, children: addToParent(file.children) };
          }
          return file;
        });
      };
      setFiles(addToParent(files));
    }
  };

  const handleFileDelete = (id: string) => {
    const removeFile = (files: FileNode[]): FileNode[] => {
      return files.filter(file => {
        if (file.id === id) return false;
        if (file.children) {
          file.children = removeFile(file.children);
        }
        return true;
      });
    };
    
    setFiles(removeFile(files));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const handleFileRename = (id: string, newName: string) => {
    const renameFile = (files: FileNode[]): FileNode[] => {
      return files.map(file => {
        if (file.id === id) {
          return { ...file, name: newName };
        }
        if (file.children) {
          return { ...file, children: renameFile(file.children) };
        }
        return file;
      });
    };
    
    setFiles(renameFile(files));
  };

  const handleFileSave = (fileId: string, content: string) => {
    const updateFile = (files: FileNode[]): FileNode[] => {
      return files.map(file => {
        if (file.id === fileId) {
          return { ...file, content };
        }
        if (file.children) {
          return { ...file, children: updateFile(file.children) };
        }
        return file;
      });
    };
    
    setFiles(updateFile(files));
  };

  const handleNodeClick = (fileId: string) => {
    setSelectedFileId(fileId);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Context Graph Generator
              </h1>
              <p className="text-muted-foreground">
                Discover connections in your knowledge network
              </p>
            </div>
          </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-200px)] gap-4">
          <ResizablePanel defaultSize={25} minSize={20}>
            <FileExplorer
              files={files}
              selectedFileId={selectedFileId}
              onFileSelect={(file) => setSelectedFileId(file.id)}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              onFileRename={handleFileRename}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={75} minSize={50}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="bg-gradient-card rounded-lg border border-border shadow-md">
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-transparent">
                  <TabsTrigger 
                    value="editor" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger 
                    value="graph"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Network className="h-4 w-4" />
                    Graph
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 mt-4">
                <TabsContent value="editor" className="h-full m-0">
                  <TextEditor
                    selectedFile={selectedFile}
                    onSave={handleFileSave}
                    files={files}
                    onFileSelect={(fileId) => setSelectedFileId(fileId)}
                  />
                </TabsContent>
                
                <TabsContent value="graph" className="h-full m-0">
                  <ContextGraph
                    files={files}
                    selectedFileId={selectedFileId}
                    onNodeClick={handleNodeClick}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
