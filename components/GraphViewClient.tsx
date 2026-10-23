'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Network,
  ArrowRight,
  Sparkles,
  BookOpen,
  Filter,
  Eye,
  ExternalLink,
  Tag,
  Star,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Plus,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote } from '@/types/note';

interface GraphViewClientProps {
  notes: ReadingNote[];
}

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  topic: string;
  status: string;
  rating?: number;
  type: string;
  summary?: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  relationship: string;
  notes?: string;
}

const TOPIC_COLORS = [
  '#0284c7', // Sky blue
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export default function GraphViewClient({ notes }: GraphViewClientProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedNode, setSelectedNode] = useState<ReadingNote | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulationRef = useRef<number | null>(null);
  const nodesStateRef = useRef<GraphNode[]>([]);
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Distinct topics and topic color mapping
  const allTopics = useMemo(() => {
    return Array.from(new Set(notes.map((n) => n.topic || 'General')));
  }, [notes]);

  const topicColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allTopics.forEach((topic, idx) => {
      map[topic] = TOPIC_COLORS[idx % TOPIC_COLORS.length];
    });
    return map;
  }, [allTopics]);

  // Filtered notes based on category cluster filter
  const visibleNotes = useMemo(() => {
    if (selectedTopic === 'All') return notes;
    return notes.filter((n) => n.topic === selectedTopic);
  }, [notes, selectedTopic]);

  const visibleNoteIds = useMemo(() => new Set(visibleNotes.map((n) => n.id)), [visibleNotes]);

  // Extract graph links
  const links: GraphLink[] = useMemo(() => {
    const list: GraphLink[] = [];
    visibleNotes.forEach((sourceNote) => {
      sourceNote.links?.forEach((link) => {
        if (visibleNoteIds.has(link.id)) {
          list.push({
            source: sourceNote.id,
            target: link.id,
            relationship: link.relationship,
            notes: link.notes,
          });
        }
      });
    });
    return list;
  }, [visibleNotes, visibleNoteIds]);

  // Initialize or update node positions with cluster centers
  useEffect(() => {
    const width = 800;
    const height = 500;

    // Cluster centers for each topic
    const topicCenters: Record<string, { cx: number; cy: number }> = {};
    const clusterCount = allTopics.length || 1;
    allTopics.forEach((t, i) => {
      const angle = (i / clusterCount) * 2 * Math.PI;
      const radius = 180;
      topicCenters[t] = {
        cx: width / 2 + Math.cos(angle) * radius,
        cy: height / 2 + Math.sin(angle) * radius,
      };
    });

    const prevNodesMap = new Map(nodesStateRef.current.map((n) => [n.id, n]));

    const newNodes: GraphNode[] = visibleNotes.map((note, index) => {
      const existing = prevNodesMap.get(note.id);
      const center = topicCenters[note.topic] || { cx: width / 2, cy: height / 2 };

      if (existing) {
        return {
          ...existing,
          title: note.title,
          topic: note.topic,
          status: note.status,
          summary: note.summary,
          tags: note.tags || [],
          color: topicColorMap[note.topic] || '#0284c7',
        };
      }

      const offsetAngle = Math.random() * 2 * Math.PI;
      const offsetR = Math.random() * 60;

      return {
        id: note.id,
        slug: note.slug,
        title: note.title,
        topic: note.topic,
        status: note.status,
        rating: note.rating,
        type: note.type,
        summary: note.summary,
        tags: note.tags || [],
        x: center.cx + Math.cos(offsetAngle) * offsetR,
        y: center.cy + Math.sin(offsetAngle) * offsetR,
        vx: 0,
        vy: 0,
        radius: 24,
        color: topicColorMap[note.topic] || '#0284c7',
      };
    });

    nodesStateRef.current = newNodes;
  }, [visibleNotes, allTopics, topicColorMap]);

  // Force simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const nodes = nodesStateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Center attraction and cluster grouping
      const topicCenters: Record<string, { cx: number; cy: number }> = {};
      const clusterCount = allTopics.length || 1;
      allTopics.forEach((t, i) => {
        const angle = (i / clusterCount) * 2 * Math.PI;
        const radius = 150;
        topicCenters[t] = {
          cx: width / 2 + Math.cos(angle) * radius,
          cy: height / 2 + Math.sin(angle) * radius,
        };
      });

      nodes.forEach((node) => {
        if (node === draggedNodeRef.current) return;
        const center = topicCenters[node.topic] || { cx: width / 2, cy: height / 2 };
        node.vx += (center.cx - node.x) * 0.002;
        node.vy += (center.cy - node.y) * 0.002;
      });

      // 2. Node-node repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.radius + n2.radius + 50;

          if (dist < minDist * 2) {
            const force = (minDist * 2 - dist) / dist * 0.04;
            if (n1 !== draggedNodeRef.current) {
              n1.vx -= dx * force;
              n1.vy -= dy * force;
            }
            if (n2 !== draggedNodeRef.current) {
              n2.vx += dx * force;
              n2.vy += dy * force;
            }
          }
        }
      }

      // 3. Link spring attraction
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      links.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 140;
          const force = (dist - targetDist) * 0.015;

          if (source !== draggedNodeRef.current) {
            source.vx += (dx / dist) * force;
            source.vy += (dy / dist) * force;
          }
          if (target !== draggedNodeRef.current) {
            target.vx -= (dx / dist) * force;
            target.vy -= (dy / dist) * force;
          }
        }
      });

      // 4. Update positions with damping
      nodes.forEach((node) => {
        if (node === draggedNodeRef.current) return;
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.85;
        node.vy *= 0.85;

        // Keep inside bounds
        const padding = 40;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });

      // 5. Render Canvas
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw cluster background bubbles
      allTopics.forEach((topic) => {
        const topicNodes = nodes.filter((n) => n.topic === topic);
        if (topicNodes.length === 0) return;
        const avgX = topicNodes.reduce((acc, n) => acc + n.x, 0) / topicNodes.length;
        const avgY = topicNodes.reduce((acc, n) => acc + n.y, 0) / topicNodes.length;

        ctx.beginPath();
        ctx.arc(avgX, avgY, 110, 0, Math.PI * 2);
        ctx.fillStyle = `${topicColorMap[topic]}0d`; // 5% opacity
        ctx.fill();
        ctx.strokeStyle = `${topicColorMap[topic]}20`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cluster label
        ctx.fillStyle = topicColorMap[topic];
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(topic.toUpperCase(), avgX, avgY - 118);
      });

      // Draw Links
      links.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;

        const isHighlighted =
          hoveredNodeId === source.id ||
          hoveredNodeId === target.id ||
          selectedNode?.id === source.id ||
          selectedNode?.id === target.id;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isHighlighted ? '#3b82f6' : '#94a3b8';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowX = target.x - Math.cos(angle) * (target.radius + 6);
        const arrowY = target.y - Math.sin(angle) * (target.radius + 6);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - Math.cos(angle - Math.PI / 6) * 8,
          arrowY - Math.sin(angle - Math.PI / 6) * 8
        );
        ctx.lineTo(
          arrowX - Math.cos(angle + Math.PI / 6) * 8,
          arrowY - Math.sin(angle + Math.PI / 6) * 8
        );
        ctx.fillStyle = isHighlighted ? '#3b82f6' : '#94a3b8';
        ctx.fill();

        // Relationship badge text
        if (link.relationship) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.fillStyle = isHighlighted ? '#1e293b' : '#64748b';
          ctx.font = '9px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(link.relationship.replace(/_/g, ' '), midX, midY - 4);
        }
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNodeId === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Node circle glow / highlight ring
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}30`;
          ctx.fill();
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Node inner icon / initial
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.title.charAt(0).toUpperCase(), node.x, node.y);

        // Node Title label under the circle
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
        ctx.textBaseline = 'top';

        // Truncate label if too long
        let displayTitle = node.title;
        if (displayTitle.length > 22) {
          displayTitle = displayTitle.slice(0, 20) + '...';
        }
        ctx.fillText(displayTitle, node.x, node.y + node.radius + 6);
      });

      ctx.restore();

      simulationRef.current = requestAnimationFrame(tick);
    };

    simulationRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (simulationRef.current) {
        cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [allTopics, links, topicColorMap, hoveredNodeId, selectedNode, zoom, pan]);

  // Helper to map mouse coordinates to virtual canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const clickedNode = nodesStateRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      const targetNote = notes.find((n) => n.id === clickedNode.id) || null;
      setSelectedNode(targetNote);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const { x, y } = getCanvasCoords(e);
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const hovered = nodesStateRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    setHoveredNodeId(hovered ? hovered.id : null);
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    setIsDraggingCanvas(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
              <Network className="w-4 h-4" />
              <span>Zettelkasten Knowledge Graph</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Visual Knowledge Graph
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Interactive network of personal readings. Click any node to inspect note details and connected linkages.
            </p>
          </div>

          <button
            onClick={() => setIsEditorOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reading Note</span>
          </button>
        </div>

        {/* Cluster Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Categories:
          </span>
          <button
            onClick={() => setSelectedTopic('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              selectedTopic === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Clusters ({notes.length})
          </button>
          {allTopics.map((topic) => {
            const count = notes.filter((n) => n.topic === topic).length;
            const isSelected = selectedTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: topicColorMap[topic] || '#0284c7' }}
                />
                <span>{topic} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Visual Graph + Side Inspector Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Interactive Canvas */}
          <div className="lg:col-span-2 relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden h-[540px]">
            <canvas
              ref={canvasRef}
              width={800}
              height={540}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            {/* Canvas Zoom / Pan Controls Overlay */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Helper Hint */}
            <div className="absolute top-4 left-4 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/60 dark:bg-slate-800/80 backdrop-blur-md text-white border border-white/10">
                Drag nodes to reposition · Click node to inspect
              </span>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 min-h-[540px] flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: topicColorMap[selectedNode.topic] || '#0284c7' }}
                  >
                    {selectedNode.topic}
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedNode.title}
                  </h3>
                  {selectedNode.sources && selectedNode.sources.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      By <strong className="text-slate-700 dark:text-slate-300">{selectedNode.sources.map((s) => s.author).filter(Boolean).join(', ') || selectedNode.sources[0].title}</strong>
                      {selectedNode.sources[0]?.published_year ? ` (${selectedNode.sources[0].published_year})` : ''}
                      {selectedNode.sources.length > 1 ? ` +${selectedNode.sources.length - 1} more` : ''}
                    </p>
                  )}
                </div>

                {selectedNode.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic leading-relaxed">
                    &ldquo;{selectedNode.summary}&rdquo;
                  </p>
                )}

                {/* Connected Readings List */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Connected Readings:
                  </h4>
                  {(!selectedNode.links || selectedNode.links.length === 0) &&
                  (!selectedNode.backlinks || selectedNode.backlinks.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No connected links for this note.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {selectedNode.links?.map((link, idx) => {
                        const target = notes.find((n) => n.id === link.id);
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 text-xs flex items-center justify-between"
                          >
                            <span className="font-semibold text-brand-700 dark:text-brand-300 truncate max-w-[140px]">
                              {target?.title || link.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200">
                              {link.relationship}
                            </span>
                          </div>
                        );
                      })}

                      {selectedNode.backlinks?.map((backlink, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-indigo-700 dark:text-indigo-300 truncate max-w-[140px]">
                            {backlink.sourceNoteTitle}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                            {backlink.relationship}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/notes/${selectedNode.slug}/`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    <span>Read Full Note & Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3 my-auto">
                <Network className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Select a Reading Node
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click on any node in the knowledge graph to view its summary, takeaways, and link relationships.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Personal Reading Notes & Knowledge Graph · Built with Next.js, GitHub Pages & GitHub Actions</p>
      </footer>

      <NoteEditorModal
        isOpen={isEditorOpen}
        allAvailableNotes={notes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
