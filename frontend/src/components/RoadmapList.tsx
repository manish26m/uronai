"use client";

import { CheckCircle2, PlayCircle, Lock, AlertCircle, Sparkles, Calendar } from "lucide-react";

interface RoadmapNode {
  id: string;
  title: string;
  status?: string;
  description?: string;
  isRoot?: boolean;
}

interface RoadmapListProps {
  nodes: RoadmapNode[];
  onNodeClick?: (node: RoadmapNode) => void;
  activeNodeId?: string;
  variant?: "vertical" | "horizontal";
}

export default function RoadmapList({ nodes, onNodeClick, activeNodeId, variant = "vertical" }: RoadmapListProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 p-8 text-center">
        <Sparkles size={32} className="mb-3 text-gray-700" />
        <p className="text-sm">No modules yet. Generate a roadmap first.</p>
      </div>
    );
  }

  // Extract week/day group from title prefix (e.g. "Week 1: ...", "Day 3: ...")
  const getGroupLabel = (title: string): string | null => {
    const match = title.match(/^(Week\s*\d+|Day\s*\d+|Phase\s*\d+|Module\s*\d+)[\s:–-]/i);
    return match ? match[1] : null;
  };

  if (variant === "horizontal") {
    let lastGroup: string | null = null;
    return (
      <div className="flex items-center gap-4 py-4 px-4 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800 bg-gray-950/40 rounded-2xl border border-gray-800/30 shadow-inner">
        {nodes.map((node, i) => {
          const status = node.status || "locked";
          const isActive = node.id === activeNodeId;
          const group = getGroupLabel(node.title);
          const isNewGroup = group && group !== lastGroup;
          if (group) lastGroup = group;

          let colorClass = "border-gray-800 text-gray-500 bg-gray-900/40";
          let Icon = Lock;
          if (status === "completed") { colorClass = "border-green-500/40 text-green-400 bg-green-500/5"; Icon = CheckCircle2; }
          else if (status === "active") { colorClass = "border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]"; Icon = PlayCircle; }
          else if (status === "failed") { colorClass = "border-red-500/40 text-red-400 bg-red-500/5"; Icon = AlertCircle; }

          return (
            <div key={node.id} className="flex items-center shrink-0">
               {isNewGroup && i > 0 && <div className="h-10 w-px bg-gray-800 mx-4" />}
               <button
                onClick={() => status !== "locked" && onNodeClick?.(node)}
                className={`Relative flex flex-col items-center gap-2 group transition-all ${status === "locked" ? "opacity-40" : "hover:scale-105 cursor-pointer"}`}
              >
                {isNewGroup && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-500 uppercase tracking-tighter whitespace-nowrap">{group}</span>}
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${colorClass} ${isActive ? "border-red-400 scale-110" : ""}`}>
                  <Icon size={24} />
                </div>
                <span className={`text-[10px] font-bold max-w-[80px] text-center line-clamp-1 ${isActive ? "text-white" : "text-gray-500"}`}>{node.title.replace(/.*[:–-]\s*/, "")}</span>
              </button>
              {i < nodes.length - 1 && <div className={`w-8 h-0.5 ${status === "completed" ? "bg-green-500/20" : "bg-gray-800"}`} />}
            </div>
          );
        })}
      </div>
    );
  }

  // Find unique group labels to determine where to show dividers
  let lastGroup: string | null = "__none__";

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
      {nodes.map((node, i) => {
        const status = node.status || "locked";
        const isActive = node.id === activeNodeId;
        const group = getGroupLabel(node.title);
        const showDivider = group && group !== lastGroup;
        if (group) lastGroup = group;

        let borderColor = "border-gray-800 hover:border-gray-700";
        let dotColor = "bg-gray-700";
        let Icon = Lock;
        let iconColor = "text-gray-600";

        if (status === "completed") {
          borderColor = "border-green-500/30 hover:border-green-500/50";
          dotColor = "bg-green-500";
          Icon = CheckCircle2;
          iconColor = "text-green-400";
        } else if (status === "active") {
          borderColor = "border-red-500/50 hover:border-red-400";
          dotColor = "bg-red-500 animate-pulse";
          Icon = PlayCircle;
          iconColor = "text-red-400";
        } else if (status === "failed") {
          borderColor = "border-red-500/30 hover:border-red-500/50";
          dotColor = "bg-red-500";
          Icon = AlertCircle;
          iconColor = "text-red-400";
        }

        if (node.isRoot && status === "active") {
          Icon = Sparkles;
        }

        const isClickable = status !== "locked";

        return (
          <div key={node.id}>
            {/* Week/Day divider label */}
            {showDivider && (
              <div className="flex items-center gap-2 mt-4 mb-2 px-1">
                <Calendar size={11} className="text-amber-400 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400">{group}</span>
                <div className="flex-1 h-px bg-amber-500/15" />
              </div>
            )}

            {/* Connector line (except before first) */}
            {i > 0 && (
              <div className={`h-3 w-0.5 mx-[19px] ${
                nodes[i - 1]?.status === "completed" ? "bg-green-500/40" :
                nodes[i - 1]?.status === "active" ? "bg-red-500/40" : "bg-gray-800"
              }`} />
            )}

            {/* Node row */}
            <button
              onClick={() => isClickable && onNodeClick && onNodeClick(node)}
              disabled={!isClickable}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${borderColor} ${
                isActive ? "bg-red-500/8 border-red-500/60 shadow-sm shadow-red-900/20" : "bg-gray-950/60"
              } ${isClickable ? "cursor-pointer hover:bg-gray-900/60" : "cursor-default opacity-60"}`}
            >
              {/* Status dot */}
              <div className="flex flex-col items-center mt-0.5 flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={11} className={`${iconColor} flex-shrink-0`} />
                  <span className={`text-xs font-bold truncate ${
                    status === "completed" ? "text-green-300" :
                    status === "active" ? "text-red-200" :
                    status === "failed" ? "text-red-300" : "text-gray-500"
                  }`}>
                    {node.title}
                  </span>
                </div>
                {node.description && (
                  <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">{node.description}</p>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
