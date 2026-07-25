"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeProps,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Search, Edit3, User, Activity } from "lucide-react";

// ---------------------------------------------------------
// Custom Premium Node Types
// ---------------------------------------------------------
type AgentNodeData = {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  model?: string;
  badgeColor?: string;
  description: string;
  glowColor: string;
  handleColor: string;
  isInput?: boolean;
  isOutput?: boolean;
};

type AgentNodeType = Node<AgentNodeData, "agentNode">;

const AgentNode = ({ data, isConnectable }: NodeProps<AgentNodeType>) => {
  return (
    <div className="relative group min-w-[240px]">
      {/* Outer Glow */}
      <div className={`absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 ${data.glowColor}`} />
      
      {/* Node Content */}
      <div className="relative flex flex-col p-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl transition-all duration-300">
        
        {/* Handles */}
        {!data.isInput && <Handle type="target" position={Position.Left} isConnectable={isConnectable} className={`w-3 h-3 ${data.handleColor} border-2 border-background`} />}
        {!data.isOutput && <Handle type="source" position={Position.Right} isConnectable={isConnectable} className={`w-3 h-3 ${data.handleColor} border-2 border-background`} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-muted ${data.iconColor}`}>
              {data.icon}
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">{data.title}</span>
          </div>
          {data.model && (
            <Badge variant="outline" className={`text-[10px] font-mono border-border/50 ${data.badgeColor}`}>
              {data.model}
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
            {data.description}
          </p>
        </div>

        {/* Telemetry Indicator (Decorative) */}
        {!data.isInput && (
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
             <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 uppercase">
               <Activity className="h-3 w-3" /> Tracing Active
             </div>
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
};

// ---------------------------------------------------------
// Initial Topology Data
// ---------------------------------------------------------
const initialNodes = [
  {
    id: "1",
    type: "agentNode",
    position: { x: 50, y: 150 },
    data: { 
      title: "Customer Request", 
      icon: <User className="w-4 h-4" />,
      iconColor: "text-blue-500",
      description: "Initial prompt from user interface.",
      isInput: true,
      handleColor: "bg-blue-500",
      glowColor: "bg-blue-500"
    },
  },
  {
    id: "2",
    type: "agentNode",
    position: { x: 380, y: 150 },
    data: { 
      title: "Planner Agent",
      model: "Gemini 2.5 Flash",
      icon: <BrainCircuit className="w-4 h-4" />,
      iconColor: "text-indigo-500",
      badgeColor: "text-indigo-400 bg-indigo-500/5",
      description: "Breaks down task into research brief.",
      handleColor: "bg-indigo-500",
      glowColor: "bg-indigo-500"
    },
  },
  {
    id: "3",
    type: "agentNode",
    position: { x: 710, y: 150 },
    data: { 
      title: "Researcher Agent",
      model: "Gemini 2.5 Flash",
      icon: <Search className="w-4 h-4" />,
      iconColor: "text-rose-500",
      badgeColor: "text-rose-400 bg-rose-500/5",
      description: "Executes tools and gathers context.",
      handleColor: "bg-rose-500",
      glowColor: "bg-rose-500"
    },
  },
  {
    id: "4",
    type: "agentNode",
    position: { x: 1040, y: 150 },
    data: { 
      title: "Writer Agent",
      model: "Gemini 2.5 Flash",
      icon: <Edit3 className="w-4 h-4" />,
      iconColor: "text-emerald-500",
      badgeColor: "text-emerald-400 bg-emerald-500/5",
      description: "Drafts final article from context.",
      isOutput: true,
      handleColor: "bg-emerald-500",
      glowColor: "bg-emerald-500"
    },
  },
];

const initialEdges = [
  { 
    id: "e1-2", 
    source: "1", 
    target: "2", 
    animated: true, 
    style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 } 
  },
  { 
    id: "e2-3", 
    source: "2", 
    target: "3", 
    animated: true, 
    label: "Handoff: Task Brief", 
    labelStyle: { fill: "hsl(var(--foreground))", fontWeight: 700, fontSize: 12 },
    labelBgStyle: { fill: "hsl(var(--background))", stroke: "hsl(var(--border))" },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#6366F1", strokeWidth: 2 } 
  },
  { 
    id: "e3-4", 
    source: "3", 
    target: "4", 
    animated: true, 
    label: "Handoff: Raw Findings", 
    labelStyle: { fill: "hsl(var(--foreground))", fontWeight: 700, fontSize: 12 },
    labelBgStyle: { fill: "hsl(var(--background))", stroke: "hsl(var(--border))" },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#F43F5E", strokeWidth: 2 } 
  },
];

export default function AgentChainPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Chain Topology</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Visualizing the multi-agent pipeline and handoff points.
        </p>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col min-h-[500px] border-border/40 shadow-xl">
        <CardHeader className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 pb-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pipeline: Research & Write</CardTitle>
              <CardDescription className="mt-1">
                This pipeline routes through 3 distinct agents. The Checker verifies semantic alignment between the handoff edges.
              </CardDescription>
            </div>
            <div className="hidden md:flex gap-2">
              <Badge variant="outline" className="text-xs bg-muted/50 border-dashed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" /> Live Telemetry
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative bg-dot-white/[0.05] bg-black">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-rose-500/5 pointer-events-none" />
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="[&_.react-flow__pane]:cursor-grab [&_.react-flow__pane:active]:cursor-grabbing"
          >
            <Controls className="bg-background/80 backdrop-blur-md border border-border text-foreground fill-foreground shadow-lg rounded-xl overflow-hidden [&>button]:border-b-border" />
            <MiniMap 
              className="bg-background/80 backdrop-blur-md border border-border shadow-lg rounded-xl overflow-hidden" 
              nodeColor="hsl(var(--muted-foreground)/0.5)" 
              maskColor="hsl(var(--background)/0.6)"
            />
            <Background gap={24} size={1.5} color="hsl(var(--muted-foreground)/0.2)" />
          </ReactFlow>
        </CardContent>
      </Card>
    </div>
  );
}
