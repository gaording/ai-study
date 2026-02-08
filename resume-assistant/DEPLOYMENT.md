# 简历助手部署指南

本应用是纯静态网站（HTML/CSS/JS），可以免费部署到多个平台。

---

## 方案一：GitHub Pages（推荐，完全免费）

### 优点
- ✅ 完全免费
- ✅ 自动集成 GitHub 仓库
- ✅ 支持自定义域名
- ✅ 自动 HTTPS

### 部署步骤

#### 1. 创建 gh-pages 分支
```bash
# 进入项目目录
cd /Users/gaorunding/Downloads/github/ai-study/resume-assistant

# 创建并切换到 gh-pages 分支
git checkout --orphan gh-pages

# 清空当前分支的所有文件（保留 .git）
git rm -rf .

# 复制 resume-assistant 目录的内容到当前目录
# 注意：只复制 index.html, css/, js/ 等必要文件
```

#### 2. 准备部署文件
在 `resume-assistant` 目录下创建一个 `.gitignore` 文件：
```
.DS_Store
node_modules/
*.log
```

然后执行：
```bash
# 添加所有必要文件
git add index.html css/ js/ .gitignore

# 提交
git commit -m "Deploy to GitHub Pages"

# 推送到远程
git push origin gh-pages
```

#### 3. 在 GitHub 上启用 Pages

1. 打开浏览器访问：https://github.com/gaording/ai-study/settings/pages

2. 在 "Source" 部分：
   - 选择 `gh-pages` 分支
   - 选择 `/ (root)` 目录

3. 点击 "Save"

4. 等待几分钟后，你的网站将发布在：
   **https://gaording.github.io/ai-study/**

---

## 方案二：Netlify（推荐，拖拽部署）

### 优点
- ✅ 完全免费
- ✅ 部署速度极快
- ✅ 支持拖拽上传
- ✅ 自动 HTTPS
- ✅ 表单处理功能

### 部署步骤

#### 方法 A：拖拽部署（最快）
1. 访问 https://netlify.com
2. 注册/登录账号
3. 将 `resume-assistant` 整个文件夹拖入 Netlify 网页
4. 等待几秒即可完成部署
5. 获得一个 `https://xxx.netlify.app` 的域名

#### 方法 B：从 GitHub 部署
1. 登录 Netlify
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub，授权访问 `gaording/ai-study` 仓库
4. 配置：
   - Build command: 留空（静态文件无需构建）
   - Publish directory: `resume-assistant`
5. 点击 "Deploy site"

---

## 方案三：Vercel（推荐，Next.js 官方）

### 优点
- ✅ 免费额度充足
- ✅ 部署速度极快
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS

### 部署步骤

#### 方法 A：拖拽部署
1. 访问 https://vercel.com
2. 注册/登录账号
3. 点击 "New Project"
4. 直接拖拽 `resume-assistant` 文件夹到页面
5. 等待部署完成

#### 方法 B：从 GitHub 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录执行
cd /Users/gaorunding/Downloads/github/ai-study/resume-assistant
vercel

# 按提示操作：
# - Set up and deploy: Y
# - Which scope: 选择你的账号
# - Link to existing project: N
# - Project name: resume-assistant
# - Directory: . (当前目录)
```

---

## 安全注意事项 ⚠️

### API Key 已暴露
当前代码中 API Key 是明文写在前端代码中的：

```html
<script>
    window.ZHIPU_API_KEY = 'b530d21ff0b748c39f874fb47a0e7689.Cc5D9ojd4y4myeB6';
</script>
```

### 风险
- ❌ 任何人都可以查看网页源代码获取 API Key
- ❌ 可能导致 API 配额被滥用
- ❌ 可能产生额外费用

### 解决方案

#### 方案 1：环境变量（部署平台支持）
在部署平台设置环境变量，前端通过 `fetch` 调用后端 API：

```javascript
// 示例：使用 Cloudflare Workers 作为 API 代理
const response = await fetch('/api/parse-resume', {
    method: 'POST',
    body: formData
});
```

#### 方案 2：服务端代理
创建一个简单的后端服务来隐藏 API Key：

```javascript
// server.js (Node.js + Express)
const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.post('/api/chat', async (req, res) => {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        headers: {
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`
        },
        body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
});

app.listen(3000);
```

#### 方案 3：临时测试
如果只是内部测试或演示，可以暂时保持现状：
- ✅ 仅分享给信任的人
- ✅ 定期检查 API 使用量
- ✅ 设置额度预警

---

## 自定义域名（可选）

### GitHub Pages
1. 在仓库根目录创建 `CNAME` 文件
2. 写入你的域名（如 `resume.example.com`）
3. 在域名 DNS 设置中添加 CNAME 记录指向 `gaording.github.io`

### Netlify / Vercel
1. 在平台控制台选择 "Domains"
2. 添加自定义域名
3. 按提示配置 DNS 记录

---

## 部署后测试

部署完成后，访问你的网站地址测试以下功能：

- [ ] 上传简历（图片/文档）
- [ ] 分析岗位（粘贴文本/上传截图/URL 抓取）
- [ ] 查看简历匹配度
- [ ] 生成面试准备材料
- [ ] 模拟面试（语音对话）

---

## 推荐方案总结

| 场景 | 推荐平台 | 理由 |
|------|---------|------|
| 个人测试/学习 | GitHub Pages | 免费、已集成 GitHub |
| 快速演示 | Netlify | 拖拽部署、速度最快 |
| 长期运营 | Vercel | 性能最佳、全球 CDN |
| 生产环境 | 需后端 + 域名 | 隐藏 API Key、独立域名 |

---

## 快速开始（最快方案）

如果你现在就想让网站可访问，最简单的方法：

```bash
# 1. 创建一个独立的 gh-pages 分支
cd /Users/gaorunding/Downloads/github/ai-study
git subtree push --prefix resume-assistant origin gh-pages

# 2. 等待推送完成后，在 GitHub 设置中启用 Pages
# 访问：https://github.com/gaording/ai-study/settings/pages
# 选择 gh-pages 分支作为 Source
```

5 分钟后，你的网站将上线：
**https://gaording.github.io/ai-study/**
