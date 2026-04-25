# Application of FA

一个用于课程作业演示的前端项目：将正则表达式转换为 DFA，并进行图形化展示与字符串判定。

## 1. 项目目标

本项目聚焦有限自动机（FA）的最小闭环实现与可解释演示：

1. 输入正则表达式。
2. 正则经过算法链转换为 DFA。
3. 使用图可视化展示状态与转移。
4. 输入测试串并返回接受/拒绝结果。

## 2. 已实现功能

### 2.1 正则到 DFA 的完整算法链


1. regexToPostfix：中缀正则转后缀表达式（含连接符补全与语法校验）。
2. thompson：后缀表达式构造 NFA。
3. nfaToDfa：子集构造法将 NFA 转换为 DFA。
4. runDfa：对输入串进行 DFA 判定。

### 2.2 图可视化能力

使用 React Flow（@xyflow/react）完成 DFA 可视化，支持：

1. 状态重命名（S0、S1...）与状态映射面板。
2. 多条同起终点边标签合并。
3. 起始态箭头、接受态双圈样式。
4. 自环专用顶部锚点与可读性优化弧线。
5. 普通边与自环边分流渲染（smoothstep 与 bezier）。

### 2.3 交互与错误处理

1. 构建阶段错误提示（如空表达式、括号不匹配、非法 token）。
2. 未构建 DFA 时禁用测试并提示。
3. 输入串包含非法字符时明确拒绝原因。

## 3. 支持语法与范围

### 3.1 当前支持

1. 字面量字符，例如 a、b、1。
2. 显式或隐式连接，例如 ab。
3. 并联运算 |，例如 a|b。
4. Kleene 闭包 *，例如 a*。
5. 括号 ()，例如 (a|b)*abb。

### 3.2 当前不支持

1. 通配符 .
2. +、?、[]、{} 等扩展正则语法
3. 转义语法

## 4. 技术栈

1. 框架与语言：React 19 + TypeScript
2. 构建工具：Vite
3. 可视化：@xyflow/react（React Flow）
4. 样式：Less + CSS Modules
5. 质量保障：ESLint

## 5. 快速开始

### 5.1 环境要求

建议使用：

1. Node.js 20.19+（或 22.12+）
2. npm 10+

### 5.2 安装依赖

在项目根目录执行：

```bash
npm install
```

### 5.3 启动开发环境

```bash
npm run dev
```

启动后打开终端输出中的本地地址（默认通常是 http://localhost:5173）。

### 5.4 生产构建

```bash
npm run build
```

### 5.5 本地预览构建产物

```bash
npm run preview
```

### 5.6 代码规范检查

```bash
npm run lint
```

## 6. 使用说明

1. 在 RegexInput 面板输入正则表达式并点击“构建 DFA”。
2. 查看 GraphView 中自动生成的状态图和边标签。
3. 在 TestPanel 输入测试串并点击“运行判定”。
4. 根据结果查看是否被 DFA 接受。

可直接使用默认示例：

1. 正则： (a|b)*abb
2. 测试串： abb、aabb、ababb

## 7. 项目架构

### 7.1 目录结构（MVP）

```text
src/
 ├── components/
 │    ├── RegexInput/            # 输入正则并触发构建
 │    ├── GraphView/             # DFA 图展示
 │    └── TestPanel/             # 输入字符串并测试
 │
 ├── core/                       # FA 核心算法
 │    ├── regexToPostfix.ts
 │    ├── thompson.ts
 │    ├── NFAtoDFA.ts
 │    └── runDFA.ts
 │
 ├── utils/
 │    └── graphConverter.ts      # DFA -> React Flow nodes/edges
 │
 ├── types/
 │    └── index.ts               # 统一类型定义
 │
 ├── App.tsx                     # 顶层状态编排
 └── main.tsx
```

### 7.2 分层职责

1. UI 层（components）：负责输入、展示和用户交互。
2. 编排层（App.tsx）：管理全局状态，串联各组件与算法模块。
3. 核心层（core）：负责正则到 DFA 与 DFA 执行逻辑。
4. 工具层（utils）：负责图结构转换。
5. 类型层（types）：统一数据契约，降低模块耦合。

### 7.3 关键数据流

构建流：

```text
RegexInput
	-> regexToPostfix
	-> thompson (NFA)
	-> nfaToDfa (DFA)
	-> graphConverter
	-> GraphView
```

测试流：

```text
TestPanel
	-> runDfa(dfa, input)
	-> 接受/拒绝结果
```

