import { buildError, type PostfixToken } from '../types'

function isSupportedLiteral(char: string): boolean {
	if (char.length !== 1) return false
	return !['|', '*', '(', ')', '.', '+', '?', '[', ']', '{', '}', '\\'].includes(char)
}

function toInfixTokens(regex: string): PostfixToken[] {
	const normalized = regex.replace(/\s+/g, '')

	if (normalized.length === 0) {
		throw buildError('EMPTY_REGEX', '正则表达式不能为空')
	}

	const tokens: PostfixToken[] = []

	for (let index = 0; index < normalized.length; index += 1) {
		const char = normalized[index]

		if (isSupportedLiteral(char)) {
			tokens.push({ kind: 'literal', value: char })
			continue
		}

		if (char === '.') {
			throw buildError('UNSUPPORTED_FEATURE', '当前不支持通配符 .', index)
		}

		if (char === '+' || char === '?' || char === '[' || char === ']' || char === '{' || char === '}') {
			throw buildError('UNSUPPORTED_FEATURE', `当前不支持运算符 ${char}`, index)
		}

		if (char === '\\') {
			throw buildError('UNSUPPORTED_FEATURE', '当前不支持转义语法', index)
		}

		if (char === '|') {
			tokens.push({ kind: 'union' })
			continue
		}

		if (char === '*') {
			tokens.push({ kind: 'star' })
			continue
		}

		if (char === '(') {
			tokens.push({ kind: 'lparen' })
			continue
		}

		if (char === ')') {
			tokens.push({ kind: 'rparen' })
			continue
		}

		throw buildError('INVALID_TOKEN', `非法字符: ${char}`, index)
	}

	return tokens
}

function canEndAtom(token: PostfixToken): boolean {
	return token.kind === 'literal' || token.kind === 'rparen' || token.kind === 'star'
}

function canStartAtom(token: PostfixToken): boolean {
	return token.kind === 'literal' || token.kind === 'lparen'
}

function insertConcatTokens(tokens: PostfixToken[]): PostfixToken[] {
	if (tokens.length <= 1) return tokens

	const withConcat: PostfixToken[] = []

	for (let i = 0; i < tokens.length; i += 1) {
		const current = tokens[i]
		withConcat.push(current)

		const next = tokens[i + 1]
		if (!next) continue

		if (canEndAtom(current) && canStartAtom(next)) {
			withConcat.push({ kind: 'concat' })
		}
	}

	return withConcat
}

function precedence(token: PostfixToken): number {
	if (token.kind === 'union') return 1
	if (token.kind === 'concat') return 2
	return 0
}

function validateTokenSequence(tokens: PostfixToken[]): void {
	let balance = 0

	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i]
		const prev = tokens[i - 1]

		if (token.kind === 'lparen') {
			balance += 1
		} else if (token.kind === 'rparen') {
			balance -= 1
			if (balance < 0) {
				throw buildError('PAREN_MISMATCH', '括号不匹配：出现多余的 )', i)
			}
			if (!prev || prev.kind === 'union' || prev.kind === 'lparen' || prev.kind === 'concat') {
				throw buildError('INVALID_TOKEN', '空括号或错误的右括号位置', i)
			}
		} else if (token.kind === 'union' || token.kind === 'concat') {
			if (!prev || prev.kind === 'union' || prev.kind === 'lparen' || prev.kind === 'concat') {
				throw buildError('INVALID_TOKEN', '二元运算符缺少左操作数', i)
			}
		} else if (token.kind === 'star') {
			if (!prev || prev.kind === 'union' || prev.kind === 'lparen' || prev.kind === 'concat') {
				throw buildError('INVALID_TOKEN', '* 缺少前置操作数', i)
			}
		}
	}

	if (balance !== 0) {
		throw buildError('PAREN_MISMATCH', '括号不匹配：缺少 )')
	}

	const last = tokens[tokens.length - 1]
	if (!last || last.kind === 'union' || last.kind === 'concat' || last.kind === 'lparen') {
		throw buildError('INVALID_TOKEN', '表达式不能以运算符或左括号结尾')
	}
}

export function regexToPostfix(regex: string): PostfixToken[] {
	const infixTokens = insertConcatTokens(toInfixTokens(regex))
	validateTokenSequence(infixTokens)

	const output: PostfixToken[] = []
	const operatorStack: PostfixToken[] = []

	for (const token of infixTokens) {
		if (token.kind === 'literal') {
			output.push(token)
			continue
		}

		if (token.kind === 'star') {
			output.push(token)
			continue
		}

		if (token.kind === 'lparen') {
			operatorStack.push(token)
			continue
		}

		if (token.kind === 'rparen') {
			let foundLParen = false

			while (operatorStack.length > 0) {
				const top = operatorStack.pop()!
				if (top.kind === 'lparen') {
					foundLParen = true
					break
				}
				output.push(top)
			}

			if (!foundLParen) {
				throw buildError('PAREN_MISMATCH', '括号不匹配：无法找到对应的 (')
			}

			continue
		}

		while (operatorStack.length > 0) {
			const top = operatorStack[operatorStack.length - 1]
			if (top.kind === 'lparen') break
			if (precedence(top) >= precedence(token)) {
				output.push(operatorStack.pop()!)
				continue
			}
			break
		}

		operatorStack.push(token)
	}

	while (operatorStack.length > 0) {
		const top = operatorStack.pop()!
		if (top.kind === 'lparen' || top.kind === 'rparen') {
			throw buildError('PAREN_MISMATCH', '括号不匹配：存在未闭合括号')
		}
		output.push(top)
	}

	return output
}
