import React, { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Network, Settings, RefreshCw, Download, FileText, Link2, Maximize2 } from 'lucide-react';
import { FileNode } from './FileExplorer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GraphNode {
  id: string;
  name: string;
  content: string;
  connections: number;
  size: number;
  group: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  color?: string;
}

interface ContextGraphProps {
  files: FileNode[];
  selectedFileId: string | null | undefined;
  onNodeClick: (fileId: string) => void;
}

type GraphMode = 'all' | 'single' | 'connected';

const ContextGraph: React.FC<ContextGraphProps> = ({ files, selectedFileId, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [graphMode, setGraphMode] = useState<GraphMode>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState({
    linkDistance: 150,
    nodeSize: 10,
    linkStrength: 0.3,
    showLabels: true,
    animateNodes: true,
    colorByConnections: true,
    nodeOpacity: 0.8,
    linkOpacity: 0.4,
    particleSpeed: 0.01,
    enableParticles: false,
  });

  // Color schemes for nodes
  const colorSchemes = {
    default: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
    connections: (connections: number, maxConnections: number) => {
      const intensity = Math.max(0.3, connections / maxConnections);
      return `rgba(139, 92, 246, ${intensity})`;
    }
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

  // Find file by backlink text
  const findFileByBacklink = (files: FileNode[], linkText: string): FileNode | null => {
    const allFiles = extractTextFiles(files);
    return allFiles.find(f => 
      f.name.toLowerCase().includes(linkText.toLowerCase()) ||
      linkText.toLowerCase().includes(f.name.replace(/\.[^/.]+$/, '').toLowerCase())
    ) || null;
  };

  // Extract text files and analyze connections
  const analyzeConnections = (files: FileNode[], mode: GraphMode = 'all'): { nodes: GraphNode[]; links: GraphLink[] } => {
    let textFiles = extractTextFiles(files);
    
    // Filter files based on graph mode
    if (mode === 'single' && selectedFileId) {
      textFiles = textFiles.filter(f => f.id === selectedFileId);
    } else if (mode === 'connected' && selectedFileId) {
      const selectedFile = textFiles.find(f => f.id === selectedFileId);
      if (selectedFile) {
        const backlinks = extractBacklinks(selectedFile.content || '');
        const connectedFileIds = new Set([selectedFileId]);
        
        // Add files mentioned in backlinks
        backlinks.forEach(link => {
          const linkedFile = findFileByBacklink(files, link);
          if (linkedFile) connectedFileIds.add(linkedFile.id);
        });
        
        // Add files that mention this file
        textFiles.forEach(file => {
          const fileBacklinks = extractBacklinks(file.content || '');
          fileBacklinks.forEach(link => {
            const linkedFile = findFileByBacklink(files, link);
            if (linkedFile && linkedFile.id === selectedFileId) {
              connectedFileIds.add(file.id);
            }
          });
        });
        
        textFiles = textFiles.filter(f => connectedFileIds.has(f.id));
      }
    }
    
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Create nodes from files
    textFiles.forEach((file) => {
      const content = file.content || '';
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      nodes.push({
        id: file.id,
        name: file.name,
        content: content,
        connections: 0,
        size: Math.max(settings.nodeSize, Math.min(50, wordCount / 10)),
        group: Math.floor(Math.random() * 5), // Random color groups
      });
    });

    // Add backlink connections
    textFiles.forEach(file => {
      const backlinks = extractBacklinks(file.content || '');
      backlinks.forEach(link => {
        const linkedFile = findFileByBacklink(files, link);
        if (linkedFile && linkedFile.id !== file.id && textFiles.some(f => f.id === linkedFile.id)) {
          links.push({
            source: file.id,
            target: linkedFile.id,
            strength: 1, // Backlinks have strong connection
          });
          
          // Update connection counts
          const node1 = nodes.find(n => n.id === file.id);
          const node2 = nodes.find(n => n.id === linkedFile.id);
          if (node1) node1.connections++;
          if (node2) node2.connections++;
        }
      });
    });

    // Analyze connections between files based on common keywords (only if not single mode)
    if (mode !== 'single') {
      for (let i = 0; i < textFiles.length; i++) {
        for (let j = i + 1; j < textFiles.length; j++) {
          const file1 = textFiles[i];
          const file2 = textFiles[j];
          
          // Skip if already connected via backlink
          const alreadyConnected = links.some(link => 
            (link.source === file1.id && link.target === file2.id) ||
            (link.source === file2.id && link.target === file1.id)
          );
          
          if (!alreadyConnected) {
            const similarity = calculateSimilarity(file1.content || '', file2.content || '');
            
            if (similarity > 0.1) { // Threshold for connection
              links.push({
                source: file1.id,
                target: file2.id,
                strength: similarity * 0.5, // Weaker than backlinks
              });
              
              // Update connection counts
              const node1 = nodes.find(n => n.id === file1.id);
              const node2 = nodes.find(n => n.id === file2.id);
              if (node1) node1.connections++;
              if (node2) node2.connections++;
            }
          }
        }
      }
    }

    // Apply colors based on settings
    const maxConnections = Math.max(...nodes.map(n => n.connections), 1);
    nodes.forEach((node) => {
      if (settings.colorByConnections) {
        node.color = colorSchemes.connections(node.connections, maxConnections);
      } else {
        node.color = colorSchemes.default[node.group];
      }
    });

    // Apply link colors
    links.forEach(link => {
      link.color = `rgba(255, 255, 255, ${settings.linkOpacity})`;
    });

    return { nodes, links };
  };

  const extractTextFiles = (files: FileNode[]): FileNode[] => {
    const textFiles: FileNode[] = [];
    
    const traverse = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file' && node.content) {
          textFiles.push(node);
        } else if (node.type === 'folder' && node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(files);
    return textFiles;
  };

  const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  };

  const initializeGraph = () => {
    if (!containerRef.current || !graphData.nodes.length) return;

    // Clear existing graph
    if (graphRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Initialize the 3D force graph
    const ForceGraph3DInstance = ForceGraph3D as any;
    const graph = new ForceGraph3DInstance(containerRef.current)
      .graphData(graphData)
      .nodeId('id')
      .nodeLabel((node: any) => `
        <div style="
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          max-width: 200px;
          word-wrap: break-word;
          border: 1px solid rgba(139, 92, 246, 0.5);
        ">
          <strong>${node.name}</strong><br/>
          Connections: ${node.connections}<br/>
          Words: ${node.content.split(/\s+/).length}
        </div>
      `)
      .nodeColor((node: any) => node.color || '#8b5cf6')
      .nodeOpacity(settings.nodeOpacity)
      .nodeResolution(16)
      .nodeVal((node: any) => node.size)
      .linkColor((link: any) => link.color || `rgba(255, 255, 255, ${settings.linkOpacity})`)
      .linkOpacity(settings.linkOpacity)
      .linkWidth((link: any) => Math.sqrt(link.strength) * 2)
      .linkDirectionalParticles(settings.enableParticles ? 2 : 0)
      .linkDirectionalParticleSpeed(settings.particleSpeed)
      .linkDirectionalParticleColor(() => 'rgba(139, 92, 246, 0.6)')
      .onNodeClick((node: any) => {
        onNodeClick(node.id);
        // Animate camera to focus on clicked node
        const distance = 250;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          3000
        );
      })
      .onNodeHover((node: any) => {
        if (containerRef.current) {
          containerRef.current.style.cursor = node ? 'pointer' : 'default';
        }
      })
      .enableNodeDrag(true)
      .backgroundColor('rgba(0, 0, 0, 0)');

    // Configure forces
    const forceLink = graph.d3Force('link');
    const forceCharge = graph.d3Force('charge');
    
    if (forceLink) forceLink.distance(settings.linkDistance);
    if (forceCharge) forceCharge.strength(-120);

    // Highlight selected node
    if (selectedFileId) {
      const selectedNode = graphData.nodes.find(n => n.id === selectedFileId);
      if (selectedNode) {
        graph.nodeColor((node: any) => {
          if (node.id === selectedFileId) {
            return '#ffffff';
          }
          return node.color || '#8b5cf6';
        });
      }
    }

    // Store reference
    graphRef.current = graph;

    // Auto-rotate if enabled
    if (settings.animateNodes) {
      const controls = graph.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
    }
  };

  const refreshGraph = () => {
    const newData = analyzeConnections(files, graphMode);
    setGraphData(newData);
  };

  const exportGraph = () => {
    if (!graphRef.current) return;
    
    // Take a screenshot of the 3D graph
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'context-graph-3d.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const newData = analyzeConnections(files, graphMode);
    setGraphData(newData);
  }, [files, settings, graphMode, selectedFileId]);

  useEffect(() => {
    initializeGraph();
  }, [graphData, selectedFileId, settings]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        graphRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-full bg-gradient-card rounded-lg border border-border shadow-md flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">3D Context Graph</h3>
          <Badge variant="secondary">
            {graphData.nodes.length} nodes, {graphData.links.length} connections
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={graphMode} onValueChange={(value) => value && setGraphMode(value as GraphMode)}>
            <ToggleGroupItem value="all" aria-label="All files">
              <Network className="h-4 w-4 mr-1" />
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="single" aria-label="Single file" disabled={!selectedFileId}>
              <FileText className="h-4 w-4 mr-1" />
              Single
            </ToggleGroupItem>
            <ToggleGroupItem value="connected" aria-label="Connected files" disabled={!selectedFileId}>
              <Link2 className="h-4 w-4 mr-1" />
              Connected
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Button onClick={refreshGraph} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={exportGraph} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button onClick={toggleFullscreen} size="sm" variant="outline">
            <Maximize2 className="h-4 w-4 mr-1" />
            Fullscreen
          </Button>
          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleContent>
          <Card className="m-4 p-4 space-y-4 bg-background/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Distance</label>
                <Slider
                  value={[settings.linkDistance]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, linkDistance: value }))}
                  max={300}
                  min={50}
                  step={10}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Node Size</label>
                <Slider
                  value={[settings.nodeSize]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, nodeSize: value }))}
                  max={30}
                  min={5}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Node Opacity</label>
                <Slider
                  value={[settings.nodeOpacity]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, nodeOpacity: value }))}
                  max={1}
                  min={0.1}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Opacity</label>
                <Slider
                  value={[settings.linkOpacity]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, linkOpacity: value }))}
                  max={1}
                  min={0.1}
                  step={0.1}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Labels</label>
                <Switch
                  checked={settings.showLabels}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, showLabels: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Rotate</label>
                <Switch
                  checked={settings.animateNodes}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, animateNodes: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Color by Connections</label>
                <Switch
                  checked={settings.colorByConnections}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, colorByConnections: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Link Particles</label>
                <Switch
                  checked={settings.enableParticles}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, enableParticles: checked }))}
                />
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex-1 p-4">
        {graphData.nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Network className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No connections found</h3>
            <p className="text-muted-foreground mb-4">
              Create some files with content to see connections in the 3D graph
            </p>
            <Button onClick={refreshGraph} variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" />
              Analyze Files
            </Button>
          </div>
        ) : (
          <div 
            ref={containerRef} 
            className="h-full bg-background/30 rounded border border-border/50 overflow-hidden"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>
    </div>
  );
};

export default ContextGraph;
