import { type DFA, type GraphData, type GraphEdge, type GraphNode } from '../types'

function toEdgeId(from: string, symbol: string, to: string): string {
	return `${from}-${symbol}-${to}`
}

export function graphConverter(dfa: DFA): GraphData {
	if (!dfa || dfa.states.length === 0 || !dfa.startState) {
		throw new Error('DFA 为空或缺少起始状态，无法生成图数据')
	}

	const stateSet = new Set(dfa.states)
	if (!stateSet.has(dfa.startState)) {
		throw new Error('DFA 起始状态不在 states 集合中')
	}

	const acceptSet = new Set(dfa.acceptStates)
	const columns = 4
	const horizontalGap = 220
	const verticalGap = 160

	const nodes: GraphNode[] = dfa.states.map((state, index) => ({
		id: state,
		data: {
			label: state,
			isStart: state === dfa.startState,
			isAccept: acceptSet.has(state),
		},
		position: {
			x: (index % columns) * horizontalGap,
			y: Math.floor(index / columns) * verticalGap,
		},
	}))

	const warnings: string[] = []
	const edges: GraphEdge[] = []

	for (const fromState of dfa.states) {
		const transitionMap = dfa.transitions[fromState]
		if (!transitionMap) continue

		const symbols = Object.keys(transitionMap).sort()
		for (const symbol of symbols) {
			const target = transitionMap[symbol]
			if (!stateSet.has(target)) {
				warnings.push(`转移 ${fromState} --${symbol}--> ${target} 指向未知状态，已跳过`)
				continue
			}

			edges.push({
				id: toEdgeId(fromState, symbol, target),
				source: fromState,
				target,
				label: symbol,
			})
		}
	}

	if (warnings.length > 0) {
		console.warn('[graphConverter warnings]\n' + warnings.join('\n'))
	}

	return {
		nodes,
		edges,
	}
}
