# 私有 Analytics 配置说明

## 当前实现

网站仍由 GitHub Pages 托管。生产页面通过一个无 Cookie 的轻量 tracker，把 Page View 发送到 Cloudflare Worker；Worker 清洗数据后写入 D1。Dashboard 由同一个 Worker 托管，并在返回任何 HTML、JavaScript 或统计数据前验证 GitHub OAuth 登录。

真正的后台地址会是：

```text
https://nicolo-portfolio-analytics.<你的-workers.dev-子域名>.workers.dev/admin/
```

GitHub Pages 是静态托管，无法在 `shuai678.github.io/portfolio/admin` 上执行服务器端访问控制。因此不要把 GitHub Pages 上的隐藏路径当作私有后台。以后有自定义域名时，可以把 Worker 绑定到类似 `analytics.example.com`。

## 第一次配置

### 1. 登录 Cloudflare 并创建 D1

```bash
cd analytics
npx wrangler login
npx wrangler whoami
npx wrangler d1 create nicolo-portfolio-analytics
```

把命令返回的 `database_id` 填入 `analytics/wrangler.jsonc`。`wrangler whoami` 会显示你的 `workers.dev` 子域名。

### 2. 创建 GitHub OAuth App

进入 GitHub `Settings > Developer settings > OAuth Apps > New OAuth App`，填写：

```text
Application name: Nicolò Portfolio Analytics
Homepage URL: https://shuai678.github.io/portfolio/
Authorization callback URL: https://nicolo-portfolio-analytics.<你的子域名>.workers.dev/auth/callback
```

把公开的 Client ID 填入 `analytics/wrangler.jsonc` 的 `GITHUB_CLIENT_ID`。不要把 Client Secret 写入任何文件。

管理员校验使用 GitHub 稳定数字 ID `118019556`，对应 `Shuai678`。OAuth 不申请仓库、邮箱或其他额外权限，登录后取得的临时 GitHub token 会立即撤销。

### 3. 设置 Worker Secrets

分别运行以下命令，并在提示时输入随机密钥或 GitHub Client Secret：

```bash
npx wrangler secret put VISITOR_HASH_KEY
npx wrangler secret put SESSION_SIGNING_KEY
npx wrangler secret put GITHUB_CLIENT_SECRET
```

前两个值必须不同，并且至少 32 个随机字节。可以在本机生成：

```bash
openssl rand -base64 48
```

这些值由 Cloudflare 加密保存，不会进入浏览器或 GitHub Repository。

### 4. 初始化数据库并部署 Worker

从项目根目录运行：

```bash
npm run build:admin
cd analytics
npm run db:migrate:remote
cd ..
npm run analytics:deploy
```

### 5. 启用网站采集

在项目根目录创建不会提交到 Git 的 `.env.production.local`：

```dotenv
VITE_ANALYTICS_ENDPOINT=https://nicolo-portfolio-analytics.<你的子域名>.workers.dev/api/collect
VITE_ANALYTICS_HOSTS=shuai678.github.io
VITE_ANALYTICS_PATH_PREFIX=/portfolio
```

重新执行 `npm run build`，再把新的 `dist/` 发布到 GitHub Pages。`VITE_ANALYTICS_ENDPOINT` 是公开写入地址，不是 Secret；所有真正的 Secret 都只存在 Cloudflare。

## 数据与隐私

D1 的 `page_views` 表保存：服务端时间、规范化 pathname、页面标题、来源分类、两位国家代码、匿名访客哈希、匿名 session 哈希、设备大类和浏览器大类。

不会保存：原始 IP、完整 User-Agent、完整 referrer URL、URL query、URL hash、广告标识或跨站画像。IP 只在 Worker 请求内短暂参与带 Secret 的 HMAC，然后立即丢弃。浏览器只发送 referrer origin，不发送来源页面路径或搜索词；Worker 再把 origin 转换成 `Google`、`GitHub`、`Direct / Unknown` 等分类。无法获得 referrer 时不会猜测来源。国家来自 Cloudflare 边缘元数据，不调用第三方 GeoIP API。

公开网站不设置 Analytics Cookie。30 分钟 session ID 只存在当前标签页的 `sessionStorage`。tracker 尊重 Do Not Track 和 Global Privacy Control。访客也可访问一次 `?analytics=off` 在该浏览器退出统计，访问 `?analytics=on` 可恢复。

匿名访客数是估算值：Worker 使用 IP、浏览器大类和操作系统大类生成不可逆的加密哈希。共享网络可能少算，网络或浏览器变化可能多算。该方法在不永久保存完整 IP 和不设置长期标识之间做了折中。哈希仍可能被 GDPR 视为假名化数据，应在网站隐私说明中披露处理目的、保存期限和联系方式。由于实现无 Cookie、无广告和无跨站追踪，通常不需要为这个 tracker 单独设置 Cookie 横幅，但具体合法依据与意大利/欧盟要求应由你的实际隐私政策确认。

## 数据质量与安全行为

- 页面刷新计算一个新 Page View；同一匿名访客不会因此变成新的 Unique Visitor。
- 30 分钟无活动后创建新 session。
- 当前网站只有一个真实 pathname；`#about`、`#projects` 等页内锚点不重复计算页面。以后加入 SPA 路由时，tracker 会监听 History API 路径变化。
- Query Parameters 和 hash 不进入数据库；`/portfolio/` 在统计中规范化为 `/`。
- tracker 只在 production、允许的 hostname 且配置了 HTTPS endpoint 时运行，所以 localhost 不会进入生产数据。
- Worker 拒绝错误 Origin、过大/异常 payload、常见 bot User-Agent 和单访客每分钟超过 120 次的写入；event ID 唯一约束防止重放重复计数。
- 写入接口是公开网站所必需的，Origin 可被非浏览器客户端伪造，因此无法做到绝对防伪。当前限制适合低流量个人站点；发生攻击时可再启用 Cloudflare Rate Limiting 或 Turnstile。
- D1 没有公开连接地址。只有 Worker binding 能访问数据库，所有 `/api/admin/*` 查询在服务端验证管理员 session。
- Dashboard 的“Exclude my visits”会把当前 IP + 浏览器/系统组合加入排除表，并删除已有匹配事件。更换网络或浏览器后需要再次执行。

## 本地检查

```bash
npm run build
npm run build:admin
npm run analytics:check
```

Worker 本地开发还需要复制 `analytics/.dev.vars.example` 为 `analytics/.dev.vars`，填入仅用于本地的测试值，然后：

```bash
cd analytics
npm run db:migrate:local
npm run dev
```
