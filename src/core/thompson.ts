import { buildError, type NFA, type NFATransition, type PostfixToken, type StateId } from '../types'

interface NFAFragment {
	start: StateId
	accept: StateId
}

function createStateFactory() {
	let counter = 0
	return () => {
		const id = `q${counter}`
		counter += 1
		return id
	}
}

function requireFragments(
	stack: NFAFragment[],
	count: number,
	tokenKind: PostfixToken['kind'],
): NFAFragment[] {
	if (stack.length < count) {
		throw buildError('INVALID_TOKEN', `运算符 ${tokenKind} 缺少操作数`)
	}
	return stack.splice(stack.length - count, count)
}

export function thompson(postfix: PostfixToken[]): NFA {
	if (postfix.length === 0) {
		throw buildError('EMPTY_REGEX', '后缀表达式为空，无法构造 NFA')
	}

	const createState = createStateFactory()
	const stack: NFAFragment[] = []
	const transitions: NFATransition[] = []
	const states = new Set<StateId>()
	const alphabet = new Set<string>()

	for (const token of postfix) {
		if (token.kind === 'literal') {
			const start = createState()
			const accept = createState()
			states.add(start)
			states.add(accept)
			alphabet.add(token.value)
			transitions.push({ from: start, to: accept, symbol: token.value })
			stack.push({ start, accept })
			continue
		}

		if (token.kind === 'concat') {
			const [left, right] = requireFragments(stack, 2, token.kind)
			transitions.push({ from: left.accept, to: right.start, symbol: 'EPSILON' })
			stack.push({ start: left.start, accept: right.accept })
			continue
		}

		if (token.kind === 'union') {
			const [left, right] = requireFragments(stack, 2, token.kind)
			const start = createState()
			const accept = createState()
			states.add(start)
			states.add(accept)

			transitions.push({ from: start, to: left.start, symbol: 'EPSILON' })
			transitions.push({ from: start, to: right.start, symbol: 'EPSILON' })
			transitions.push({ from: left.accept, to: accept, symbol: 'EPSILON' })
			transitions.push({ from: right.accept, to: accept, symbol: 'EPSILON' })

			stack.push({ start, accept })
			continue
		}

		if (token.kind === 'star') {
			const [fragment] = requireFragments(stack, 1, token.kind)
			const start = createState()
			const accept = createState()
			states.add(start)
			states.add(accept)

			transitions.push({ from: start, to: fragment.start, symbol: 'EPSILON' })
			transitions.push({ from: start, to: accept, symbol: 'EPSILON' })
			transitions.push({ from: fragment.accept, to: fragment.start, symbol: 'EPSILON' })
			transitions.push({ from: fragment.accept, to: accept, symbol: 'EPSILON' })

			stack.push({ start, accept })
			continue
		}

		throw buildError('INVALID_TOKEN', `后缀表达式包含非法 token: ${token.kind}`)
	}

	if (stack.length !== 1) {
		throw buildError('INVALID_TOKEN', '后缀表达式不合法，无法归约为单一 NFA')
	}

	const [result] = stack
	return {
		states: [...states],
		alphabet: [...alphabet],
		startState: result.start,
		acceptStates: [result.accept],
		transitions,
	}
}

export const postfixToNFA = thompson
