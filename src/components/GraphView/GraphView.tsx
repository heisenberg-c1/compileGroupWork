import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  Handle,
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
      {/* 左 */}
      <Handle type="target" position={Position.Left} />

      {/* 右 */}
      <Handle type="source" position={Position.Right} />

      <Handle
        id="self-loop-target"
        type="target"
        position={Position.Top}
        className={styles.selfLoopHandle}
      />

      <Handle
        id="self-loop-source"
        type="source"
        position={Position.Top}
        className={styles.selfLoopHandle}
      />

      <div>{data.label}</div>
    </div>
  );
}


const nodeTypes = {
  faNode: FANode,
};



function toFlowNode(node: Node<FlowNodeData>): Node<FlowNodeData> {
  const isStart = Boolean(node.data.isStart);
  const isAccept = Boolean(node.data.isAccept);

  const classNames = [styles.faNode];
  if (isStart) classNames.push(styles.startNode);
  if (isAccept) classNames.push(styles.acceptNode);

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

    const mergedEdges: Edge[] = [...edgeMap.values()].map((edge) => {
      const isSelfLoop = edge.source === edge.target;

      return {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: [...edge.labels].sort().join(","),
        animated: edge.animated,
        type: isSelfLoop ? "default" : "smoothstep",
        sourceHandle: isSelfLoop ? "self-loop-source" : undefined,
        targetHandle: isSelfLoop ? "self-loop-target" : undefined,
        className: isSelfLoop ? styles.selfLoopEdge : undefined,
      };
    });

    const layoutedNodes = simpleLayout(rawNodes).map((node) =>
      toFlowNode(node),
    );

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
        nodes={flowNodes} 
        edges={flowEdges} 
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
