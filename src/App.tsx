import { useState } from 'react'
import RegexInput from './components/RegexInput/RegexInput'
import GraphView from './components/GraphView/GraphView'
import TestPanel from './components/TestPanel/TestPanel'
import { regexToPostfix } from './core/regexToPostfix'
import { thompson } from './core/thompson'
import { nfaToDfa } from './core/NFAtoDFA'
import { runDfa } from './core/runDFA'
import { graphConverter } from './utils/graphConverter'
import { AutomataBuildError, type DFA, type GraphData, type RunResult } from './types'
import styles from './App.module.less'

function App() {
  const [regex, setRegex] = useState('(a|b)*abb')
  const [dfa, setDfa] = useState<DFA | null>(null)
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [buildError, setBuildError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<RunResult | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)

  const handleBuild = (inputRegex: string) => {
    setRegex(inputRegex)
    setBuildError(null)
    setTestResult(null)
    setIsBuilding(true)

    try {
      const postfix = regexToPostfix(inputRegex)
      const nfa = thompson(postfix)
      const nextDfa = nfaToDfa(nfa)
      const nextGraph = graphConverter(nextDfa)
      
      setDfa(nextDfa)
      setGraphData(nextGraph)
    } catch (error) {
      setDfa(null)
      setGraphData({ nodes: [], edges: [] })

      if (error instanceof AutomataBuildError) {
        setBuildError(error.detail.message)
      } else if (error instanceof Error) {
        setBuildError(error.message)
      } else {
        setBuildError('构建失败：未知内部错误')
      }
    } finally {
      setIsBuilding(false)
    }
  }

  const handleTest = (input: string) => {
    if (!dfa) {
      setTestResult({
        accepted: false,
        finalState: null,
        steps: [],
        reason: '请先构建 DFA',
      })
      return
    }

    setTestResult(runDfa(dfa, input))
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Application of Finite Automata</p>
        <h1>正则到 DFA 的可视化演示</h1>
        <p className={styles.subtitle}>构建流：RegexInput → regexToPostfix → thompson → nfaToDfa → graphConverter</p>
      </header>

      <section className={styles.topGrid}>
        <RegexInput
          onBuild={handleBuild}
          isBuilding={isBuilding}
          error={buildError}
          initialValue={regex}
        />

        <TestPanel
          disabled={!dfa || isBuilding}
          onTest={handleTest}
          result={testResult ? { accepted: testResult.accepted, reason: testResult.reason } : null}
        />
      </section>

      <section className={styles.meta}>
        <span>当前正则：{regex || '（空）'}</span>
        <span>DFA 状态数：{dfa ? dfa.states.length : 0}</span>
        <span>边数量：{graphData.edges.length}</span>
      </section>

      <GraphView nodes={graphData.nodes} edges={graphData.edges} error={null} />
    </main>
  )
}

export default App
