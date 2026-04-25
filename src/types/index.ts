export type SymbolChar = string
export type StateId = string

export type PostfixToken =
	| { kind: 'literal'; value: SymbolChar }
	| { kind: 'concat' }
	| { kind: 'union' }
	| { kind: 'star' }
	| { kind: 'lparen' }
	| { kind: 'rparen' }

export interface NFATransition {
	from: StateId
	to: StateId
	symbol: SymbolChar | 'EPSILON'
}

export interface NFA {
	states: StateId[]
	alphabet: SymbolChar[]
	startState: StateId
	acceptStates: StateId[]
	transitions: NFATransition[]
}

export interface DFATransitions {
	[fromState: string]: {
		[symbol: string]: string
	}
}

export interface DFA {
	states: StateId[]
	alphabet: SymbolChar[]
	startState: StateId
	acceptStates: StateId[]
	transitions: DFATransitions
}

export interface RunStep {
	index: number
	inputChar: string
	from: StateId
	to: StateId | null
}

export interface RunResult {
	accepted: boolean
	finalState: StateId | null
	steps: RunStep[]
	reason?: string
}

export interface BuildResult {
	dfa: DFA
	warnings?: string[]
}

export type BuildErrorCode =
	| 'EMPTY_REGEX'
	| 'INVALID_TOKEN'
	| 'PAREN_MISMATCH'
	| 'UNSUPPORTED_FEATURE'
	| 'INTERNAL_ERROR'

export interface BuildError {
	code: BuildErrorCode
	message: string
	position?: number
}

export class AutomataBuildError extends Error {
	readonly detail: BuildError

	constructor(detail: BuildError) {
		super(detail.message)
		this.name = 'AutomataBuildError'
		this.detail = detail
	}
}

export function buildError(
	code: BuildErrorCode,
	message: string,
	position?: number,
): AutomataBuildError {
	return new AutomataBuildError({ code, message, position })
}

export interface GraphNodeData {
	label: string
	isStart?: boolean
	isAccept?: boolean
}

export interface GraphNode {
	id: string
	type?: string
	data: GraphNodeData
	position: { x: number; y: number }
}

export interface GraphEdge {
	id: string
	source: string
	target: string
	label: string
	animated?: boolean
}

export interface GraphData {
	nodes: GraphNode[]
	edges: GraphEdge[]
}
