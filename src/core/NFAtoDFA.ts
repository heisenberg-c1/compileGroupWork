import { buildError, type DFA, type NFA, type StateId } from '../types'

function setKey(values: Set<StateId>): string {
	return [...values].sort().join('|')
}

function setToStateId(values: Set<StateId>): string {
	const sorted = [...values].sort()
	return `{${sorted.join(',')}}`
}

function epsilonClosure(nfa: NFA, initial: Set<StateId>): Set<StateId> {
	const closure = new Set<StateId>(initial)
	const stack = [...initial]

	while (stack.length > 0) {
		const state = stack.pop()!
		for (const transition of nfa.transitions) {
			if (transition.from !== state || transition.symbol !== 'EPSILON') continue
			if (closure.has(transition.to)) continue
			closure.add(transition.to)
			stack.push(transition.to)
		}
	}

	return closure
}

function move(nfa: NFA, fromSet: Set<StateId>, symbol: string): Set<StateId> {
	const next = new Set<StateId>()

	for (const transition of nfa.transitions) {
		if (transition.symbol !== symbol) continue
		if (!fromSet.has(transition.from)) continue
		next.add(transition.to)
	}

	return next
}

function validateNFA(nfa: NFA): void {
	if (nfa.states.length === 0) {
		throw buildError('INTERNAL_ERROR', 'NFA 没有任何状态')
	}

	if (!nfa.startState || !nfa.states.includes(nfa.startState)) {
		throw buildError('INTERNAL_ERROR', 'NFA 起始状态无效')
	}

	if (nfa.acceptStates.length === 0) {
		throw buildError('INTERNAL_ERROR', 'NFA 没有接受态')
	}
}

export function nfaToDfa(nfa: NFA): DFA {
	validateNFA(nfa)

	const alphabet = nfa.alphabet.filter((symbol) => symbol !== 'EPSILON')
	const acceptSet = new Set(nfa.acceptStates)
	const dfaTransitions: DFA['transitions'] = {}

	const startClosure = epsilonClosure(nfa, new Set([nfa.startState]))
	const startKey = setKey(startClosure)

	const keyToSet = new Map<string, Set<StateId>>()
	const keyToStateId = new Map<string, string>()
	const queue: string[] = []

	keyToSet.set(startKey, startClosure)
	keyToStateId.set(startKey, setToStateId(startClosure))
	queue.push(startKey)

	while (queue.length > 0) {
		const currentKey = queue.shift()!
		const currentSet = keyToSet.get(currentKey)!
		const fromStateId = keyToStateId.get(currentKey)!

		if (!dfaTransitions[fromStateId]) {
			dfaTransitions[fromStateId] = {}
		}

		for (const symbol of alphabet) {
			const moved = move(nfa, currentSet, symbol)
			if (moved.size === 0) continue

			const closure = epsilonClosure(nfa, moved)
			const targetKey = setKey(closure)

			if (!keyToSet.has(targetKey)) {
				keyToSet.set(targetKey, closure)
				keyToStateId.set(targetKey, setToStateId(closure))
				queue.push(targetKey)
			}

			dfaTransitions[fromStateId][symbol] = keyToStateId.get(targetKey)!
		}
	}

	const states: string[] = []
	const acceptStates: string[] = []

	for (const [key, stateSet] of keyToSet.entries()) {
		const dfaState = keyToStateId.get(key)!
		states.push(dfaState)

		for (const state of stateSet) {
			if (acceptSet.has(state)) {
				acceptStates.push(dfaState)
				break
			}
		}
	}

	return {
		states,
		alphabet,
		startState: keyToStateId.get(startKey)!,
		acceptStates,
		transitions: dfaTransitions,
	}
}

export const NFAtoDFA = nfaToDfa
