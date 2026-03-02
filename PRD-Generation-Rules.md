---
description: 如果要写 PRD，必须参考这份文档的规则
alwaysApply: false
---
# PRD Generation Rules

This rule guides the Agent to generate standard Product Requirements Documents (PRD) based on user-specified project content.

## PRD Structure

### First-Level Sections (一级标题)

**CRITICAL FORMAT RULES:**
- Use `#` for first-level headings
- NO numbers before headings (NOT `# 1. 背景`, just `# 背景`)
- Use Chinese text only for headings

The PRD must contain exactly three first-level sections (`#`) in this order:

1. `# 背景`
2. `# 目标`
3. `# 需求`

### Background Section

**⚠️ CRITICAL: DO NOT auto-fill this section!**
- Only provide guidance text, leave content empty for user to fill in
- **Guidance text**: "> 提示：请说明需求来源和需求产生的场景，清晰描述需求背景。"
- Content placeholder: "[用户填写]"

### Objectives Section

**⚠️ CRITICAL: DO NOT auto-fill this section!**
- Only provide guidance text, leave content empty for user to fill in
- **Guidance text**: "> 提示：请定义可量化的目标，能够直接明确地根据目标验证需求完成情况。目标应具体、可衡量、可验证。"
- Content placeholder: "[用户填写]"

### Requirements Section

This section is **automatically generated** by the Agent based on code review.

#### Generation Process

1. **User Input**: User must specify which part of the prototype to document:
   - Code file paths
   - Page routes
   - Functional components

2. **Code Review**: Agent must:
   - Review the specified code files
   - Understand the overall functionality
   - Analyze component structure and interactions
   - Understand data flow and state management

3. **Documentation Structure**:
   - Follow **top-to-bottom, left-to-right** reading order (matching page layout and user interaction flow)
   - Organize modules according to page reading habits and user interaction logic

#### Requirements Section Structure (需求下的二级标题)

**CRITICAL FORMAT RULES for Second-Level Headings:**
- Use `##` for second-level headings under 需求
- NO numbers before headings (NOT `## 3.1 原型`, just `## 原型`)
- Use Chinese text only for headings

##### 1. `## 原型`

- First second-level heading under 需求
- Leave empty for user to fill in the prototype URL/address

##### 2. `## 用户使用流程`

- **Must be placed immediately after 原型 section**
- Generate user flow diagram using Mermaid syntax
- The diagram should illustrate the complete user interaction flow based on code analysis
- **For single role**: Use flowchart format showing main paths and decision points
- **For multiple roles**:
  - Use sequence diagram format for complex interactions
  - Or use flowchart with different styles/colors to distinguish roles
  - Clearly label each role
  - Show interactions between roles
- Include:
  - Main user paths
  - Decision points and branches
  - Error handling paths (if applicable)
  - Alternative flows (if applicable)

##### 3. `## [模块名]` (Functional Modules)

- Create second-level headings (`##`) for each functional module
- **NO numbers** in heading (NOT `## 3.3 顶部导航栏`, just `## 顶部导航栏`)
- Module division should follow:
  - Page reading habits (top-to-bottom, left-to-right)
  - User interaction logic
  - Natural component grouping

- For each module, use **ordered lists** to document components:
  ```
  1. [组件名]：[组件用途]
  ```

- Under each component, use **multi-level unordered lists** to describe:
  - **交互**：用户如何操作、触发什么行为、产生什么结果
  - **状态**：组件有哪些状态（如：默认/选中/禁用/加载中/错误等）
  - **规则**：业务逻辑、数据规则、条件判断
  - **文案**：界面显示的文字内容（按钮文案、提示语、标签等）
  - **边界**：限制条件、异常情况、边界场景

**IMPORTANT - What to INCLUDE:**
- 状态枚举（如：未翻译/翻译中/已翻译/翻译失败）
- 业务逻辑（如：选择应用后自动重置语言对为第一项）
- 文案内容（如：按钮显示"生成图片"、空状态显示"暂无数据"）
- 数据关系（如：语言对列表根据当前应用动态生成）
- 触发条件（如：未选择行时按钮禁用）
- 校验规则（如：搜索不区分大小写）

**IMPORTANT - What to EXCLUDE:**
- 具体尺寸（如：width: 400px、fontSize: 14px）
- 具体颜色（如：#3b82f6、rgba(0,0,0,0.5)）
- 代码变量名（如：selectedRows、isModalOpen）
- 实现细节（如：使用 useState 管理状态）
- 样式细节（如：圆角、阴影、间距）

**写法原则：描述"是什么"和"做什么"，不描述"怎么做"**

##### 4. `## 权限`

- Create a second-level heading `## 权限` (NO numbers)
- Include a table with two columns:
  - **角色**: Empty column for user to fill
  - **功能**: List modules and data that require permission management based on PRD content
- Agent should populate the "功能" column based on the documented requirements

##### 5. `## 数据监测`

- Create a second-level heading `## 数据监测` (NO numbers)
- Leave empty for user to fill
- **Guidance text**: 提示用户需要考虑目标达成的验证所需的数据，以及监测系统/功能运行情况需要长期跟踪的数据指标

## Generation Workflow

### Step 1: User Specification
- User provides: code file paths, page routes, or component names
- User may specify: specific features or entire pages

### Step 2: Code Analysis
- Agent reads and analyzes specified code files
- Identifies:
  - Component hierarchy
  - User interaction flows
  - Data structures
  - State management
  - API integrations
  - Business logic
  - User roles and permissions (if applicable)
  - Multi-role interactions (if applicable)

### Step 3: Module Organization
- Organize components into logical modules
- Follow reading order (top-to-bottom, left-to-right)
- Group related components together
- Respect user interaction patterns

### Step 4: Documentation Generation
- Generate structured PRD following the template
- **Output format**: Use Markdown (MD) syntax
- **Diagrams**: Generate user flow diagrams using Mermaid syntax
  - Analyze user interaction flow from code
  - Identify all user roles involved
  - Create flowchart or sequence diagram
  - Clearly label different roles if multiple roles exist
  - Include decision points and alternative paths
- Fill in automatically generated sections (Requirements)
- Leave user-fillable sections empty with guidance
- Ensure completeness and accuracy

### Step 5: Review and Refinement
- Verify all components are documented
- Check module organization matches user flow
- Ensure permissions table includes all relevant modules
- Validate documentation completeness

## Output Format Requirements

### Markdown Syntax
- **PRD must be output in Markdown (MD) syntax**
- Use standard Markdown formatting:
  - Headings: `#`, `##`, `###`
  - Lists: `-`, `*`, numbered lists
  - Tables: pipe-separated format
  - Code blocks: triple backticks with language tags
  - Emphasis: `**bold**`, `*italic*`

### Diagram Format
- **All diagrams must use Mermaid syntax**
- Wrap diagrams in Mermaid code blocks:
  ```markdown
  ```mermaid
  [mermaid diagram code]
  ```
  ```
- Supported Mermaid diagram types:
  - Flowchart (for user flows)
  - Sequence Diagram (for multi-role interactions)
  - State Diagram (for state transitions)
  - Gantt Chart (for timelines, if needed)

### User Flow Diagram Requirements
- Must be placed immediately after the prototype address section
- Should illustrate the complete user journey
- For multi-role scenarios:
  - Use different colors or shapes to distinguish roles
  - Label each role clearly
  - Show interactions between roles
  - Use sequence diagrams for complex multi-role flows
- Include decision points and alternative paths
- Show error handling and edge cases when relevant

## Template Format

**CRITICAL**: Follow this exact format strictly!

- First-level headings (`#`): 背景、目标、需求 (NO numbers, NO English)
- Second-level headings (`##`): Under 需求 section only (NO numbers)

```markdown
# [功能名称] PRD

# 背景

> 提示：请说明需求来源和需求产生的场景，清晰描述需求背景。

[用户填写]

# 目标

> 提示：请定义可量化的目标，能够直接明确地根据目标验证需求完成情况。目标应具体、可衡量、可验证。

[用户填写]

# 需求

## 原型

[用户填写原型地址]

## 用户使用流程

\`\`\`mermaid
flowchart TD
    Start([用户开始]) --> Step1[步骤1]
    Step1 --> Decision{判断条件}
    Decision -->|条件1| Step2[步骤2]
    Decision -->|条件2| Step3[步骤3]
    Step2 --> End([结束])
    Step3 --> End

    %% 多角色示例（使用不同样式区分）
    style Role1 fill:#e1f5ff
    style Role2 fill:#fff4e1
    style Role3 fill:#f0e1ff

    Role1[角色A] --> Action1[操作1]
    Role2[角色B] --> Action2[操作2]
    Role3[角色C] --> Action3[操作3]
    Action1 --> Interaction[交互]
    Action2 --> Interaction
    Action3 --> Interaction
\`\`\`

**Note**: 如果涉及多角色，使用序列图格式：

\`\`\`mermaid
sequenceDiagram
    participant A as 角色A
    participant B as 角色B
    participant S as 系统

    A->>S: 操作1
    S->>B: 通知
    B->>S: 操作2
    S->>A: 反馈
\`\`\`

## [模块名1]

1. [组件名]：[组件用途]
   - 交互：
     - 点击展开下拉列表
     - 选择选项后列表自动收起
     - 点击外部区域关闭列表
   - 状态：
     - 默认状态：显示当前选中项
     - 展开状态：显示所有可选项
     - 禁用状态：不可操作
   - 规则：
     - 选项列表根据配置动态生成
     - 切换选项后触发关联数据刷新
   - 文案：
     - 默认选项："请选择"
     - 空状态："暂无可选项"
   - 边界：
     - 至少需要一个可选项
     - 选项数量无上限

2. [组件名]：[组件用途]
   ...

## [模块名2]

...

## 权限

| 角色 | 功能 |
|------|------|
| [用户填写] | [模块/数据1] |
| [用户填写] | [模块/数据2] |
| ... | ... |

## 数据监测

> 提示：请说明验证目标达成所需的数据指标，以及监测系统/功能运行情况需要长期跟踪的数据指标。

[用户填写]
```

## Quality Standards

1. **Completeness**: All components and interactions must be documented
2. **Accuracy**: Documentation must match actual code implementation
3. **Clarity**: Use clear, concise language
4. **Structure**: Follow the specified template strictly
5. **User Guidance**: Provide helpful guidance for user-fillable sections
6. **Logical Flow**: Module organization should match user interaction flow
7. **⚠️ Respect User Authority**: 背景、目标、原型地址、数据监测 sections must NEVER be auto-filled by Agent - only user can provide this content

## Notes

- **⚠️ User-Fillable Sections**: Agent 禁止自动填写以下内容，只能提供提示文字和占位符：
  - `# 背景` - 只放提示和 [用户填写]
  - `# 目标` - 只放提示和 [用户填写]
  - `## 原型` - 只放 [用户填写原型地址]
  - `## 数据监测` - 只放提示和 [用户填写]
  - `## 权限` 表格的角色列 - 只放 [用户填写]
- **Output Format**: Always output PRD in Markdown (MD) syntax
- **Language**:
  - **ALL headings must be in Chinese** (背景, 目标, 需求, 原型, 权限, 数据监测, etc.)
  - **NO numbers in headings** (NOT `# 1. 背景`, just `# 背景`)
  - **NO English in headings** (NOT `## Prototype`, just `## 原型`)
  - Guidance text and content descriptions in Chinese
- **Heading Format**:
  - First-level (`#`): Only 背景, 目标, 需求
  - Second-level (`##`): Under 需求 only (原型, 用户使用流程, 各模块名, 权限, 数据监测)
  - NO third-level headings for main structure
- **Change Log**: 变更记录表保留空表结构，内容只在开发阶段产生，文档阶段不填写
- **Code References**: Code references should use proper code citation format
- **Diagrams**:
  - All diagrams must use Mermaid syntax wrapped in code blocks
  - Use flowchart for user flows
  - Use sequence diagram for multi-role interactions
  - Clearly distinguish roles with labels, colors, or different shapes
  - Include all main paths and decision points
- **Code Analysis**: When analyzing code, consider both visual components and underlying logic
- **Documentation Scope**: Document both user-facing features and internal mechanisms
- **Completeness**: Include error handling and edge cases in component documentation
- **User Flow**: Generate user flow diagram based on actual code implementation, showing real user interaction paths
