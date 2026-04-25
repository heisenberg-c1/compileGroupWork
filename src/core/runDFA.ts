import { type DFA, type RunResult, type RunStep } from '../types'

export function runDfa(dfa: DFA, input: string): RunResult {
	if (!dfa || dfa.states.length === 0 || !dfa.startState) {
		return {
			accepted: false,
			finalState: null,
			steps: [],
			reason: 'DFA 不可用，请先构建有效自动机',
		}
	}

	let currentState = dfa.startState
	const steps: RunStep[] = []

	for (let index = 0; index < input.length; index += 1) {
		const inputChar = input[index]

		if (!dfa.alphabet.includes(inputChar)) {
			steps.push({
				index,
				inputChar,
				from: currentState,
				to: null,
			})
			return {
				accepted: false,
				finalState: currentState,
				steps,
				reason: `输入包含非法字符: ${inputChar}`,
			}
		}

		const nextState = dfa.transitions[currentState]?.[inputChar]
		steps.push({
			index,
			inputChar,
			from: currentState,
			to: nextState ?? null,
		})

		if (!nextState) {
			return {
				accepted: false,
				finalState: currentState,
				steps,
				reason: `状态 ${currentState} 在字符 ${inputChar} 上无可用转移`,
			}
		}

		currentState = nextState
	}

	const accepted = dfa.acceptStates.includes(currentState)
	return {
		accepted,
		finalState: currentState,
		steps,
		reason: accepted ? undefined : `最终状态 ${currentState} 不是接受态`,
	}
}

export const runDFA = runDfa
