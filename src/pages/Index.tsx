import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileExplorer, { FileNode } from '@/components/FileExplorer';
import TextEditor from '@/components/TextEditor';
import ContextGraph from '@/components/ContextGraph';
import { Button } from '@/components/ui/button';
import { Brain, FileText, Network, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import UserProfile from '@/components/UserProfile';
import SaveGraphButton from '@/components/SaveGraphButton';
import { useAuth } from '@/lib/AuthContext';
import { graphService } from '@/lib/graphService';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Check if we're loading a graph from dashboard
  const loadedGraphData = location.state?.loadedGraphData;
  const loadedGraphId = location.state?.loadedGraphId;
  
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
- **Cloud Sync**: Save and sync your graphs across devices (sign in required)

Start by creating some notes and watch the connections emerge!

## Getting Started
1. Create new files using the "New" button in the file explorer
2. Write some content in your files
3. Switch to the Graph view to see connections
4. Sign in to save and sync your work
5. Customize the graph settings to your preference

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
  const [currentGraphId, setCurrentGraphId] = useState<string | null>(loadedGraphId || null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  // Load graph data from dashboard navigation
  useEffect(() => {
    if (loadedGraphData && loadedGraphData.files) {
      setFiles(loadedGraphData.files);
      setSelectedFileId(loadedGraphData.selectedFileId || 'welcome');
      setCurrentGraphId(loadedGraphId);
      toast({
        title: "Graph loaded successfully!",
        description: "Your saved graph has been loaded from the dashboard.",
      });
      
      // Clear the location state to prevent reloading on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadedGraphData, loadedGraphId, toast]);

  const selectedFile = findFileById(files, selectedFileId);

  // Load a saved graph
  const loadSavedGraph = async (graphId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to load saved graphs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingGraph(true);
    try {
      const graph = await graphService.getGraph(graphId, user.uid);
      if (graph && graph.graphData) {
        setFiles(graph.graphData.files || files);
        setCurrentGraphId(graph.id);
        toast({
          title: "Graph loaded successfully!",
          description: `Loaded "${graph.title}"`,
        });
      }
    } catch (error) {
      console.error('Error loading graph:', error);
      toast({
        title: "Error loading graph",
        description: "Failed to load the saved graph.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Create graph data for saving
  const createGraphData = () => {
    return {
      files,
      selectedFileId,
      version: '1.0',
      createdWith: 'Context Graph Generator'
    };
  };

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

  const handleNewGraph = () => {
    setFiles([
      {
        id: 'welcome',
        name: 'Welcome.md',
        type: 'file',
        content: `# New Context Graph

Start building your knowledge network here!

Create files and folders to organize your thoughts and ideas.`,
      }
    ]);
    setSelectedFileId('welcome');
    setCurrentGraphId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Context Graph Generator
                </h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Discover connections in your knowledge network
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNewGraph}
                    className="hidden md:flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    New Graph
                  </Button>
                  <SaveGraphButton 
                    graphData={createGraphData()}
                    existingGraphId={currentGraphId}
                    className="hidden md:flex"
                  />
                </>
              )}
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Mobile header info */}
          <div className="mb-4 md:hidden">
            <p className="text-muted-foreground text-sm">
              Discover connections in your knowledge network
            </p>
          </div>

          {/* Mobile controls */}
          {user && (
            <div className="flex gap-2 mb-4 md:hidden">
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNewGraph}
                className="flex-1"
              >
                <Brain className="h-4 w-4 mr-2" />
                New
              </Button>
              <SaveGraphButton 
                graphData={createGraphData()}
                existingGraphId={currentGraphId}
                className="flex-1"
              />
            </div>
          )}

          {/* Auth prompt for non-authenticated users */}
          {!user && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Save your work in the cloud
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Sign in to save, sync, and share your context graphs across devices.
                  </p>
                </div>
                <Link to="/login">
                  <Button size="sm" className="ml-4">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}

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
    </div>
  );
};

export default Index;
