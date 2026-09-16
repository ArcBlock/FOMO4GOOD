[English](README.md) · **繁體中文** · [🤖 AI Slop](README.ai-slop.md)

<div align="center">

# FOMO4GOOD

### 贏家一無所獲。支持的慈善機構獲得全部。

**有點蠢。有點善良。建於 ARC。**

[哪個 Arc？](https://www.arcblock.io/en/which-arc/) · [跑起來](#跑起來) · [FUSD](#fusd)

<img src="blocklets/fomo4good/content/media/launch-pixel.jpg" alt="FOMO4GOOD 原始像素主視覺：連帽建造者、睡貓，以及過度複雜的行善計畫" width="840">

*原始發表主視覺。貓沒有參與程式碼審查。*

</div>

> **目前版本：演練可玩，真實捐款尚未開放。**
>
> 沒有啟用的收款地址。本實作尚未收取真實資金。海報很激動，但海報不是部署狀態頁。

## 財務上很糟，做人上還行

我們借用了 FOMO3D 的倒數焦慮，然後刪掉讓你致富的部分。非常激進的產品決策。慈善部門表示支持，「何時買藍寶堅尼」部門已讀不回。

1. **選慈善戰隊。** 真實活動開放後，轉入指定的精確 USDC 金額。
2. **搶下領先，重設為 10:00。** 不是再加十分鐘。就是十分鐘。閱讀理解也是遊戲的一部分。
3. **倒數歸零時成為最後捐款者。** 你選的慈善機構獲得本輪捐款池。你的個人獎金則極其穩定地維持在 **$0**。

第一筆成功配對的捐款開啟一輪。空池子不會頒給自己一座參與獎。遊戲中記錄分配，活動結束後才完成實際慈善捐款。

## 兩個 Arc，一個藉口

| 名字 | 負責什麼 |
| --- | --- |
| **[ARC 平台](https://www.arcblock.io/en/arc/)** | Blocklet/AUP 介面與 DID Space 儲存。 |
| **[Arc Network](https://arc.io/)** | 真實活動設定使用的 USDC 支付網路。 |
| **FOMO4GOOD** | 把命名問題變成大家的問題。 |

**[搞混了？符合預期。](https://www.arcblock.io/en/which-arc/)**

「跟 Arc 整合得多深？」<br>
「我們在上面收 USDC。」<br>
「就這樣？」<br>
「就這樣。那可是錢。」

## 五支戰隊，沒有壞人

| 戰隊 | 慈善機構 | 科學依據 |
| --- | --- | --- |
| 👶 KIDS／兒童 | [Save the Children](https://www.savethechildren.org/) | 他們是未來。據說啦。 |
| 🐶 DOGS／狗狗 | [Best Friends Animal Society](https://bestfriends.org/) | 客觀來說，都是乖狗狗。 |
| 🌳 TREES／樹木 | [Rainforest Trust](https://www.rainforesttrust.org/) | 至今仍在免費碳捕捉。 |
| 💧 WATER／飲水 | [charity: water](https://www.charitywater.org/) | 意外地重要。 |
| 🛡️ INTERNET／網路 | [Electronic Frontier Foundation](https://www.eff.org/) | 值得拯救。大概吧。 |

**真實活動中，ArcBlock 保證每個慈善機構至少獲得 100 美元**，補足社群分配後的差額。補款不買排行榜名次。就算沒人玩，五個機構合計仍有 500 美元。我們的自尊則獲得學習機會。

**ArcBlock 將在活動結束後、2026 年 12 月 31 日前完成活動慈善捐款，並公布憑證。** 分配紀錄不是收據。「代理說它已經匯了」也不是收據。

## FUSD

### PRACTICE ROUND／演練回合

**一樣 FOMO。錢是假的。沒有人受傷。**

永久演練入口是 `/arc/practice`。每個瀏覽器身分起手 **1,000 FUSD**。選隊、花假錢、重設同樣的十分鐘倒數。餘額不到 1 FUSD，就能免費再印 1,000。終於有一套貨幣政策，一個按鈕就裝得下。

| FUSD — Fake United States Dollar | 完全沒人審計 |
| --- | --- |
| 發行方 | FOMO4GOOD，高度中心化。 |
| 供給 | 無限發行。 |
| 擔保 | 沒有。 |
| 儲備 | 也沒有。 |
| 價值 | **$0.00** |
| 穩定性 | 令人驚嘆地穩定在零。 |
| 慈善實收 | **這裡的金額，一毛都收不到。** |

**FUSD 不是加密貨幣。我們沒空做一個。**

它只是獨立 DID Space 裡的鏈下演練點數：沒有合約、錢包資產、交易所上架、提領或現金價值。演練的餘額、獎池、排名和勝場**絕不**進入真實募款或慈善分配。真實活動的保底與捐款期限不適用於 FUSD。

贏下演練後，我們會問：**「想用真正存在的 1 美元試試嗎？」** 真實收款尚未開放時，入口會明確說明。我們願意幻想貨幣，不願意幻想付款系統已上線。

## 大家經常迴避的問題

**誰寫的？**<br>
AI agents 全程上場。人類負責指揮，並提供可疑點子。找到 bug？恭喜，你發現了軟體。

**所以 bug 是功能？**<br>
不是。我們會修，不會要求你加強信仰。測試通過了，全知全能還不在需求範圍內。

**為什麼是 10.004237 USDC？**<br>
奇怪的小數用來配對真實付款要求；不到一美分的零頭也會捐出。老派嗎？是。有效嗎？也是。請保密，並在到期前只轉入一次精確金額。FUSD 演練不需要這套儀式。

**我直接轉了 5,000，怎麼沒贏？**<br>
因為你捐了款，沒玩遊戲。監看的 Arc Network 上，直接、逾期或未配對的 USDC 會成為 KIDS 的野生捐款，只列在獨立的地址榜單，不重設倒數。

**可以從別的鏈轉嗎？**<br>
其他網路或代幣不屬於本活動及保底範圍，不承諾找回、退款或捐出。「可是它也叫 Arc」不是跨鏈協議。

**到底該信什麼？**<br>
核對 Arc 轉帳紀錄與 ArcBlock 的實際捐款憑證。介面可以出 bug，笑話可以不好笑；都不能把不存在的收據變成捐款。

**ArcBlock 得到什麼？**<br>
希望是你的注意力。這份 README 已經比我們的商業模式還長。

## 跑起來

需要 **Node.js 22.13+**，以及位於相鄰 `../arc` 的**已建置 ARC 原始碼**，或設定 `ARC_HOME`。CLI 與 DID Space SDK 從該目錄載入；本倉庫不包含 ARC 執行環境。

```sh
npm ci
npm test
npm run check
npm run dev
```

| 本地頁面 | 用途 |
| --- | --- |
| `http://fomo4good.localhost:4930/arc/` | 真實活動入口，目前未開放收款。 |
| `http://fomo4good.localhost:4930/arc/practice/` | 永久 FUSD 演練。 |
| `/arc/teams`, `/arc/leaderboard`, `/arc/rules` | 戰隊、紀錄、玩法與 FAQ。 |
| `/arc/practice/teams`, `/arc/practice/leaderboard`, `/arc/practice/rules` | 上述內容的幻想版本。 |

每頁都有即時倒數與參與入口。支援英文、**繁體中文**與 **🤖 AI Slop**，語言會跨頁保留。中文故意只有繁體：字可以繁，付款別繁。切換語言不會幫你把 FUSD 翻譯成真錢。

`npm run dev` 用獨立的 ARC 實例（**4930**）直接提供 Blocklet；頁面就是 ARC 網頁，前面沒有任何代理。沒有啟動活動服務（`npm start`，目前仍是獨立程序）時，每頁都會顯示「尚未開放」狀態。用完後停止實例：

```sh
node ../arc/runtimes/node/dist/cli.mjs service stop --instance fomo4good-local
```

發佈只需對 ARC 主機下一條命令——Blocklet 會進入你的 DID Space，並在 `https://fomo4good.<主機網域>/` 回應：

```sh
arc deploy blocklets/fomo4good --server https://<arc-host> --token <deploy-token>
```

## 連帽衫下面是什麼

- **ARC Blocklet + AUP** 渲染介面；**配套 Node 服務**負責活動 API 與鏈上監看。目前需要兩個服務，單獨的 Blocklet 產物只包含介面。
- **應用資料只存 DID Space**，使用官方 ARC SDK 與 AFS。沒有應用自行操作的 SQLite 或備援資料庫；SDK 的內部索引由 SDK 管理。
- 真實與演練資料使用**獨立根目錄與實例 DID**。餘額和回合更新透過版本檢查一起寫入，重試不會讓同一筆演練操作扣兩次。
- 真實付款處理保留完整整數精度並去除重複鏈上事件。不接收私鑰、不要求錢包簽名，也不自動向慈善機構付款。

**目前僅驗證測試網設定。** 開放真實收款前，仍需設定並核實主網、收款地址、活動日期及鏈上驗收。這是主辦方運作的實驗，不是智慧合約託管。

[開發細節](docs/development.md) · [運行與對帳](docs/operations.md) · [MVP 決策](docs/launch-mvp.md) · [梗的出處](docs/copy-map.md)

## 工作證明，真的有工作

```sh
npm test        # 14 項測試：儲存、金額、隔離、重試、語言、客戶端流程
npm run check   # ARC lint、驗證、Blocklet 檢查與建置
npm run smoke   # 需先啟動本地應用；新增明確標示的 FUSD 演練操作
```

`smoke` 檢查頁面路由、公開邊界、身分餘額，以及真實／演練隔離；真實收款啟用時拒絕執行。瀏覽器中也驗證了 FUSD 流程。笑話的統計顯著性依然完全沒有。

<div align="center">

<a href="https://github.com/ArcBlock/FOMO4GOOD"><img src="blocklets/fomo4good/content/media/git-oops.svg" alt="Git Oops：原創歪眼像素程式貓" width="112"></a>

### GIT OOPS™

*原始碼開放。個人獎金歸零。貓已經下班。*

</div>

## 授權與大人話

程式碼採 [MIT 授權](LICENSE)。提供的發表主視覺另有權利歸屬，不自動納入程式碼授權。VT323 隨附 [OFL 授權](blocklets/fomo4good/content/media/VT323-LICENSE.txt)。Git Oops 是本專案的原創惡搞吉祥物，不是 GitHub 官方標誌。

FOMO4GOOD 是由 ArcBlock 主辦的獨立實驗。提及 Circle、Arc Network 與列出的慈善機構，只是在說明基礎設施、資產或預定捐款對象；不構成夥伴關係、贊助、背書、代理或聯合推廣。相關名稱與標誌屬各自權利人。本專案也與 FOMO3D 作者無關。捐款不是投資，沒有財務回報。演練版提供同等回報，手續顯著更少。

[Cloudflare 部署](docs/cloudflare.md) — 部署步驟與目前驗證範圍。
