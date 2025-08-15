import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Network, Settings, RefreshCw, Download, FileText, Link2 } from 'lucide-react';
import { FileNode } from './FileExplorer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  content: string;
  connections: number;
  size: number;
  group: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
}

interface ContextGraphProps {
  files: FileNode[];
  selectedFileId: string | null;
  onNodeClick: (fileId: string) => void;
}

type GraphMode = 'all' | 'single' | 'connected';

const ContextGraph: React.FC<ContextGraphProps> = ({ files, selectedFileId, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [graphMode, setGraphMode] = useState<GraphMode>('all');
  const [settings, setSettings] = useState({
    linkDistance: 150,
    nodeSize: 10,
    linkStrength: 0.3,
    showLabels: true,
    animateNodes: true,
    colorByConnections: true,
  });

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
    textFiles.forEach((file, index) => {
      const content = file.content || '';
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      nodes.push({
        id: file.id,
        name: file.name,
        content: content,
        connections: 0,
        size: Math.max(settings.nodeSize, Math.min(50, wordCount / 10)),
        group: index % 5, // Color groups
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

  const renderGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!graphData.nodes.length) return;

    const width = 800;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const connectionColorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, d3.max(graphData.nodes, d => d.connections) || 1]);

    // Create simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(settings.linkDistance))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(30));

    // Create container group
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Create links
    const links = container.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke", "#6b7280")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.strength * 10));

    // Create nodes
    const nodes = container.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter().append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => settings.colorByConnections ? 
        connectionColorScale(d.connections) : 
        colorScale(d.group.toString())
      )
      .attr("stroke", d => d.id === selectedFileId ? "#8b5cf6" : "#374151")
      .attr("stroke-width", d => d.id === selectedFileId ? 3 : 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        onNodeClick(d.id);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add labels
    const labels = container.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .enter().append("text")
      .text(d => d.name.replace(/\.[^/.]+$/, "")) // Remove file extension
      .style("font-size", "12px")
      .style("fill", "#e5e7eb")
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", settings.showLabels ? 1 : 0);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y! + 5);
    });
  };

  const refreshGraph = () => {
    const newData = analyzeConnections(files, graphMode);
    setGraphData(newData);
  };

  const exportGraph = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "context-graph.svg";
    a.click();
    
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const newData = analyzeConnections(files, graphMode);
    setGraphData(newData);
  }, [files, settings, graphMode, selectedFileId]);

  useEffect(() => {
    renderGraph();
  }, [graphData, selectedFileId, settings]);

  return (
    <div className="h-full bg-gradient-card rounded-lg border border-border shadow-md flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">Context Graph</h3>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Labels</label>
                <Switch
                  checked={settings.showLabels}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, showLabels: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Color by Connections</label>
                <Switch
                  checked={settings.colorByConnections}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, colorByConnections: checked }))}
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
              Create some files with content to see connections in the graph
            </p>
            <Button onClick={refreshGraph} variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" />
              Analyze Files
            </Button>
          </div>
        ) : (
          <div className="h-full bg-background/30 rounded border border-border/50 overflow-hidden">
            <svg ref={svgRef} className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextGraph;
