import { useState } from 'react'
import type { FormEvent } from 'react'
import styles from './RegexInput.module.less'

type RegexInputProps = {
	onBuild: (regex: string) => void
	isBuilding?: boolean
	error?: string | null
	initialValue?: string
}

export default function RegexInput({
	onBuild,
	isBuilding = false,
	error = null,
	initialValue = '',
}: RegexInputProps) {
	const [value, setValue] = useState(initialValue)

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		onBuild(value)
	}

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<h2>输入正则表达式</h2>
				<p>支持字面量、连接、|、*、括号，例如 (a|b)*abb</p>
			</div>

			<form className={styles.form} onSubmit={handleSubmit}>
				<label htmlFor="regex-input" className={styles.label}>
					正则
				</label>
				<input
					id="regex-input"
					className={styles.input}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					placeholder="例如: (a|b)*abb"
					autoComplete="off"
					spellCheck={false}
				/>
				<button type="submit" className={styles.button} disabled={isBuilding}>
					{isBuilding ? '构建中...' : '构建 DFA'}
				</button>
			</form>

			{error ? <p className={styles.error}>构建失败：{error}</p> : null}
		</section>
	)
}