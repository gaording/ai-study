# 最小MVP概要设计：专注守护者（Focus Guardian）

## 一、MVP核心价值主张

**一句话描述**：让深度工作者能一键进入"专注模式"，自动拦截非紧急消息，保护专注时间。

**验证假设**：
1. 用户愿意主动声明"专注状态"
2. 简单的规则能有效区分紧急/非紧急消息
3. 暂存机制能减少焦虑（不会错过重要信息）

---

## 二、MVP功能范围（最小可用）

### ✅ 包含功能

**1. 专注模式开关**
- 一键开启/关闭专注模式
- 显示当前状态（专注中/可打断）
- 设置专注时长（25分钟/50分钟/自定义）

**2. 消息拦截与暂存**
- 拦截系统通知（macOS/Windows通知中心）
- 将拦截的消息存入"暂存区"
- 显示暂存消息数量

**3. 紧急消息穿透（简化规则）**
- 白名单机制：指定联系人的消息可穿透
- 关键词机制：包含"紧急"/"urgent"/"P0"等关键词可穿透
- 重复消息机制：同一人3分钟内发送3次以上，自动穿透

**4. 暂存区查看**
- 专注结束后，自动弹出暂存区
- 可手动打开暂存区，批量查看消息
- 一键"全部已读"

### ❌ 不包含功能（留待后续迭代）

- ❌ 状态同步到团队（需要团队协作功能）
- ❌ AI智能判断紧急程度（技术复杂度高）
- ❌ 多平台消息聚合（微信/飞书/钉钉统一管理）
- ❌ 数据统计分析（被打断次数、专注时长统计）
- ❌ 团队日历集成
- ❌ 自动回复功能

---

## 三、技术架构

### 3.1 技术选型

**平台**：macOS桌面应用（优先）
- 理由：目标用户（程序员）多用Mac，系统通知API成熟

**技术栈**：
- **前端**：Electron + React（跨平台能力，后续可扩展到Windows）
- **通知拦截**：macOS Notification Center API
- **数据存储**：SQLite（本地存储暂存消息）
- **状态管理**：Zustand（轻量级）

### 3.2 系统架构图

```
┌─────────────────────────────────────────┐
│         Focus Guardian App              │
│  ┌───────────────────────────────────┐  │
│  │   UI Layer (React)                │  │
│  │  - 专注模式开关                    │  │
│  │  - 暂存区界面                      │  │
│  │  - 设置界面                        │  │
│  └───────────────────────────────────┘  │
│                ↕                        │
│  ┌───────────────────────────────────┐  │
│  │   Business Logic Layer            │  │
│  │  - 专注状态管理                    │  │
│  │  - 消息过滤引擎                    │  │
│  │  - 规则匹配器                      │  │
│  └───────────────────────────────────┘  │
│                ↕                        │
│  ┌───────────────────────────────────┐  │
│  │   System Integration Layer        │  │
│  │  - 通知拦截器(macOS API)          │  │
│  │  - 本地存储 (SQLite)              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                ↕
        ┌─────────────────┐
        │  macOS System   │
        │  Notification   │
        │  Center         │
        └─────────────────┘
```

### 3.3 核心模块

**模块1：专注状态管理器（FocusStateManager）**
```typescript
interface FocusStateManager {
  startFocus(duration: number): void;
  stopFocus(): void;
  getCurrentState(): FocusState;
  onStateChange(callback: (state: FocusState) => void): void;
}

type FocusState = {
  isFocusing: boolean;
  startTime: Date | null;
  endTime: Date | null;
  remainingMinutes: number;
}
```

**模块2：消息过滤引擎（MessageFilterEngine）**
```typescript
interface MessageFilterEngine {
  shouldBlock(notification: Notification): boolean;
  addToQueue(notification: Notification): void;
  getQueuedMessages(): Notification[];
  clearQueue(): void;
}

type Notification = {
  id: string;
  appName: string;
  title: string;
  body: string;
  sender: string;
  timestamp: Date;
}
```

**模块3：规则匹配器（RuleMatcher）**
```typescript
interface RuleMatcher {
  isInWhitelist(sender: string): boolean;
  hasUrgentKeyword(message: string): boolean;
  isRepeatedMessage(sender: string, timeWindow: number): boolean;
}
```

---

## 四、用户体验流程

### 4.1 核心流程：开启专注模式

```
1. 用户点击菜单栏图标 → 选择"开始专注（25分钟）"
2. 系统进入专注模式，图标变为红色
3. 有新通知到来：
   a. 系统拦截通知
   b. 检查是否符合穿透规则
   c. 不符合 → 存入暂存区，显示角标数字
   d. 符合 → 正常弹出通知
4. 25分钟后，自动退出专注模式
5. 弹出暂存区，显示所有被拦截的消息
6. 用户批量查看，点击"全部已读"
```

### 4.2 界面设计（简化版）

**菜单栏图标**
- 正常状态：灰色图标
- 专注状态：红色图标 + 倒计时
- 有暂存消息：显示数字角标

**下拉菜单**
```
┌─────────────────────────┐
│ ⏱ 开始专注              │
│   ├ 25分钟              │
│   ├ 50分钟              │
│   └ 自定义...           │
│ ─────────────────────   │
│ 📬 暂存区 (3)           │
│ ⚙️ 设置                 │
│ ❌ 退出                 │
└─────────────────────────┘
```

**暂存区窗口**
```
┌──────────────────────────────────┐
│  暂存消息 (3条)                   │
├──────────────────────────────────┤
│ 📱 微信 - 张三                    │
│    "今天下班一起吃饭吗？"         │
│    10:23                          │
├──────────────────────────────────┤
│ 💬 飞书 - 产品组                  │
│    "新需求文档已更新"             │
│    10:45                          │
├──────────────────────────────────┤
│ 📧 邮件 - hr@company.com         │
│    "下周团建通知"                 │
│    11:02                          │
├──────────────────────────────────┤
│  [全部已读]  [查看详情]           │
└──────────────────────────────────┘
```

---

## 五、技术实现关键点

### 5.1 macOS通知拦截

**方案**：使用macOS的`NSUserNotificationCenter`或`UNUserNotificationCenter`
- 需要申请系统权限（Accessibility权限）
- 监听通知事件，在显示前拦截
- 将拦截的通知存入本地数据库

**技术挑战**：
- macOS12+后，通知API有变化，需要适配
- 部分App（如微信）的通知可能无法完全拦截
- 需要用户授予辅助功能权限

**降级方案**：
- 如果无法拦截，改为"提醒用户关闭通知"
- 提供"手动勿扰"模式，用户自己关闭通知

### 5.2 数据存储

**SQLite表结构**：

```sql
-- 暂存消息表
CREATE TABLE queued_notifications (
  id TEXT PRIMARY KEY,
  app_name TEXT,
  title TEXT,
  body TEXT,
  sender TEXT,
  timestamp INTEGER,
  is_read INTEGER DEFAULT 0
);

-- 白名单表
CREATE TABLE whitelist (
  id INTEGER PRIMARY KEY,
  sender TEXT UNIQUE,
  created_at INTEGER
);

-- 专注记录表（用于后续数据分析）
CREATE TABLE focus_sessions (
  id INTEGER PRIMARY KEY,
  start_time INTEGER,
  end_time INTEGER,
  duration_minutes INTEGER,
  interrupted_count INTEGER
);
```

### 5.3 规则引擎实现

**紧急判断逻辑**：

```typescript
function shouldAllowNotification(notification: Notification): boolean {
  // 规则1：白名单
  if (isInWhitelist(notification.sender)) {
    return true;
  }

  // 规则2：关键词
  const urgentKeywords = ['紧急', 'urgent', 'P0', '线上故障', '报警'];
  if (urgentKeywords.some(kw =>
    notification.title.includes(kw) || notification.body.includes(kw)
  )) {
    return true;
  }

  // 规则3：重复消息（3分钟内同一人发送3次）
  if (getRecentMessageCount(notification.sender, 3 * 60 * 1000) >= 3) {
    return true;
  }

  return false;
}
```

---

## 六、开发计划（2周冲刺）

### Week 1：核心功能开发

**Day 1-2**：项目搭建 + 通知拦截
- Electron项目初始化
- macOS通知权限申请
- 基础通知拦截功能

**Day 3-4**：专注模式 + 暂存区
- 专注状态管理
- 消息暂存到SQLite
- 暂存区UI

**Day 5**：规则引擎
- 白名单功能
- 关键词匹配
- 重复消息检测

### Week 2：完善 + 测试

**Day 6-7**：UI优化
- 菜单栏图标
- 倒计时显示
- 暂存区界面优化

**Day 8-9**：测试 + Bug修复
- 功能测试
- 边界情况处理
- 性能优化

**Day 10**：打包 + 发布
- 打包成.dmg
- 编写使用文档
- 内测发布

---

## 七、成功指标（MVP验证）

### 定量指标

1. **使用频率**：用户每天开启专注模式≥2次
2. **拦截效果**：每次专注期间拦截消息≥5条
3. **误拦率**：紧急消息被误拦<5%
4. **留存率**：7日留存率≥40%

### 定性指标

1. 用户反馈："确实减少了被打断的次数"
2. 用户反馈："不担心错过重要消息"
3. 用户反馈："愿意推荐给同事"

### 失败信号

- 用户开启后立即关闭（说明拦截规则太激进）
- 用户从不查看暂存区（说明暂存的都是垃圾消息）
- 用户抱怨"错过了重要消息"（说明规则太严格）

---

## 八、风险与应对

### 技术风险

**风险1**：macOS通知拦截权限被拒绝
- **应对**：提供清晰的权限说明，引导用户授权
- **降级**：改为"提醒模式"，不拦截但提醒用户

**风险2**：部分App通知无法拦截
- **应对**：优先支持主流App（微信、飞书、钉钉）
- **降级**：提供"手动勿扰"指引

### 产品风险

**风险3**：用户不愿意主动开启专注模式
- **应对**：提供"智能建议"，在检测到用户开始写代码时提醒
- **应对**：提供"定时专注"，每天固定时间自动开启

**风险4**：规则太简单，误拦率高
- **应对**：快速迭代规则，收集用户反馈
- **应对**：提供"撤销拦截"功能，用户可标记误拦

---

## 九、后续迭代方向

**V2.0（如果MVP验证成功）**：
- 状态同步：团队成员能看到彼此的专注状态
- AI判断：使用LLM判断消息紧急程度
- 多平台支持：Windows、Linux

**V3.0**：
- 消息聚合：统一管理微信/飞书/钉钉
- 数据分析：专注时长统计、被打断分析
- 团队协作：团队专注时间协调

---

## 十、总结

这个MVP的核心是：**用最简单的方式验证"可中断性管理"这个概念是否成立**。

**关键假设**：
1. 用户愿意主动声明专注状态
2. 简单规则能有效过滤消息
3. 暂存机制能减少焦虑

**成功标准**：
- 用户每天使用≥2次
- 用户反馈"确实有帮助"
- 7日留存率≥40%

如果MVP验证成功，再投入资源做更复杂的功能（AI判断、团队协作等）。

---

**文档版本**：v1.0
**创建日期**：2026-02-06
**基于**：作业一_痛点挖掘机.md
