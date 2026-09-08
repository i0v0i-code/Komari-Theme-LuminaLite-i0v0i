# Komari-Theme-LuminaLite-i0v0i

[JohnsonRan/Komari-Theme-LuminaLite](https://github.com/JohnsonRan/Komari-Theme-LuminaLite) 的定制 fork，保留上游历史与作者署名，不另行声明上游代码许可。此版本将首页延迟监测改为 **一个监测任务一行**，名称与自己的指标直接对应，无需切换标签。

- 名称固定在左侧；建议使用「地区 + 运营商」，例如 `福建联通`、`福建移动`、`福建电信`。
- 右侧延迟与丢包数字对齐，保留各自的历史趋势；窄卡片优先保留名称和数字。
- 长名称截断并保留完整名称提示，不更改后端任务名称。
- 未知数据不伪装成正常值；沿用上游任务选择、颜色与数据接口。

## 构建与安装

```bash
npm ci
npm run lint
npm test
npm run package
```

将生成的 `Komari-Theme-LuminaLite-i0v0i-v*.zip` 上传到 Komari 后台的主题管理，再选择本主题。不要上传 GitHub 的源码 ZIP。新主题沿用上游设置键，但名称不同，切换时请核对原主题设置是否需要重新填写。

重新生成预览：先运行 `npm run dev -- --host 127.0.0.1 --port 5199`，再运行 `CHROMIUM_PATH=/path/to/chrome npm run package`。仓库预览使用上游开发模式演示数据，不代表真实服务器。

[Komari](https://github.com/komari-monitor/komari) 监控面板的增强主题，在 [Komari-Theme-LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus) 的基础上进一步深度定制。

> 原版 LuminaLite 由 Komari-Theme-LuminaPlus 分支独立演化而来；本仓库保留对 JohnsonRan/LuminaLite 的 fork 关系。感谢原作者 [shanyang242](https://github.com/shanyang242) 的 LuminaPlus，以及更上游 [stqfdyr](https://github.com/stqfdyr) 的 [komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina) 打下的基础。

## 主要特性

### 首页
- 总览卡片（在线/离线、CPU、内存、流量等）与四种节点视图（大 / 小 / 迷你 / 列表），加载时显示与真实卡片结构对应的骨架屏。
- 分组标签、地区栏、自定义排序；支持隐藏节点。
- 背景图与卡片透明度调节，玻璃 / 实底两种质感。

### 主题设置
- 通过 Komari 官方后台 **主题设置**（`/admin/theme_managed`）配置，由 `komari-theme.json` 的 managed configuration 生成表单（外观 / 视图 / 背景 / 配色 / 首页 / 节点 / 卡片 / Ping / 详情 等分类 TAB）。
- 外观（亮 / 暗 / 跟随系统）、默认视图、背景、首页巡检、隐藏节点、小卡片显示项、延迟检测、指标配色等均可配置。
- **主页延迟检测**：在 Komari 的 Ping 任务中绑定服务器，主题设置可限制展示任务；留空时按权重选择每个服务器的前三项。各监测任务独占一行，名称、延迟、丢包和历史状态一一对应，不再使用共享图表的切换标签。
- 卡片配色（各项指标颜色与暗色背景深度）在官方表单中以扁平字段编辑，保存后对所有访客生效。

### 节点详情页
- **分栏布局**：左侧固定服务器列表、右侧详情与图表，点击即可切换节点（可在官方主题设置中开关，窄屏自动收为单列）。
- 实时信息（状态、CPU、内存、磁盘、网络、流量、在线时长等）与系统信息展示。
- 负载图表（CPU / 内存 / 磁盘 / 网络 / 连接数 / 进程）与 Ping 延迟 / 丢包图表。
- 图表支持**点击固定 tooltip**、**滚轮缩放时间轴**，点击刷新按钮重置；内存 / 磁盘图表可切换为按字节（MB / GB）显示，实时网速支持自适应 / MB·s / Mbps 三种单位。

### 其他
- 资产统计、流量页面、离线状态提示、国旗与地区展示。
- 移动端适配：吸顶栏收为纯图标、导航横向滑动、卡片与图表针对窄屏优化。

## 致谢

- [JohnsonRan/Komari-Theme-LuminaLite](https://github.com/JohnsonRan/Komari-Theme-LuminaLite) — 本 fork 的直接上游。
- [shanyang242/Komari-Theme-LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus) — LuminaLite 的来源。
- [stqfdyr/komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina) — LuminaPlus 的上游。
- 也感谢 Komari 官方主题、Mochi、PurCarte 等主题项目为 Komari 生态提供的设计和实现思路。

## 参考

- [Komari](https://github.com/komari-monitor/komari)
- [Komari 主题开发文档](https://komari-document.pages.dev/)

## 本地 UI 审查

无需连接 Komari 后端也可以检查完整数据界面：

```bash
npm run dev -- --host 0.0.0.0
```

打开开发地址并追加 `?mock=1`。该模式只在 Vite 开发环境启用，会提供正常、高负载、临期、离线、多地区与多币种节点；生产构建不会包含这份测试数据。去掉查询参数即可恢复真实接口。
