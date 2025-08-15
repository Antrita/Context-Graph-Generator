declare global {
  interface Window {
    THREE: any;
  }
}

declare module '3d-force-graph' {
  interface ForceGraph3DInstance {
    (element: HTMLElement): ForceGraph3DInstance;
    graphData(data?: { nodes: any[]; links: any[] }): ForceGraph3DInstance | { nodes: any[]; links: any[] };
    nodeId(accessor?: string | ((node: any) => string)): ForceGraph3DInstance | string | ((node: any) => string);
    nodeLabel(accessor?: string | ((node: any) => string)): ForceGraph3DInstance | string | ((node: any) => string);
    nodeColor(accessor?: string | ((node: any) => string)): ForceGraph3DInstance | string | ((node: any) => string);
    nodeOpacity(opacity?: number): ForceGraph3DInstance | number;
    nodeResolution(resolution?: number): ForceGraph3DInstance | number;
    nodeVal(accessor?: string | number | ((node: any) => number)): ForceGraph3DInstance | string | number | ((node: any) => number);
    linkColor(accessor?: string | ((link: any) => string)): ForceGraph3DInstance | string | ((link: any) => string);
    linkOpacity(opacity?: number): ForceGraph3DInstance | number;
    linkWidth(accessor?: string | number | ((link: any) => number)): ForceGraph3DInstance | string | number | ((link: any) => number);
    linkDirectionalParticles(particles?: number | ((link: any) => number)): ForceGraph3DInstance | number | ((link: any) => number);
    linkDirectionalParticleSpeed(speed?: number | ((link: any) => number)): ForceGraph3DInstance | number | ((link: any) => number);
    linkDirectionalParticleColor(accessor?: string | ((link: any) => string)): ForceGraph3DInstance | string | ((link: any) => string);
    onNodeClick(callback?: (node: any, event: MouseEvent) => void): ForceGraph3DInstance | ((node: any, event: MouseEvent) => void);
    onNodeHover(callback?: (node: any | null, prevNode: any | null) => void): ForceGraph3DInstance | ((node: any | null, prevNode: any | null) => void);
    enableNodeDrag(enable?: boolean): ForceGraph3DInstance | boolean;
    d3Force(forceName: string): any;
    backgroundColor(color?: string): ForceGraph3DInstance | string;
    controls(): any;
    cameraPosition(position?: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, ms?: number): ForceGraph3DInstance | { x: number; y: number; z: number };
    width(width?: number): ForceGraph3DInstance | number;
    height(height?: number): ForceGraph3DInstance | number;
    refresh(): ForceGraph3DInstance;
  }

  interface ForceGraph3DOptions {
    extraRenderers?: any[];
  }

  function ForceGraph3D(options?: ForceGraph3DOptions): ForceGraph3DInstance;
  export default ForceGraph3D;
}

export {};
