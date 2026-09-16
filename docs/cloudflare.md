# ARC providers 与 Cloudflare 部署

## 边界

- **ARC 通用 EVM provider**：位于兄弟 `arc` 仓库的 `providers/runtime/evm`，包名 `@aigne/afs-evm`。Node 与 Cloudflare 内置工厂均可配置 `evm` mount；不自动选择第三方 RPC。提供只读 RPC 白名单、chain ID 校验、精确原始数量、有限日志范围。OCAP 主网／测试网默认挂载不变。
- **FOMO provider**：本仓 `providers/fomo4good/provider.ts`，负责公开状态与受控 Practice actions。使用 ARC `AFSBaseProvider`，独立部署为私有 Worker，通过现有 `ServiceBindingProxy` 消费。服务端复用 ARC `createAFSHttpHandler({ protocol: "service-binding" })`，不在游戏内实现 AFS 协议。不提供任意账本写入、伪造链上事件或付款签名接口。
- **公共 API 网关**：`worker/gateway.mjs`，仅处理 `/api/*`，负责 Origin 检查、HttpOnly Cookie 及原生 CF rate limit；通过 `FOMO_PROVIDER` Service Binding 调用私有 Worker。页面、媒体、SEO 和路由由现有 ARC 站点原生提供。
- **游戏执行**：每个 campaign 固定一个 Durable Object，串行初始化及业务请求。alarms 负责离线结算 Practice 回合及推进测试网 watcher；重复执行由持久化游标、交易 ID、请求 ID 与 CAS 去重。alarm 可能延迟，判定使用原定回合时间和链上事件时间，不使用 alarm 到达时间。测试网 watcher 每两秒重新排期，有运行成本，停用时切回 practice 配置。
- **业务存储**：只调用官方 `CloudflareDIDSpace`，其云端后端是 R2 + D1。应用没有自建 SQL 表，也不把余额／账本／游标放进 DO storage；DO storage 只保存运行时 alarm。真实与 Practice 使用不同 instance DID。

## 已验证与尚未完成

已验证实际 workerd 产物，以及两个 Worker 经 ARC Service Binding transport 的读写；覆盖 FUSD session、扣款、重试不重复扣减、重启恢复、真实池保持零、账本路径拒绝、网关 Origin/Cookie 边界及仅 API 的路由边界。测试不调用真实支付，不部署云资源。

目前 Worker 仅允许 `practice` 或 `testnet`。**真钱收款仍关闭**；不能通过设置 `mainnet` 绕过验收。新云端 scope 不会自动导入本地账本。

已合入原生 ARC 页面与集合绑定，Worker 不再改写页面 HTML。本轮保留整账本 CAS；账本集合化、公开状态快照／订阅是后续独立改动；`batchWrite` 不是多记录事务，不能直接用来拆开扣余额和回合更新。EVM provider 不推断各链终局性；Arc Network 的原生 USDC emitter 解码留在支付适配层。

## 构建和验证

需要已建置的 ARC checkout，默认 `../arc`，可通过 `ARC_HOME` 指定。必须包含新的 EVM provider 和 HTTP handler 的 `service-binding` 协议选项；它与本仓修改是跨仓依赖。构建脚本从 checkout 的已建置 SDK 解析包，不依赖新包已经发布到 npm。

```sh
# 在 ARC checkout 内
pnpm build

# 在 FOMO4GOOD 内
npm ci
npm test
npm run test:provider
npm run build:worker
npm run test:worker
```

`test:provider` 需要 Bun。Worker 构建／测试复用 ARC 工具链中的 esbuild、Miniflare 和官方 DID Space 迁移收集器。构建输出在 `dist/worker/`，不提交。`test-host.mjs` 是测试产物，不是部署入口。

## 发布顺序

部署文件是模板，**不是已经部署成功的声明**。需要实际 Cloudflare account、公共域名、站点所在 zone、R2 bucket 和 DID Space D1 ID；不要保留占位符发布。

1. 沿用现有 GitHub Actions 发布 Blocklet 到 ARC：staging 是 fomo4good.afsd.io，production 的 SEO host 是 fomo4good.com；页面与资源继续由 ARC 承载。
2. 在 `worker/wrangler.jsonc` 中设置游戏 Worker 的实际 owner DID、campaign instance DID、R2 bucket 和 D1 database ID；使用独立数据库时应用构建生成的官方 `dist/worker/migrations/`，不要自行维护另一份 schema。
3. 部署私有 provider Worker。保持 `workers_dev: false`、`preview_urls: false`，不给它配置公共 route。Service Binding 的调用权是其可信边界；不要把 `/afs/*` 直接转发给互联网。
4. 在 `worker/gateway.wrangler.jsonc` 中设置 `FOMO_ORIGIN`、`FOMO_PROVIDER.service` 和实际 Cloudflare zone；route 只能是对应站点域名的 `/api/*`。不要绑定 `/*`，也不要用这个 Worker 接管 ARC 的页面域名。
5. 设置原生 rate-limit namespace，部署公共 gateway。gateway 缺少 rate-limit binding 时拒绝写请求。
6. 在实际域名验证三种语言、`/arc/` 首页、rules、teams、leaderboard 及其 `/arc/practice` 内页、Cookie、FUSD、两个池的隔离，以及关闭浏览器后回合能结算。再测试重启、RPC 暂时失败和重试去重。公网部署前不能以本地 Miniflare 通过代替验收。

示例命令（使用已配置的 Wrangler 身份与完成填值的配置）：

```sh
wrangler d1 migrations apply FOMO_INDEX --config worker/wrangler.jsonc --remote
wrangler deploy --config worker/wrangler.jsonc
wrangler deploy --config worker/gateway.wrangler.jsonc
```

本地实时预览仍可用 `npm run dev`，不依赖已发布的 Cloudflare Worker。它在测试网模式下也改经 ARC EVM provider 读取链。

参考：[Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/)、[Cloudflare alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)。

## 可复用的外部 provider 模式

ARC 已有 cost、Slack、X 的独立 Worker／DO 实践。本项目沿用其 Service Binding 连接方式，
不是创建另一套插件协议。职责边界：

| 能力 | 所属层 |
|---|---|
| AFS 路由、actions、metadata、错误和参数协议 | ARC `AFSBaseProvider` + HTTP handler |
| Worker 间调用 | ARC `ServiceBindingProxy` |
| 持久化、CAS、R2／D1 适配与迁移 | ARC DID Space SDK |
| Ethereum／EVM 只读访问 | ARC EVM provider |
| 回合、FUSD、捐赠归属、去重、链事件解释 | FOMO provider |
| 单活动串行执行、秒级唤醒 | Cloudflare DO／alarm 的薄部署适配 |

公共 gateway 仅绑定站点域名的 `/api/*`；没有页面转发、HTML 改写或 ARC_SITE binding。
页面使用最新 main 的原生 ARC 路由、AUP props 与集合绑定；发布流程保持现有 GitHub Actions。
匿名 Cookie 是 FUSD 的游戏会话身份，不是一套新的通用 IAM；需要真实用户身份时复用 ARC 认证。
不要从这层复制出另一套 IAM、存储、RPC 或页面框架。通用缺口补在 ARC，游戏只消费。

## GitHub Actions 部署入口

`Deploy Game Workers` 手动选择 staging 或 production，并传入已合并 ARC 的完整 commit SHA。
它使用既有组织／环境 secrets：`GIT_HUB_TOKEN`（只需读取私有 ARC 源码）、
`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。owner DID 由输入或环境变量
`FOMO_OWNER_DID` 指定；不使用本地演练占位身份。凭据／身份缺失时在创建任何资源前失败。

流水线复用 Wrangler 建立该环境专属 R2/D1、应用 ARC 官方迁移，再依次部署私有 provider
和 `/api/*` gateway。仅开启 FUSD Practice，staging 与 production 资源完全分离。
私有 ARC 源码、构建日志与 bundle 不上传到公共 Actions artifact 或仓库。
已有两个 Blocklet 发布工作流继续负责页面；Worker 发布不修改站点 DNS 或全站路由。
