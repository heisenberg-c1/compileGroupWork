import { useState } from 'react'
import type { FormEvent } from 'react'
import styles from './TestPanel.module.less'

type TestPanelProps = {
	disabled?: boolean
	onTest: (input: string) => void
	result?: { accepted: boolean; reason?: string } | null
}

export default function TestPanel({ disabled = false, onTest, result = null }: TestPanelProps) {
	const [value, setValue] = useState('')

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		onTest(value)
	}

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<h2>测试输入串</h2>
				<p>输入字符串后运行 DFA，查看接受或拒绝结果。</p>
			</div>

			<form className={styles.form} onSubmit={handleSubmit}>
				<label htmlFor="test-input" className={styles.label}>
					输入串
				</label>
				<input
					id="test-input"
					className={styles.input}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					placeholder="例如: abb"
					autoComplete="off"
					spellCheck={false}
					disabled={disabled}
				/>
				<button type="submit" className={styles.button} disabled={disabled}>
					运行判定
				</button>
			</form>

			{result ? (
				<p className={result.accepted ? styles.accepted : styles.rejected}>
					{result.accepted ? '结果：接受' : `结果：拒绝${result.reason ? `，原因：${result.reason}` : ''}`}
				</p>
			) : (
				<p className={styles.hint}>{disabled ? '请先构建 DFA 再测试。' : '尚未运行测试。'}</p>
			)}
		</section>
	)
}
