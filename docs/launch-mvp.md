# FOMO4GOOD launch MVP（收敛版）

来源：原聊天「评估ARK消歧文章」及本任务的明确补充。不是新的产品 brainstorm。

## 固定范围

- `/arc` 为本次 campaign；`/` 跳转。首笔有效捐款才开始回合。
- 每笔有效捐款把倒计时重置为 10:00；不是累计加时。到零时，最后捐款人选定的慈善机构获得该回合全部金额；捐款人没有奖金。
- 5 队：KIDS / Save the Children；DOGS / Best Friends Animal Society；TREES / Rainforest Trust；WATER / charity: water；INTERNET / EFF。
- 1 / 5 / 10 / 100 / 自定义金额；可选名字、URL。无钱包连接、签名、DID 登录、智能合约或自动慈善转账。
- 生成六位精度的怪小数金额，额外小数少于一美分也计入捐款。intent 10 分钟有效，同一 campaign 内精确金额永不复用；过期或重复到账进入 Rogue。
- 单收款钱包 watcher。只监控配置的 Circle Arc USDC。确认时间按链上时间，链上排序按 block / transaction / log；RPC 恢复时按游标补齐，再关回合。
- Rogue Donors 独立地址榜、不重置倒计时、不选队。本实现采用原讨论中的固定默认机构方案：KIDS。该规则在发送前的页面说明中公开。
- 其他链/其他币不进入账本和保底，无恢复承诺。
- 社区金额和 ArcBlock 对每家机构的 $100 保底分账；补差不入排行榜。campaign 有固定开始/结束时间，到结束强制关闭正在进行的回合。
- campaign 结束后人工经慈善机构官方渠道汇总捐款。保留 intent、tx hash、from、18 位原始金额、时间、回合快照、最终获胜队和支付凭据。
- 本地预览和测试网醒目标记；不编造真实捐款、活跃度或已付款收据。

## 视觉

用户提供的像素原图是基准：近黑背景、蓝紫月球/窗口、浅绿荧光字、CRT 扫描线、黄色便利贴、连帽衫程序员和猫。

故意复古、土趣、自嘲；不能只是简陋。品牌始终 FOMO4GOOD；不缩写成另一家产品 FOMO。Built on ARC. Paid on Arc. 不暗示 Circle 或慈善机构背书。

## 已实现与真实上线边界

完整预览、DID Space 持久化、真实测试网 watcher 代码、私有 intent、公开账本投影、回合/总榜/Rogue 榜及历史。真实部署仍需确认网络资料、运营者 DID、专用钱包、campaign 日期和链上验收。当前不是已上线的真实募捐活动。
