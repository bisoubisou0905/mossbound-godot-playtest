# 苔原小镇 · 三夜求生

[直接在线试玩](https://bisoubisou0905.github.io/mossbound-godot-playtest/)

Godot 原生版本的网页试玩包。打开网页即可开始，无需登录或安装。首次加载约 43 MB，后续会利用浏览器缓存。

## 怎么玩

- 开局逐次点击开拓包，翻出树、矿石和初始木石，再把阿苔拖到资源旁采集。
- 拖动最上层物品取一件；按住 Shift 拖动搬整堆。
- 把材料拖到顶部告示板完成订单，金币会掉回棋盘，点击收进钱袋。
- 主题包逐次翻出三件物资：保证一个有限资源点与原料，另有随机原料、木板或治疗药。
- 把 3 原木与 1 石料直接拖在一起，再把阿苔拖过去，自动制造木工作坊。无需选配方或确认；右上配方手记仅供查阅。
- 工坊加工也需要阿苔；拖走人物则暂停。点击材料组可以拆开并返还材料。当前同时支持一个建筑材料组。
- 木工作坊建成后出现木匠委托，石工作坊建成后出现修路委托，均可重复交付。任务只给金币，科技由玩家自行制造。
- 为阿苔制作装备，活过三夜。生命归零即结束。

按空格暂停。存档留在当前浏览器，重新打开时暂停；设备之间不自动同步。手机建议横屏，当前优先保证桌面操作体验。

## 发布

`web/` 是 Godot 4.7 Compatibility、单线程 Web 导出产物，使用 WebAssembly 与 WebGL 2。更新此目录并推送到 `main` 后，GitHub Actions 会实际运行 Chromium 检查采集、堆叠交付、订单奖励、金币收取、购买开包和配方窗口，通过后部署 GitHub Pages。

编辑用的 Godot 工程保留在本地；这个仓库存放可直接部署的网页构建、测试和部署配置。网页包不能通过双击 `index.html` 运行，应使用在线地址或 HTTP 服务器。

测试截图可在 Actions 的 `browser-checks` 附件查看。`?qa=1` 仅供独立自动检查，会禁用存档读写；正常试玩请使用不带参数的链接。

## 开源组件

- Godot Engine：[MIT 许可](web/licenses/GODOT_LICENSE.txt)与[第三方声明](web/licenses/GODOT_COPYRIGHT.txt)。
- 中文字体 Mossbound UI 是 Noto Sans SC 的字符子集与固定字重版本，已重新命名；原字体由 Noto Project Authors 提供，遵循 [SIL Open Font License 1.1](web/licenses/FONT_OFL.txt)。

这些组件的许可仅适用于对应组件。
