# 配置说明

## 📝 本地配置

此项目使用本地配置文件存储 API Key，避免敏感信息泄漏到远程仓库。

### 快速配置

1. **复制配置模板**
   ```bash
   cp config.example.js config.js
   ```

2. **编辑 `config.js`，填入你的 API Key**
   ```javascript
   window.CONFIG = {
       ZHIPU_API_KEY: 'your-api-key-here'  // 替换为你的真实 API Key
   };
   ```

3. **刷新页面** 即可使用

### 获取 API Key

访问 [智谱AI开放平台](https://open.bigmodel.cn/) 注册并获取 API Key。

### ⚠️ 重要说明

- `config.js` 已添加到 `.gitignore`，不会被提交到 Git 仓库
- `config.example.js` 是配置模板，会被提交到仓库
- 每个开发者需要自己创建 `config.js` 文件

### 部署时注意事项

如果要部署到公网，建议：

1. **不要将包含真实 API Key 的 `config.js` 部署到公网**
2. 使用环境变量或后端服务代理 API 请求
3. 定期更换 API Key

### 文件说明

```
resume-assistant/
├── config.js              # 本地配置（不提交，包含真实 API Key）
├── config.example.js      # 配置模板（提交到仓库）
├── .gitignore            # Git 忽略规则
└── index.html            # 主页面（引用 config.js）
```
