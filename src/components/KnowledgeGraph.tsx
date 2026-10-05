"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  NODE_COLORS,
  NODE_TYPE_LABELS,
  RELATIONS,
  graphEdges,
  graphNodes,
  type GraphNode,
  type NodeType,
  type Relation,
} from "../data/graph";

type Filter = "All" | Relation;

const FILTERS: Filter[] = ["All", ...RELATIONS];

/** Which node types stay on screen for a given filter. Hiding the rest is what
 *  keeps ~50 nodes readable — showing everything at once is a hairball. */
const VISIBLE_TYPES: Record<Filter, NodeType[]> = {
  All: ["method", "paradigm", "task", "representation"],
  Paradigm: ["method", "paradigm"],
  Task: ["method", "task"],
  Representation: ["method", "representation"],
};

const RADIUS: Record<NodeType, number> = {
  method: 6,
  paradigm: 10,
  task: 8,
  representation: 8,
};

export default function KnowledgeGraph({
  onSelect,
  height = 560,
}: {
  onSelect?: (node: { label: string; type: NodeType; slug?: string }) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positions = useRef(graphNodes.map((node) => ({ ...node })));
  const [filter, setFilter] = useState<Filter>("All");
  const [focus, setFocus] = useState("Drag a node to rearrange, click a method to open it");

  // Kept in a ref so the animation loop can read the latest handler without
  // being torn down and restarted on every parent render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const counts = useMemo(() => {
    const visible = VISIBLE_TYPES[filter];
    return {
      nodes: graphNodes.filter((node) => visible.includes(node.type)).length,
      edges: graphEdges.filter((edge) => filter === "All" || edge.relation === filter).length,
    };
  }, [filter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const visibleTypes = VISIBLE_TYPES[filter];
    const isVisible = (node: GraphNode) => visibleTypes.includes(node.type);
    const nodes = positions.current.filter(isVisible);
    const edges = graphEdges.filter((edge) => filter === "All" || edge.relation === filter);
    const byId = new Map(positions.current.map((node) => [node.id, node]));

    // Adjacency, so hovering a node can highlight exactly its neighbours.
    const neighbours = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (!neighbours.has(edge.from)) neighbours.set(edge.from, new Set());
      if (!neighbours.has(edge.to)) neighbours.set(edge.to, new Set());
      neighbours.get(edge.from)!.add(edge.to);
      neighbours.get(edge.to)!.add(edge.from);
    }

    let hovered: GraphNode | null = null;
    let dragging: GraphNode | null = null;
    let animationFrame = 0;
    const velocity = new Map(nodes.map((node) => [node.id, { x: 0, y: 0 }]));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isLit = (nodeId: string) =>
      !hovered || hovered.id === nodeId || neighbours.get(hovered.id)?.has(nodeId);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const targetWidth = Math.round(rect.width * ratio);
      const targetHeight = Math.round(rect.height * ratio);
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      for (const edge of edges) {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b) continue;
        const lit = hovered ? hovered.id === a.id || hovered.id === b.id : false;
        const dimmed = hovered && !lit;
        context.beginPath();
        context.moveTo(a.x * rect.width, a.y * rect.height);
        const mx = ((a.x + b.x) * rect.width) / 2;
        const my = ((a.y + b.y) * rect.height) / 2 - 10;
        context.quadraticCurveTo(mx, my, b.x * rect.width, b.y * rect.height);
        context.strokeStyle = lit
          ? "rgba(83,120,196,.88)"
          : dimmed
            ? "rgba(103,119,154,.07)"
            : "rgba(103,119,154,.2)";
        context.lineWidth = lit ? 1.6 : 1;
        context.stroke();
      }

      for (const node of nodes) {
        const x = node.x * rect.width;
        const y = node.y * rect.height;
        const active = hovered?.id === node.id;
        const lit = isLit(node.id);
        const radius = RADIUS[node.type];
        context.globalAlpha = lit ? 1 : 0.25;

        context.beginPath();
        context.arc(x, y, active ? radius + 3 : radius, 0, Math.PI * 2);
        context.fillStyle = NODE_COLORS[node.type];
        context.fill();

        if (active) {
          context.beginPath();
          context.arc(x, y, radius + 7, 0, Math.PI * 2);
          context.strokeStyle = NODE_COLORS[node.type];
          context.lineWidth = 1;
          context.stroke();
        }

        const isHub = node.type !== "method";
        context.fillStyle = active ? "#17233d" : isHub ? "#263555" : "#53617d";
        context.font = `${isHub ? 650 : 500} ${isHub ? 13 : 12}px var(--font-geist-sans), sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "top";
        // Nudge labels back inside the canvas instead of letting nodes near the
        // edge render half a word off-screen.
        const half = context.measureText(node.label).width / 2;
        const labelX = Math.max(half + 4, Math.min(rect.width - half - 4, x));
        context.fillText(node.label, labelX, y + radius + 6);
        context.globalAlpha = 1;
      }
    };

    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
    };

    const hit = (event: PointerEvent) => {
      const p = locate(event);
      let closest: GraphNode | null = null;
      let closestDistance = 18;
      for (const node of nodes) {
        const distance = Math.hypot(node.x * p.rect.width - p.x, node.y * p.rect.height - p.y);
        if (distance < closestDistance) {
          closest = node;
          closestDistance = distance;
        }
      }
      return closest;
    };

    const onMove = (event: PointerEvent) => {
      const p = locate(event);
      if (dragging) {
        dragging.x = Math.max(0.03, Math.min(0.97, p.x / p.rect.width));
        dragging.y = Math.max(0.05, Math.min(0.93, p.y / p.rect.height));
      }
      hovered = hit(event);
      canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "default";
      draw();
    };

    const onDown = (event: PointerEvent) => {
      dragging = hit(event);
      if (dragging) canvas.setPointerCapture(event.pointerId);
    };

    const onUp = (event: PointerEvent) => {
      const node = hit(event) || dragging;
      dragging = null;
      if (node) {
        setFocus(`${node.label} — ${NODE_TYPE_LABELS[node.type]}`);
        onSelectRef.current?.({ label: node.label, type: node.type, slug: node.slug });
      }
      draw();
    };

    const onLeave = () => {
      hovered = null;
      draw();
    };

    const simulate = () => {
      if (!reduceMotion) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distanceSquared = Math.max(dx * dx + dy * dy, 0.0016);
            const distance = Math.sqrt(distanceSquared);
            const force = 0.0000035 / distanceSquared;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            velocity.get(a.id)!.x -= fx;
            velocity.get(a.id)!.y -= fy;
            velocity.get(b.id)!.x += fx;
            velocity.get(b.id)!.y += fy;
          }
        }
        for (const edge of edges) {
          const a = byId.get(edge.from);
          const b = byId.get(edge.to);
          if (!a || !b || !velocity.has(a.id) || !velocity.has(b.id)) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(Math.hypot(dx, dy), 0.001);
          const force = (distance - 0.16) * 0.0007;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          velocity.get(a.id)!.x += fx;
          velocity.get(a.id)!.y += fy;
          velocity.get(b.id)!.x -= fx;
          velocity.get(b.id)!.y -= fy;
        }
        for (const node of nodes) {
          const speed = velocity.get(node.id)!;
          const anchor = graphNodes.find((item) => item.id === node.id)!;
          const anchorStrength = node.type === "method" ? 0.00004 : 0.00002;
          speed.x += (anchor.x - node.x) * anchorStrength;
          speed.y += (anchor.y - node.y) * anchorStrength;
          speed.x *= 0.9;
          speed.y *= 0.9;
          if (dragging?.id === node.id) {
            speed.x = 0;
            speed.y = 0;
          } else {
            node.x = Math.max(0.06, Math.min(0.94, node.x + speed.x));
            node.y = Math.max(0.06, Math.min(0.9, node.y + speed.y));
          }
        }
      }
      draw();
      animationFrame = requestAnimationFrame(simulate);
    };

    const onResize = () => draw();

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    simulate();

    return () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [filter]);

  return (
    <div className="knowledge-graph">
      <div className="graph-toolbar">
        <div>
          <span className="live-dot" /> METHOD RELATION GRAPH
          <small>
            {counts.nodes} nodes · {counts.edges} relations
          </small>
        </div>
        <div>
          {FILTERS.map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        // A custom property rather than `height` directly, so the mobile
        // media query can still shrink it — an inline height could not be
        // overridden by the stylesheet.
        style={{ "--graph-height": `${height}px` } as React.CSSProperties}
        role="img"
        aria-label="Relation graph connecting molecular generation methods to their generative paradigm, generation task and molecular representation"
      />
      <div className="graph-foot">
        <span>{focus}</span>
        <div>
          <i className="method-key" />
          Method
          <i className="family-key" />
          Paradigm
          <i className="task-key" />
          Task
          <i className="data-key" />
          Representation
        </div>
      </div>
    </div>
  );
}
