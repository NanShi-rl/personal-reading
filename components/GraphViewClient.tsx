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
import { getMergedNotes, onPendingChangesUpdated } from '@/lib/localStore';
import { buildTopicColorMap } from '@/lib/topicColor';

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

export default function GraphViewClient({ notes: initialNotes }: GraphViewClientProps) {
  const [notes, setNotes] = useState<ReadingNote[]>(initialNotes);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedNode, setSelectedNode] = useState<ReadingNote | null>(null);

  useEffect(() => {
    const updateLocalState = () => {
      setNotes(getMergedNotes(initialNotes));
    };
    updateLocalState();
    const unsubscribe = onPendingChangesUpdated(updateLocalState);
    return () => unsubscribe();
  }, [initialNotes]);
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

  // Same topic -> colour mapping as the folders on the other pages
  const topicPalette = useMemo(() => buildTopicColorMap(allTopics), [allTopics]);
  const topicColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allTopics.forEach((topic) => {
      map[topic] = topicPalette[topic].bg;
    });
    return map;
  }, [allTopics, topicPalette]);

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
          color: topicColorMap[note.topic] || '#1e4bd7',
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
        color: topicColorMap[note.topic] || '#1e4bd7',
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
        ctx.strokeStyle = isHighlighted ? '#ffffff' : '#5a5955';
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
        ctx.fillStyle = isHighlighted ? '#ffffff' : '#5a5955';
        ctx.fill();

        // Relationship badge text
        if (link.relationship) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.fillStyle = isHighlighted ? '#ffffff' : '#8f8d88';
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
        ctx.strokeStyle = '#191919';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Node inner icon / initial
        ctx.fillStyle = topicPalette[node.topic]?.ink || '#ffffff';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.title.charAt(0).toUpperCase(), node.x, node.y);

        // Node Title label under the circle
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#b4b2ac';
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
  }, [allTopics, links, topicColorMap, topicPalette, hoveredNodeId, selectedNode, zoom, pan]);

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
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex-1 space-y-8">
        {/* Header */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="display-title text-5xl sm:text-7xl">Graph</h1>
          <p className="mt-5 text-sm sm:text-base text-slate-400 leading-relaxed">
            How your readings connect. Colours match the folders; click a node to inspect it, drag to rearrange.
          </p>
        </section>

        {/* Topic filter: folder-coloured tabs */}
        <div className="flex items-end gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedTopic('All')}
            className={`folder-tab shrink-0 h-10 text-sm font-semibold whitespace-nowrap transition-opacity ${
              selectedTopic === 'All' ? 'bg-white text-black' : 'bg-white/20 text-white opacity-70 hover:opacity-100'
            }`}
          >
            All ({notes.length})
          </button>
          {allTopics.map((topic) => {
            const count = notes.filter((n) => n.topic === topic).length;
            const isSelected = selectedTopic === topic;
            const c = topicPalette[topic];
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`folder-tab shrink-0 h-10 text-sm font-semibold whitespace-nowrap transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-100'
                }`}
                style={{ background: c.bg, color: c.ink }}
              >
                {topic} ({count})
              </button>
            );
          })}
        </div>

        {/* Canvas + inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start -mt-6">
          <div className="lg:col-span-2 relative rounded-lg bg-slate-900 border border-white/10 overflow-hidden h-[540px]">
            <canvas
              ref={canvasRef}
              width={800}
              height={540}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4 pointer-events-none">
              <span className="px-2.5 py-1 rounded text-[11px] bg-slate-950/80 text-slate-300 border border-white/10">
                Drag nodes · Click to inspect
              </span>
            </div>
          </div>

          {/* Node inspector: a coloured folder panel when a node is selected */}
          <div
            className="rounded-lg border border-white/10 min-h-[540px] flex flex-col overflow-hidden"
            style={
              selectedNode
                ? {
                    background: topicColorMap[selectedNode.topic] || '#1e4bd7',
                    color: topicPalette[selectedNode.topic]?.ink || '#ffffff',
                    borderColor: 'transparent',
                  }
                : undefined
            }
          >
            {selectedNode ? (
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                  <span className="font-semibold">{selectedNode.topic}</span>
                  <button onClick={() => setSelectedNode(null)} className="opacity-80 hover:opacity-100" title="Close">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold leading-snug">{selectedNode.title}</h3>
                  {selectedNode.sources && selectedNode.sources.length > 0 && (
                    <p className="text-xs mt-1 opacity-90">
                      {selectedNode.sources.map((s) => s.author).filter(Boolean).join(', ') || selectedNode.sources[0].title}
                      {selectedNode.sources[0]?.published_year ? ` (${selectedNode.sources[0].published_year})` : ''}
                      {selectedNode.sources.length > 1 ? ` +${selectedNode.sources.length - 1} more` : ''}
                    </p>
                  )}
                </div>

                {selectedNode.summary && <p className="text-xs leading-relaxed opacity-95">{selectedNode.summary}</p>}

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">Connected readings</h4>
                  {(!selectedNode.links || selectedNode.links.length === 0) &&
                  (!selectedNode.backlinks || selectedNode.backlinks.length === 0) ? (
                    <p className="text-xs opacity-80">No connected links for this note.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {selectedNode.links?.map((link, idx) => {
                        const target = notes.find((n) => n.id === link.id);
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-950 text-white text-xs flex items-center justify-between gap-2"
                          >
                            <span className="font-semibold truncate">{target?.title || link.id}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
                              → {link.relationship.replace(/_/g, ' ')}
                            </span>
                          </div>
                        );
                      })}

                      {selectedNode.backlinks?.map((backlink, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-slate-950 text-white text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold truncate">{backlink.sourceNoteTitle}</span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
                            ← {backlink.relationship.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  <Link
                    href={`/notes/${selectedNode.slug}/`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-slate-950 text-white hover:bg-black font-semibold text-xs transition-colors"
                  >
                    <span>Read full note</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3 my-auto px-6">
                <Network className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-200">Select a reading node</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click any node to see its summary and link relationships.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>Personal Reading Notes &amp; Knowledge Graph · Built with Next.js, GitHub Pages &amp; GitHub Actions</p>
      </footer>

      <NoteEditorModal
        isOpen={isEditorOpen}
        allAvailableNotes={notes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
