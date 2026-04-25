import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  Handle,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import styles from "./GraphView.module.less";
type GraphViewProps = {
  nodes: Array<{
    id: string;
    data: { label: string; isStart?: boolean; isAccept?: boolean };
    position: { x: number; y: number };
    type?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
  }>;
  error?: string | null;
};

type FlowNodeData = {
  label: string;
  fullLabel: string;
  isStart?: boolean;
  isAccept?: boolean;
};

type StateLegendItem = {
  alias: string;
  fullLabel: string;
};

const NODE_SIZE = 84;
const EDGE_HANDLES = {
  target: {
    left: {
      top: "target-left-top",
      mid: "target-left-mid",
      bottom: "target-left-bottom",
    },
    right: {
      top: "target-right-top",
      mid: "target-right-mid",
      bottom: "target-right-bottom",
    },
  },
  source: {
    left: {
      top: "source-left-top",
      mid: "source-left-mid",
      bottom: "source-left-bottom",
    },
    right: {
      top: "source-right-top",
      mid: "source-right-mid",
      bottom: "source-right-bottom",
    },
  },
} as const;

type EdgeLane = keyof typeof EDGE_HANDLES.target.left;
type EdgeSide = keyof typeof EDGE_HANDLES.target;

function simpleLayout(nodes: Node<FlowNodeData>[]): Node<FlowNodeData>[] {
  const GAP_X = 160;
  const GAP_Y = 120;

  return nodes.map((node, index) => {
    return {
      ...node,
      type: "faNode",
      position: {
        x: index * GAP_X,
        y: (index % 2) * GAP_Y,
      },
    };
  });
}

function FANode({ data }: { data: FlowNodeData }) {
  return (
    <div
      className={[
        styles.faNode,
        data.isStart ? styles.startNode : "",
        data.isAccept ? styles.acceptNode : "",
      ].join(" ")}
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        position: "relative",
      }}
    >
      <Handle
        id={EDGE_HANDLES.target.left.top}
        type="target"
        position={Position.Left}
        className={[styles.edgeHandle, styles.topHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.target.left.mid}
        type="target"
        position={Position.Left}
        className={[styles.edgeHandle, styles.midHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.target.left.bottom}
        type="target"
        position={Position.Left}
        className={[styles.edgeHandle, styles.bottomHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.target.right.top}
        type="target"
        position={Position.Right}
        className={[styles.edgeHandle, styles.topHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.target.right.mid}
        type="target"
        position={Position.Right}
        className={[styles.edgeHandle, styles.midHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.target.right.bottom}
        type="target"
        position={Position.Right}
        className={[styles.edgeHandle, styles.bottomHandle].join(" ")}
        isConnectable={false}
      />

      <Handle
        id={EDGE_HANDLES.source.right.top}
        type="source"
        position={Position.Right}
        className={[styles.edgeHandle, styles.topHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.source.right.mid}
        type="source"
        position={Position.Right}
        className={[styles.edgeHandle, styles.midHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.source.right.bottom}
        type="source"
        position={Position.Right}
        className={[styles.edgeHandle, styles.bottomHandle].join(" ")}
        isConnectable={false}
      />

      <Handle
        id={EDGE_HANDLES.source.left.top}
        type="source"
        position={Position.Left}
        className={[styles.edgeHandle, styles.topHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.source.left.mid}
        type="source"
        position={Position.Left}
        className={[styles.edgeHandle, styles.midHandle].join(" ")}
        isConnectable={false}
      />
      <Handle
        id={EDGE_HANDLES.source.left.bottom}
        type="source"
        position={Position.Left}
        className={[styles.edgeHandle, styles.bottomHandle].join(" ")}
        isConnectable={false}
      />

      <Handle
        id="self-loop-target"
        type="target"
        position={Position.Top}
        className={styles.selfLoopHandle}
        isConnectable={false}
      />

      <Handle
        id="self-loop-source"
        type="source"
        position={Position.Top}
        className={styles.selfLoopHandle}
        isConnectable={false}
      />

      <div>{data.label}</div>
    </div>
  );
}

const nodeTypes = {
  faNode: FANode,
};

function getStateOrder(alias: string): number {
  const parsed = Number.parseInt(alias.replace(/^S/i, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function resolveEdgeRouting(
  source: string,
  target: string,
  sourceX: number,
  targetX: number,
  hasReverse: boolean,
  isSelfLoop: boolean,
): {
  type: Edge["type"];
  sourceHandle?: string;
  targetHandle?: string;
  pathOptions?: { borderRadius?: number; offset?: number };
} {
  if (isSelfLoop) {
    return {
      type: "default",
      sourceHandle: "self-loop-source",
      targetHandle: "self-loop-target",
    };
  }

  const sourceSide: EdgeSide = sourceX <= targetX ? "right" : "left";
  const targetSide: EdgeSide = sourceX <= targetX ? "left" : "right";

  if (!hasReverse) {
    return {
      type: "smoothstep",
      sourceHandle: EDGE_HANDLES.source[sourceSide].mid,
      targetHandle: EDGE_HANDLES.target[targetSide].mid,
      pathOptions: { borderRadius: 16, offset: 20 },
    };
  }

  const isReverseDirection = getStateOrder(source) > getStateOrder(target);
  const lane: EdgeLane = isReverseDirection ? "bottom" : "top";

  return {
    type: "smoothstep",
    sourceHandle: EDGE_HANDLES.source[sourceSide][lane],
    targetHandle: EDGE_HANDLES.target[targetSide][lane],
    pathOptions: { borderRadius: 14, offset: 28 },
  };
}

function toFlowNode(node: Node<FlowNodeData>): Node<FlowNodeData> {
  const isStart = Boolean(node.data.isStart);
  const isAccept = Boolean(node.data.isAccept);

  return {
    ...node,
    data: {
      label: node.data.label,
      fullLabel: node.data.fullLabel,
      isStart,
      isAccept,
    },
  };
}

export default function GraphView({
  nodes,
  edges,
  error = null,
}: GraphViewProps) {
  const { flowNodes, flowEdges, legend } = useMemo(() => {
    const stateMap = new Map<string, string>();
    nodes.forEach((node, index) => {
      stateMap.set(node.id, `S${index}`);
    });

    const legendItems: StateLegendItem[] = nodes.map((node, index) => ({
      alias: `S${index}`,
      fullLabel: node.data.label,
    }));

    const rawNodes: Node<FlowNodeData>[] = nodes.map((node, index) => ({
      id: `S${index}`,
      data: {
        label: `S${index}`,
        fullLabel: node.data.label,
        isStart: node.data.isStart,
        isAccept: node.data.isAccept,
      },
      position: { x: 0, y: 0 },
    }));

    const layoutedNodes = simpleLayout(rawNodes).map((node) =>
      toFlowNode(node),
    );
    const positionedNodeMap = new Map(
      layoutedNodes.map((node) => [node.id, node.position]),
    );

    const edgeMap = new Map<
      string,
      {
        source: string;
        target: string;
        labels: Set<string>;
        animated?: boolean;
      }
    >();

    edges.forEach((edge) => {
      const source = stateMap.get(edge.source);
      const target = stateMap.get(edge.target);

      if (!source || !target) {
        return;
      }

      const key = `${source}-${target}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          source,
          target,
          labels: new Set<string>(),
          animated: edge.animated,
        });
      }

      if (edge.label) {
        edgeMap.get(key)!.labels.add(edge.label);
      }
    });

    const mergedEdges: Edge[] = [...edgeMap.values()]
      .map((edge) => {
        const isSelfLoop = edge.source === edge.target;
        const reverseKey = `${edge.target}-${edge.source}`;
        const hasReverse = edgeMap.has(reverseKey);
        const sourcePosition = positionedNodeMap.get(edge.source);
        const targetPosition = positionedNodeMap.get(edge.target);

        if (!sourcePosition || !targetPosition) {
          return null;
        }

        const routing = resolveEdgeRouting(
          edge.source,
          edge.target,
          sourcePosition.x,
          targetPosition.x,
          hasReverse,
          isSelfLoop,
        );

        return {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: [...edge.labels].sort().join(","),
          animated: edge.animated,
          type: routing.type as Edge["type"],
          pathOptions: routing.pathOptions,
          sourceHandle: routing.sourceHandle,
          targetHandle: routing.targetHandle,
        } as Edge;
      })
      .filter((edge): edge is Edge => edge !== null);

    const styledEdges = mergedEdges.map((edge) => ({
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#4b628c",
        width: 18,
        height: 18,
      },
      labelShowBg: true,
      labelBgBorderRadius: 6,
      labelBgPadding: [6, 3] as [number, number],
      labelBgStyle: { fill: "#f2f6fd", opacity: 0.96 },
      labelStyle: { fill: "#1f3357", fontWeight: 700 },
      style: { stroke: "#5f7396", strokeWidth: 1.6 },
    }));

    return {
      flowNodes: layoutedNodes,
      flowEdges: styledEdges,
      legend: legendItems,
    };
  }, [nodes, edges]);

  const [renderNodes, setRenderNodes, onNodesChange] = useNodesState(flowNodes);
  const [renderEdges, setRenderEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setRenderNodes(flowNodes);
  }, [flowNodes, setRenderNodes]);

  useEffect(() => {
    setRenderEdges(flowEdges);
  }, [flowEdges, setRenderEdges]);

  if (error) {
    return <section className={styles.error}>图渲染失败：{error}</section>;
  }

  if (flowNodes.length === 0) {
    return (
      <section className={styles.empty}>
        <h2>自动机图谱</h2>
        <p>当前没有图数据。请先输入合法正则并构建 DFA。</p>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.titleRow}>
        <h2>自动机图谱</h2>
      </div>

      <div className={styles.canvas}>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={renderNodes}
          edges={renderEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable
          fitView
        >
          <Controls />
          <Background gap={22} size={1} color="#d3ddef" />
        </ReactFlow>
      </div>

      <div className={styles.legend}>
        <h3>状态映射</h3>
        <ul>
          {legend.map((item) => (
            <li key={item.alias} title={item.fullLabel}>
              <span className={styles.alias}>{item.alias}</span>
              <span className={styles.fullLabel}>{item.fullLabel}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
