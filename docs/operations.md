# 运行与资金核对

## 数据

应用仅经 DID Space AFS 操作 `campaign/ledger.json`；本地布局为 owner DID / blocklets / instance DID / system。不要手工编辑账本或对该目录做外部 JSON 写入。使用 DID Space 的备份/同步工具备份整个 scope，测试恢复后再启动 watcher。

预览和测试网使用不同 instance 与目录。模式、钱包、网络、起始块、日期、队伍或规则改变会触发配置绑定错误，应用拒绝打开旧账本。需要恢复原配置或新建独立 campaign，而不是删除保护。

金额全程使用 18 位整数；界面主金额显示两位，精确付款金额保留六位，公开原始记录保留完整精度。金额代码 0.000001–0.009999，永不复用，避免迟到付款匹配新订单。网页关闭不会影响后台 watcher。

## 单实例运行

一个 campaign 仅运行一个应用服务和一个 watcher。应用先占用端口再初始化数据；同端口重复启动会失败。不要用不同端口启动同一尚未初始化的 campaign。启动后 AFS 版本写入保护防止并发覆盖。

停止或故障后，用同配置和 DID Space 重启。RPC 重试从上次成功提交的游标继续。UI 在 watcher 落后时显示暂停；已经发出的转账仍由补扫处理。不要因重试而要求用户再付款。

检测到已保存块哈希变化时停止并人工核对。当前网络具有确定性终局，代码不会自动回滚已分配金额。历史遗留 pre-Zero5 事件不在此 watcher 支持范围；必须从当前事件机制生效后的 campaign 起始块开始。

## campaign 结束

1. 等待 watcher 游标时间超过 campaign 结束时间，最后一个回合写入历史。
2. `npm run report`（使用已配置的 `.env`；本地预览可用 `FOMO_MODE=preview npm run report`）在终端输出资金分配、各队补差和对账结果，不包含私有未支付 intent。
3. 每队应付 = 该队已关闭回合金额 + 分配给该队的 Rogue + max(0,100 USDC - 前两项)。社区金额不包含 ArcBlock 补差。
4. 通过机构官方渠道人工付款；不假设机构收 Circle Arc。汇兑和手续费由运营方另外覆盖，不能减去已承诺的慈善金额。
5. `node --env-file=.env scripts/receipt.mjs --team kids --url https://... --reference ... --paid-usd 100.00` 仅记录已完成付款的凭据，不执行转账。必须 campaign 已结束且 watcher 已越过结束点。凭据存入同一 DID Space。
6. 公布可公开的收据链接；不要放含账户、地址、凭证等隐私的原始账单。补差与社区金额分别记录。

预览的报告与凭据仅是模拟数据，不能宣传为已真实捐款。

## 网络参考（2026-09-15 阅读）

- https://docs.arc.io/arc/references/connect-to-arc：可核实的 Testnet 5042002 配置。
- https://docs.arc.io/arc/references/usdc-system-events：系统 emitter `0xfffffffffffffffffffffffffffffffffffffffe`，18 位 Transfer；ERC-20 镜像 6 位，不能双计。
- https://docs.arc.io/build/evm-differences：非递减块时间、确定性终局、native 转账日志。

官方 index 写 Testnet only，但事件历史页面提及 mainnet，资料有不一致；本实现不推测真实 mainnet 参数。底层只支持 preview/testnet 配置，公共真实捐款 API 在两种配置下都不开放；公共演练使用独立的 FUSD Practice。

## ARC 集成与 Cloudflare

本地开发仍使用 companion Node service。测试网 watcher 已改经 ARC 通用 EVM provider 读取链。独立游戏 AFS provider 与 Cloudflare 公共网关／私有 Worker 已实现，本地 workerd 验证通过；云端资源、域名和发布验收尚未完成。部署边界、跨仓依赖与验证步骤见 [Cloudflare 部署](cloudflare.md)。

## 静态字体

当前 ARC content media 路由只允许图片/影音/PDF，不直接提供字体。VT323 以 data URL 随组件 CSS 打包；原始 TTF 和 OFL 许可证随仓库保留。不需要额外字体服务，也没有修改 ARC 内部代码或伪装文件扩展名。

## 永久 FUSD 演练

入口 `/arc/practice`，API `/api/practice/*`。独立 DID Space：默认 `var/practice/spaces`、owner `did:abt:fomo4good-practice-owner`、instance `did:abt:fomo4good-practice-v1`。不迁移旧 preview 数据，不与真实账本共用根目录，不读取真实付款 intent，也不输出真实捐款凭据。

Practice 没有结束日期。浏览器 HttpOnly Cookie 对应匿名玩家，初始 1,000 FUSD；不足 1 FUSD 可再领 1,000。保留 Cookie 才能恢复该浏览器身份；更换身份可以领取新点数，这些点数没有金钱价值。余额和回合变化一起通过 AFS 版本写入；同一请求 ID 重试不重复扣减。规则用服务端时间，重启后按原结束时间结算。

真实活动尚未配置时 `/api/fomo/state` 返回明确的 unavailable 状态和零真实捐款，不暴露旧 preview/testnet 数字；真实付款与旧 preview-confirm 写接口拒绝请求。不得把 FUSD 余额、排行榜、幻想分配或练习收据用于真实募款核对。现有 report/receipt 工具不连接 Practice scope。

对两个 scope 分别备份。当前仍为整份账本 CAS；长期高流量演练需要在保留余额、总排名和请求去重的前提下另行实现归档，不能直接清空账本。
