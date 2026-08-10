const STORAGE_PREFIX = "shiqi_v2_";
const VERIFICATION_CODE_COOLDOWN_SECONDS = 60;

export const CATEGORY_META = [
  { name: "AI 对话写作", slug: "writing", icon: "pen", desc: "写作、翻译、知识问答与研究" },
  { name: "AI 绘画设计", slug: "design", icon: "palette", desc: "图像生成、设计与创意表达" },
  { name: "AI 编程辅助", slug: "coding", icon: "code", desc: "代码生成、调试与开发提效" },
  { name: "AI 办公效率", slug: "office", icon: "briefcase", desc: "演示、文档、表格与会议" },
  { name: "AI 视频音频", slug: "media", icon: "video", desc: "视频、配音、音乐与剪辑" },
  { name: "Agent 与自动化", slug: "agent", icon: "workflow", desc: "智能体、工作流与自动执行" },
];

export const SOFTWARE_CATEGORIES = ["在线工具", "桌面软件", "浏览器扩展", "开发工具"];

export const SEED_RESOURCES = [
  {
    id: "chatgpt", name: "ChatGPT", logo: "GPT", category: "AI工具", subcategory: "AI 对话写作",
    tags: ["新手友好", "知识问答", "内容创作"], color: "#d7f6e8", logoColor: "#17664a",
    short: "覆盖写作、分析、学习与创意工作的通用型 AI 助手。",
    description: "ChatGPT 是一款通用型 AI 助手，适合完成信息整理、文案写作、思路拓展、代码解释等多类任务。它的优势在于自然的对话体验与广泛的任务覆盖能力，既适合第一次接触 AI 的用户，也能融入专业工作流。",
    features: ["自然语言多轮对话", "写作润色与内容改写", "文件理解与信息提炼", "适合广泛工作和学习场景"],
    tutorial: ["先用一句话说明你的目标与最终交付物。", "补充受众、语气、长度等限制条件。", "针对初稿继续追问并逐轮优化结果。"],
    scenarios: ["日常写作", "学习辅导", "信息分析"], rating: 4.8, ratings: 2384, views: 68520, favorites: 8270,
    updated: "2026-08-02", created: "2026-02-14", featured: true, status: "online", source: "运营收录", website: "https://chatgpt.com"
  },
  {
    id: "claude", name: "Claude", logo: "CL", category: "AI工具", subcategory: "AI 对话写作",
    tags: ["长文档", "内容创作", "需特殊网络"], color: "#f5dfcf", logoColor: "#9d4f2e",
    short: "擅长长文档理解、严谨写作和复杂信息归纳的 AI 助手。",
    description: "Claude 强调清晰、自然且有结构的输出，在长文本阅读、内容创作、需求梳理和代码理解等场景中表现出色。适合需要处理复杂材料并保持上下文连贯的用户。",
    features: ["长文本阅读与总结", "结构化写作", "复杂问题拆解", "代码理解与解释"],
    tutorial: ["上传或粘贴需要处理的完整材料。", "说明你关注的重点和不希望遗漏的信息。", "要求按表格、提纲或指定格式交付。"],
    scenarios: ["长文档分析", "专业写作", "需求梳理"], rating: 4.8, ratings: 1649, views: 47210, favorites: 5942,
    updated: "2026-07-30", created: "2026-03-01", featured: true, status: "online", source: "运营收录", website: "https://claude.ai"
  },
  {
    id: "midjourney", name: "Midjourney", logo: "MJ", category: "AI工具", subcategory: "AI 绘画设计",
    tags: ["图像生成", "创意设计", "需一定基础"], color: "#d9ddf7", logoColor: "#343f96",
    short: "以高质量视觉表现见长的 AI 图像生成与创意探索工具。",
    description: "Midjourney 适合概念设计、插画、海报与视觉风格探索。通过自然语言描述画面、构图、光线和质感，即可快速生成多种视觉方向，是设计师与内容创作者常用的灵感工具。",
    features: ["高质量图像生成", "丰富的艺术风格", "构图与画面控制", "连续变体与局部调整"],
    tutorial: ["明确主体、场景、光线与画面风格。", "加入镜头、材质和色彩等视觉关键词。", "从首轮结果中选择方向并生成变体。"],
    scenarios: ["概念设计", "商业插画", "视觉灵感"], rating: 4.7, ratings: 1194, views: 38800, favorites: 5210,
    updated: "2026-07-28", created: "2026-02-20", featured: true, status: "online", source: "运营收录", website: "https://www.midjourney.com"
  },
  {
    id: "cursor", name: "Cursor", logo: "CU", category: "AI工具", subcategory: "AI 编程辅助",
    tags: ["代码生成", "开发者", "效率提升"], color: "#d9d9d6", logoColor: "#191a17",
    short: "将 AI 对话、代码补全与仓库理解融入编辑器的编程助手。",
    description: "Cursor 是面向开发者的 AI 代码编辑器，可以结合当前项目上下文完成代码生成、重构、解释和调试。它把对话能力嵌入日常编码环境，减少在编辑器与聊天工具之间切换的成本。",
    features: ["基于仓库上下文问答", "多文件代码修改", "智能代码补全", "终端与错误辅助"],
    tutorial: ["打开现有代码仓库并等待索引完成。", "在对话中明确需要修改的文件与验收标准。", "逐项检查变更并运行项目测试。"],
    scenarios: ["快速开发", "代码重构", "陌生项目理解"], rating: 4.9, ratings: 2130, views: 62390, favorites: 8960,
    updated: "2026-08-04", created: "2026-01-22", featured: true, status: "online", source: "运营收录", website: "https://www.cursor.com"
  },
  {
    id: "gamma", name: "Gamma", logo: "G", category: "AI工具", subcategory: "AI 办公效率",
    tags: ["PPT生成", "新手友好", "内容排版"], color: "#eadbff", logoColor: "#6d39a6",
    short: "从主题或文档快速生成结构清晰、视觉统一的演示内容。",
    description: "Gamma 将内容结构与视觉排版结合，用户可以从一句话、提纲或现有文档开始生成演示、网页式报告和社交内容。适合快速制作初稿，再进行品牌化和细节调整。",
    features: ["一句话生成演示", "自动结构与排版", "网页式内容发布", "主题与品牌样式"],
    tutorial: ["输入演示主题、受众与预计页数。", "检查 AI 生成的提纲并调整逻辑。", "选择主题样式，再完善案例与数据。"],
    scenarios: ["工作汇报", "课程展示", "提案初稿"], rating: 4.6, ratings: 907, views: 32110, favorites: 4018,
    updated: "2026-07-24", created: "2026-03-18", featured: true, status: "online", source: "运营收录", website: "https://gamma.app"
  },
  {
    id: "runway", name: "Runway", logo: "RW", category: "AI工具", subcategory: "AI 视频音频",
    tags: ["视频生成", "创意制作", "需一定基础"], color: "#cfe9ff", logoColor: "#0c619f",
    short: "面向创作者的 AI 视频生成、编辑与视觉效果工作台。",
    description: "Runway 提供从文字或图像生成视频、画面编辑、背景处理等能力，帮助创作者快速探索镜头和视觉效果。适合广告概念、短片预演和社交媒体内容制作。",
    features: ["文字与图片生成视频", "画面扩展与重绘", "背景与对象处理", "多种创意视频工具"],
    tutorial: ["准备清晰的首帧图片或镜头描述。", "设置画面运动、镜头方向和时长。", "生成多个版本后再进入剪辑流程。"],
    scenarios: ["短视频制作", "广告创意", "镜头预演"], rating: 4.5, ratings: 735, views: 28640, favorites: 3550,
    updated: "2026-07-19", created: "2026-04-07", featured: false, status: "online", source: "运营收录", website: "https://runwayml.com"
  },
  {
    id: "perplexity", name: "Perplexity", logo: "PX", category: "AI工具", subcategory: "AI 对话写作",
    tags: ["联网搜索", "资料研究", "引用来源"], color: "#cdf2ef", logoColor: "#08726b",
    short: "以答案为导向、附带来源线索的 AI 搜索与研究工具。",
    description: "Perplexity 将搜索与对话结合，适合快速了解一个主题、梳理资料脉络并继续追问。它会在答案中提供来源线索，便于进一步核验和阅读原始材料。",
    features: ["对话式联网搜索", "答案来源线索", "多轮研究追问", "主题资料整理"],
    tutorial: ["先提出具体、可验证的研究问题。", "查看引用来源并打开关键原文。", "继续要求比较观点或整理结论。"],
    scenarios: ["快速调研", "竞品分析", "学习检索"], rating: 4.7, ratings: 1420, views: 49600, favorites: 6120,
    updated: "2026-08-01", created: "2026-02-28", featured: true, status: "online", source: "运营收录", website: "https://www.perplexity.ai"
  },
  {
    id: "dify", name: "Dify", logo: "DF", category: "AI工具", subcategory: "Agent 与自动化",
    tags: ["开源", "工作流", "开发者"], color: "#d7e1ff", logoColor: "#3558bb",
    short: "用于构建、编排和发布 AI 应用与智能体的开源平台。",
    description: "Dify 提供可视化工作流、知识库、模型接入与应用发布能力，帮助团队更快搭建面向具体业务场景的 AI 应用。既适合原型验证，也方便开发者继续扩展。",
    features: ["可视化 AI 工作流", "知识库检索", "多模型统一接入", "应用发布与 API"],
    tutorial: ["创建应用并选择对话或工作流模式。", "配置模型、提示词与必要的知识库。", "在调试区验证后发布为网页或 API。"],
    scenarios: ["知识库问答", "业务智能体", "AI 应用原型"], rating: 4.6, ratings: 812, views: 30920, favorites: 4280,
    updated: "2026-07-31", created: "2026-04-11", featured: false, status: "online", source: "运营收录", website: "https://dify.ai"
  },
  {
    id: "coze", name: "扣子 Coze", logo: "CZ", category: "AI工具", subcategory: "Agent 与自动化",
    tags: ["国内可用", "智能体", "新手友好"], color: "#e1dcff", logoColor: "#5139a5",
    short: "通过插件、知识库与工作流快速搭建和发布 AI 智能体。",
    description: "扣子提供可视化智能体搭建能力，用户可以组合提示词、插件、知识库和工作流，快速制作具备具体能力的机器人，并发布到不同渠道。",
    features: ["可视化智能体搭建", "插件与知识库", "多步骤工作流", "多渠道发布"],
    tutorial: ["明确智能体的角色、目标和回答边界。", "按需添加知识库、插件与工作流。", "使用多组真实问题测试后再发布。"],
    scenarios: ["客服机器人", "个人助理", "流程自动化"], rating: 4.5, ratings: 986, views: 35210, favorites: 4490,
    updated: "2026-07-26", created: "2026-03-29", featured: false, status: "online", source: "运营收录", website: "https://www.coze.cn"
  },
  {
    id: "kimi", name: "Kimi", logo: "KM", category: "AI工具", subcategory: "AI 对话写作",
    tags: ["国内可用", "长文档", "新手友好"], color: "#d8ebff", logoColor: "#255e9e",
    short: "适合长文阅读、信息检索与日常工作的中文 AI 助手。",
    description: "Kimi 面向中文用户提供对话、搜索、长文档阅读和内容处理能力。界面易上手，适合学生、职场用户快速整理材料、生成提纲与理解复杂内容。",
    features: ["中文对话体验", "长文档阅读", "联网信息检索", "文案与提纲生成"],
    tutorial: ["上传文档或直接描述需要完成的任务。", "说明希望输出的结构、长度和语气。", "对关键事实和引用内容进行二次核验。"],
    scenarios: ["论文阅读", "办公写作", "资料总结"], rating: 4.6, ratings: 1764, views: 53780, favorites: 7030,
    updated: "2026-08-03", created: "2026-02-10", featured: true, status: "online", source: "运营收录", website: "https://www.kimi.com"
  },
  {
    id: "canva-ai", name: "Canva AI", logo: "CA", category: "AI工具", subcategory: "AI 绘画设计",
    tags: ["在线设计", "新手友好", "模板丰富"], color: "#cdeff1", logoColor: "#087781",
    short: "把文字生成、图片编辑与海量模板整合在一起的设计平台。",
    description: "Canva AI 将多种生成式能力放进成熟的在线设计流程，适合非专业设计用户快速制作社交媒体图片、演示、海报与短视频。模板与协作能力让内容落地更加顺畅。",
    features: ["模板化在线设计", "文字生成图片", "智能排版与改写", "团队协作与分享"],
    tutorial: ["从目标尺寸或合适的模板开始。", "使用 AI 生成文案和视觉素材。", "统一品牌字体、色彩并检查导出尺寸。"],
    scenarios: ["社媒配图", "活动海报", "演示设计"], rating: 4.5, ratings: 1052, views: 36840, favorites: 4322,
    updated: "2026-07-22", created: "2026-03-08", featured: false, status: "online", source: "运营收录", website: "https://www.canva.com"
  },
  {
    id: "notion-ai", name: "Notion AI", logo: "NA", category: "AI工具", subcategory: "AI 办公效率",
    tags: ["知识管理", "文档写作", "团队协作"], color: "#e4e3dc", logoColor: "#22231f",
    short: "嵌入知识库和团队文档中的写作、总结与信息问答助手。",
    description: "Notion AI 将内容生成、总结、翻译和工作区问答融入文档与知识库。对于已经使用 Notion 管理项目和知识的团队，它能减少信息查找与重复整理的时间。",
    features: ["文档写作与改写", "会议记录总结", "工作区知识问答", "数据库内容辅助"],
    tutorial: ["先建立结构清晰的团队文档与知识库。", "在页面内调用 AI 完成总结或初稿。", "使用工作区问答查找分散的信息。"],
    scenarios: ["团队知识库", "会议总结", "项目文档"], rating: 4.4, ratings: 684, views: 24120, favorites: 2970,
    updated: "2026-07-18", created: "2026-04-16", featured: false, status: "online", source: "运营收录", website: "https://www.notion.so/product/ai"
  }
];

export const SEED_SOFTWARE_TOOLS = [
  { id: "tinypng", name: "TinyPNG", logo: "TP", category: "软件工具", subcategory: "在线工具", tags: ["图片处理", "压缩优化"], color: "#d9f1e3", logoColor: "#237a4d", short: "在浏览器中快速压缩 PNG、JPEG 与 WebP 图片。", description: "TinyPNG 适合在发布文章、制作网页或发送文件前压缩图片体积。访问 https://tinypng.com 即可直接上传处理，完成后下载优化后的图片。", features: ["多格式图片压缩", "无需安装客户端", "批量处理图片", "适合网页与内容配图"], tutorial: ["打开官网并拖入需要压缩的图片。", "等待浏览器完成处理。", "下载结果并检查画质与文件大小。"], scenarios: ["文章配图", "网页优化", "文件分享"], rating: 4.8, ratings: 892, views: 28640, favorites: 3210, updated: "2026-08-04", created: "2026-03-12", featured: true, status: "online", source: "拾器用户 · 纸飞机", website: "https://tinypng.com" },
  { id: "excalidraw", name: "Excalidraw", logo: "EX", category: "软件工具", subcategory: "在线工具", tags: ["白板绘图", "协作表达"], color: "#e7e2ff", logoColor: "#5c46a6", short: "带手绘质感的在线白板与快速示意图工具。", description: "Excalidraw 适合快速画流程、页面草图和讲解示意图。可直接访问 https://excalidraw.com 开始创作，也能导出图片或可继续编辑的源文件。", features: ["手绘风格图形", "多人实时协作", "丰富图形素材库", "多种导出格式"], tutorial: ["从空白画布或素材库开始。", "用连接线组织信息层级。", "导出 PNG、SVG 或源文件。"], scenarios: ["方案沟通", "流程梳理", "课程讲解"], rating: 4.9, ratings: 1150, views: 35210, favorites: 4870, updated: "2026-08-03", created: "2026-02-20", featured: true, status: "online", source: "拾器运营", website: "https://excalidraw.com" },
  { id: "obsidian", name: "Obsidian", logo: "OB", category: "软件工具", subcategory: "桌面软件", tags: ["知识管理", "Markdown"], color: "#e8dcff", logoColor: "#6c3db0", short: "以本地 Markdown 文件为核心的个人知识管理软件。", description: "Obsidian 使用本地文件保存笔记，并通过双向链接组织知识网络。官网为 https://obsidian.md，适合希望长期掌控自己资料的学习者与创作者。", features: ["本地文件优先", "双向链接与关系图", "丰富插件生态", "跨平台使用"], tutorial: ["创建一个本地知识库目录。", "用 Markdown 写下第一篇笔记。", "通过双向链接连接相关主题。"], scenarios: ["读书笔记", "研究整理", "个人知识库"], rating: 4.8, ratings: 2031, views: 48200, favorites: 6280, updated: "2026-07-30", created: "2026-01-18", featured: true, status: "online", source: "拾器用户 · 北岛开发者", website: "https://obsidian.md" },
  { id: "localsend", name: "LocalSend", logo: "LS", category: "软件工具", subcategory: "桌面软件", tags: ["文件传输", "跨平台"], color: "#dceeff", logoColor: "#256b9f", short: "在同一局域网内跨设备传输文件的轻量工具。", description: "LocalSend 可在 Windows、macOS、Linux、Android 与 iOS 之间直接传输文件，不依赖云端中转。项目介绍见 https://localsend.org。", features: ["局域网直接传输", "覆盖主流平台", "无需账号登录", "界面简单清晰"], tutorial: ["在需要互传的设备上安装并打开应用。", "确保设备连接到同一局域网。", "选择接收设备并发送文件。"], scenarios: ["跨设备传文件", "团队现场协作", "隐私文件传输"], rating: 4.7, ratings: 765, views: 19640, favorites: 2510, updated: "2026-07-29", created: "2026-04-02", featured: false, status: "online", source: "拾器用户 · 林一格", website: "https://localsend.org" },
  { id: "immersive-translate", name: "沉浸式翻译", logo: "译", category: "软件工具", subcategory: "浏览器扩展", tags: ["网页翻译", "双语阅读"], color: "#dff4ee", logoColor: "#19715b", short: "保留原文结构的网页双语对照翻译扩展。", description: "沉浸式翻译适合阅读外文网页、PDF 与字幕内容，可在原文旁展示译文，官网为 https://immersivetranslate.com。", features: ["网页双语对照", "PDF 与字幕翻译", "多种翻译服务", "自定义站点规则"], tutorial: ["安装对应浏览器扩展。", "打开外文页面并点击翻译。", "按阅读习惯调整译文样式。"], scenarios: ["外文阅读", "论文资料", "视频字幕"], rating: 4.8, ratings: 1580, views: 41100, favorites: 5570, updated: "2026-08-02", created: "2026-02-03", featured: true, status: "online", source: "拾器运营", website: "https://immersivetranslate.com" },
  { id: "singlefile", name: "SingleFile", logo: "SF", category: "软件工具", subcategory: "浏览器扩展", tags: ["网页保存", "资料归档"], color: "#f2e8d6", logoColor: "#8b632a", short: "将完整网页保存为单个 HTML 文件的浏览器扩展。", description: "SingleFile 能把页面样式、图片与正文打包进一个 HTML 文件，便于离线阅读和资料归档。项目主页见 https://github.com/gildas-lormeau/SingleFile。", features: ["单文件保存网页", "支持离线阅读", "可配置保存规则", "适合长期归档"], tutorial: ["安装浏览器扩展。", "打开需要保存的页面。", "点击扩展图标并等待打包完成。"], scenarios: ["研究归档", "离线阅读", "网页取证"], rating: 4.6, ratings: 442, views: 12490, favorites: 1640, updated: "2026-07-24", created: "2026-05-06", featured: false, status: "online", source: "拾器用户 · Aurora", website: "https://github.com/gildas-lormeau/SingleFile" },
  { id: "vscode", name: "Visual Studio Code", logo: "VS", category: "软件工具", subcategory: "开发工具", tags: ["代码编辑", "插件生态"], color: "#d9edff", logoColor: "#176da1", short: "覆盖多语言开发、调试与版本管理的代码编辑器。", description: "Visual Studio Code 提供代码编辑、调试、Git 和扩展能力，适合从学习编程到团队项目开发。访问 https://code.visualstudio.com 了解各平台版本。", features: ["多语言代码编辑", "内置调试与 Git", "丰富扩展市场", "跨平台运行"], tutorial: ["安装适合系统的版本。", "按开发语言安装必要扩展。", "打开项目目录并配置格式化与调试。"], scenarios: ["编程学习", "项目开发", "远程协作"], rating: 4.9, ratings: 3860, views: 72300, favorites: 9140, updated: "2026-08-01", created: "2026-01-05", featured: true, status: "online", source: "拾器运营", website: "https://code.visualstudio.com" },
  { id: "hoppscotch", name: "Hoppscotch", logo: "HS", category: "软件工具", subcategory: "开发工具", tags: ["API 调试", "开发协作"], color: "#d8f1e7", logoColor: "#187251", short: "界面轻快的 Web API 请求、调试与协作工具。", description: "Hoppscotch 可在浏览器中调试 REST、GraphQL 与 WebSocket 接口，访问 https://hoppscotch.io 即可使用。", features: ["多种 API 协议", "请求集合管理", "环境变量配置", "团队协作空间"], tutorial: ["选择请求协议并填写接口地址。", "配置参数、请求头与认证信息。", "保存常用请求到集合。"], scenarios: ["接口联调", "后端开发", "接口文档验证"], rating: 4.7, ratings: 610, views: 17520, favorites: 2180, updated: "2026-07-31", created: "2026-04-18", featured: false, status: "online", source: "拾器用户 · 北岛开发者", website: "https://hoppscotch.io" }
];

export const SEED_ARTICLES = [
  { id: "ai-question-framework", title: "把问题说清楚：一套可复用的 AI 提问框架", excerpt: "从目标、背景、限制和验收标准四个维度，写出更稳定、更容易迭代的提示。", category: "AI 入门", tags: ["提示词", "方法论", "新手指南"], author: "拾器运营", userId: "u-admin", created: "2026-08-05", updated: "2026-08-05", readTime: 8, views: 12840, featured: true, cover: "#ffe3d9", body: ["很多人第一次使用 AI 时，会把它当成一个更聪明的搜索框。真正影响结果的，往往不是某个神奇关键词，而是你有没有把任务边界说清楚。", "一个好用的基本结构是：先说明目标，再补充必要背景，随后列出不能突破的限制，最后给出可以检查的验收标准。目标决定方向，背景减少猜测，限制控制风险，验收标准让结果可以继续迭代。", "例如，不要只说“帮我写一篇文章”，可以改成：“为刚开始使用知识管理工具的大学生写一篇 1200 字入门文章，语气清晰克制，包含三个可执行步骤，并在结尾给出检查清单。”", "当输出不符合预期时，先指出具体差距，再只调整一个变量。OpenAI 的提示工程指南也提供了更多可操作建议：https://platform.openai.com/docs/guides/prompt-engineering", "把提示当作一份微型需求文档，你会更容易得到稳定、可复用的结果。"] },
  { id: "knowledge-notes", title: "从收藏到理解：建立真正能用的学习笔记", excerpt: "减少无效摘抄，用问题、观点和行动把分散资料组织成自己的知识。", category: "学习方法", tags: ["知识管理", "笔记", "深度阅读"], author: "林一格", userId: "u-demo", created: "2026-08-03", updated: "2026-08-04", readTime: 10, views: 9860, featured: true, cover: "#e8f2d6", body: ["收藏不是学习的终点。真正有用的笔记，应该在未来某个时刻帮助你做出判断、解决问题或创造新内容。", "阅读时先写下你想回答的问题，再记录作者的关键观点。每一条摘录后补一句自己的解释：它为什么重要？和已有经验有什么冲突？下一步可以用在哪里？", "整理阶段不必追求复杂分类。用少量稳定标签标记主题，再通过链接连接具体问题，通常比建立庞大的文件夹树更容易长期维护。", "每周选择一条笔记转化成行动：写一段公开总结、改进一个工作流程，或向别人解释这个概念。输出会暴露理解中的空白，也会让知识真正留下来。"] },
  { id: "open-source-checklist", title: "下载开源软件前，先完成这 7 项安全检查", excerpt: "从官方来源、更新频率、权限请求到校验值，降低下载与安装未知软件的风险。", category: "安全指南", tags: ["开源软件", "安全", "检查清单"], author: "北岛开发者", userId: "u-north", created: "2026-08-01", updated: "2026-08-02", readTime: 7, views: 11520, featured: true, cover: "#dcecff", body: ["开源不等于天然安全，但公开的代码、发布记录和社区讨论，给了我们更多判断依据。下载前先确认项目的官方仓库和官方网站是否互相链接。", "检查最近一次发布、维护者活动和未解决的安全问题。对桌面安装包，优先使用项目 Release 页面或官方商店，不要从来源不明的下载站获取二次打包文件。", "安装时关注权限请求。如果一个简单截图工具要求读取通讯录或持续获取定位，应暂停并查明原因。项目提供校验值时，可以对下载文件做完整性校验。", "最后保留卸载路径和重要数据备份。安全不是一次性判断，而是一套在安装、更新和使用过程中持续执行的习惯。"] },
  { id: "research-workflow", title: "一小时完成主题研究：搜索、验证与输出工作流", excerpt: "把发散搜索收束为可信结论，适合选题、竞品分析和学习新领域。", category: "研究方法", tags: ["信息检索", "事实核查", "工作流"], author: "Aurora", userId: "u-aurora", created: "2026-07-30", updated: "2026-08-01", readTime: 9, views: 8340, featured: false, cover: "#eee1ff", body: ["快速研究的关键不是读得多，而是尽快建立问题树。先写下一个核心问题，再拆成定义、现状、原因、案例和争议五类子问题。", "搜索阶段优先寻找原始资料：官方文档、研究论文、公开数据和当事方声明。二手文章适合发现线索，但重要结论应回到原始来源验证。", "记录每条证据支持什么结论，也记录它不能证明什么。遇到数据冲突时，检查统计口径、样本范围和发布时间。", "输出时先给结论，再说明证据和不确定性。保留来源链接，让读者能直接打开原始页面继续判断。"] },
  { id: "browser-toolbox", title: "浏览器效率工具箱：让阅读、检索和归档更顺手", excerpt: "一套克制的浏览器扩展组合，覆盖双语阅读、页面保存与信息整理。", category: "工具教程", tags: ["浏览器扩展", "效率", "资料整理"], author: "拾器运营", userId: "u-admin", created: "2026-07-28", updated: "2026-07-29", readTime: 6, views: 7420, featured: false, cover: "#dff3ed", body: ["浏览器扩展越多，性能和隐私成本越高。更合适的做法是围绕固定任务建立一套最小工具箱。", "双语阅读可以使用沉浸式翻译，长页面归档可以使用 SingleFile，临时整理则优先利用浏览器自带的阅读列表和标签页分组。", "安装扩展前检查开发者、权限和最近更新时间。定期打开扩展管理页，停用很久没有使用的工具。", "工具箱的价值不在数量，而在是否能让信息从发现、阅读到归档形成顺畅路径。"] },
  { id: "markdown-start", title: "Markdown 入门：用纯文本写出结构清晰的内容", excerpt: "掌握标题、列表、链接与代码块，用一种简单格式覆盖笔记和写作。", category: "基础技能", tags: ["Markdown", "写作", "入门"], author: "林一格", userId: "u-demo", created: "2026-07-25", updated: "2026-07-25", readTime: 5, views: 6120, featured: false, cover: "#f4ead9", body: ["Markdown 的目标是让你在不离开键盘的情况下写出有结构的纯文本。即使不渲染，原始内容也容易阅读。", "从最常用的语法开始：井号表示标题，短横线表示列表，方括号和圆括号组合成链接，反引号包住代码。", "不要一次记住所有扩展语法。先用标题划分层级，用短段落表达一个观点，再在需要时补充列表、引用和代码块。", "CommonMark 提供了清晰的语法参考：https://commonmark.org/help/。学会基础语法后，优先关注内容本身。"] },
  { id: "tool-review-method", title: "如何写一篇对别人真正有帮助的工具体验", excerpt: "从使用场景、任务过程、结果与限制出发，避免把体验文写成功能清单。", category: "内容创作", tags: ["工具评测", "写作", "社区分享"], author: "纸飞机", userId: "u-paper", created: "2026-07-21", updated: "2026-07-23", readTime: 7, views: 5380, featured: false, cover: "#ffe2dc", body: ["读者需要的不是官网功能复述，而是这个工具在真实任务里表现如何。先说明你是谁、要完成什么任务，以及为什么选择它。", "记录关键操作、实际耗时和产出质量。遇到问题时，不要略过失败过程；限制条件往往比亮点更能帮助别人做决定。", "结尾给出适用人群和不适用场景。如果包含官网、文档或下载链接，请直接贴出完整地址，方便读者新开页面核验。", "一篇可信的体验不必面面俱到，但要让读者知道结论来自什么使用过程。"] },
  { id: "digital-cleanup", title: "每月一次的数字整理：文件、账号与订阅检查表", excerpt: "用 30 分钟减少文件堆积、闲置账号和不必要的信息干扰。", category: "数字生活", tags: ["整理", "隐私", "效率"], author: "Aurora", userId: "u-aurora", created: "2026-07-18", updated: "2026-07-19", readTime: 6, views: 4590, featured: false, cover: "#e1ecff", body: ["数字空间也会积累噪音。每月固定一次短整理，比等到系统彻底失控后再大扫除更容易坚持。", "先处理下载目录和桌面，把需要长期保留的文件移动到明确位置。再检查浏览器扩展、已登录设备和长期不用的账号。", "查看邮件订阅与应用通知，取消不会再阅读的来源。对重要资料确认至少存在一份独立备份。", "整理的目的不是保持绝对整洁，而是让重要信息更容易找到，让不用的权限和服务及时退出你的生活。"] }
];

SEED_ARTICLES.forEach((article, index) => {
  article.images = [`./assets/article-visual-${(index % 3) + 1}.svg`];
});

export const ALL_SEED_RESOURCES = [...SEED_RESOURCES, ...SEED_SOFTWARE_TOOLS];

export const SEED_USERS = [
  { id: "u-demo", email: "demo@shiqi.cn", nickname: "林一格", bio: "正在把 AI 变成日常生产力。", role: "user", status: "active", joined: "2026-05-12", gender: "不公开", birthday: "" },
  { id: "u-admin", email: "admin@shiqi.cn", nickname: "拾器运营", bio: "持续收录值得被看见的好工具。", role: "admin", status: "active", joined: "2026-02-01", gender: "不公开", birthday: "" },
  { id: "u-aurora", email: "aurora@example.com", nickname: "Aurora", bio: "设计师与 AI 探索者", role: "user", status: "active", joined: "2026-05-25" },
  { id: "u-north", email: "north@example.com", nickname: "北岛开发者", bio: "独立开发中", role: "user", status: "active", joined: "2026-06-08" },
];

export const SEED_COMMENTS = [
  { id: "c1", resourceId: "cursor", userId: "u-demo", user: "林一格", rating: 5, content: "上下文理解很顺，改跨文件功能时省了很多来回查找的时间。建议第一次使用先熟悉变更审阅，不要直接接受全部修改。", likes: 28, created: "2026-08-03", status: "approved" },
  { id: "c2", resourceId: "cursor", userId: "u-north", user: "北岛开发者", rating: 4, content: "适合快速进入陌生项目，但复杂重构还是要自己把控设计边界。", likes: 16, created: "2026-07-28", status: "approved" },
  { id: "c3", resourceId: "chatgpt", userId: "u-aurora", user: "Aurora", rating: 5, content: "用来做创意发散和初稿整理很方便，描述得越具体，结果越接近预期。", likes: 41, created: "2026-07-31", status: "approved" },
  { id: "c4", resourceId: "gamma", userId: "u-demo", user: "林一格", rating: 4, content: "生成提纲的速度很快，适合先把框架搭起来，正式汇报前还是需要补充真实案例和数据。", likes: 9, created: "2026-07-20", status: "approved" },
  { id: "c5", resourceId: "kimi", userId: "u-aurora", user: "Aurora", rating: 5, content: "中文长文档总结体验不错，学生党上手没有门槛。", likes: 22, created: "2026-07-29", status: "approved" },
];

export const SEED_REPORTS = [
  { id: "r-demo", targetId: "singlefile", targetType: "resource", type: "链接失效", detail: "扩展商店入口暂时无法打开，请核查项目主页链接。", userId: "u-demo", status: "pending", created: "2026-08-05" }
];

const state = {
  authMode: "login",
  profileTab: "overview",
  adminTab: "dashboard",
  listLimit: 12,
  articleLimit: 6,
  ratingDraft: 5,
  articleImagesDraft: [],
  submitType: "tool",
  toolChannel: "AI工具",
  searchReturnHash: null,
  verificationCodeCooldowns: {
    register: 0,
    reset: 0,
  },
  currentUser: null,
  route: null,
  bootstrapped: false,
  data: {
    resources: [],
    articles: [],
    comments: [],
    users: [],
    submissions: [],
    reports: [],
    favorites: [],
  },
};

const icons = {
  search: '<path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrowRight: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  arrowLeft: '<path d="M19 12H5m5 5-5-5 5-5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z"/>',
  star: '<path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.7Z"/>',
  eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.3M8.2 13.2l7.5 4.3"/>',
  external: '<path d="M14 4h6v6M10 14 20 4M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
  pen: '<path d="m15 5 4 4M13 7l4 4M4 20l3.5-.8L19 7.7a2.1 2.1 0 0 0-3-3L4.8 16.2 4 20Z"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h2a7 7 0 0 0 7-7c0-2.2-4-4-9-4Z"/><circle cx="7.5" cy="9" r=".8"/><circle cx="10" cy="6" r=".8"/><circle cx="14" cy="6" r=".8"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',
  video: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2"/>',
  workflow: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h4a4 4 0 0 1 4 4v5M15 18h-4a4 4 0 0 1-4-4V9"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 18v2h16v-2"/>',
  thumb: '<path d="M7 10v12H3V10h4Zm0 10h10a2 2 0 0 0 2-1.6l1.7-8A2 2 0 0 0 18.7 8H14l.7-3.2A2.3 2.3 0 0 0 10.2 4L7 10Z"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.8 2.5 17.5A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.5L13.7 3.8a2 2 0 0 0-3.4 0Z"/>',
  spark: '<path d="m12 3-1.4 4.1L6.5 8.5l4.1 1.4L12 14l1.4-4.1 4.1-1.4-4.1-1.4L12 3ZM5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14ZM19 15l-.7 1.8-1.8.7 1.8.7L19 20l.7-1.8 1.8-.7-1.8-.7L19 15Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
};

function icon(name, className = "") {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
}

function linkifyText(value = "") {
  return String(value).split(/(https?:\/\/[^\s<>"'，。！？、)）]+)/g).map(part => {
    if (!/^https?:\/\//.test(part)) return escapeHTML(part);
    const url = escapeHTML(part);
    return `<a class="inline-link" href="${url}" target="_blank" rel="noopener noreferrer">${url} ${icon("external")}</a>`;
  }).join("");
}

function formatNumber(value) {
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function parseTags(value = "") {
  return String(value).split(/[,，]/).map(tag => tag.trim()).filter(tag => tag && !/(免费|付费|vip|会员)/i.test(tag)).slice(0, 6);
}

function today() { return new Date().toISOString().slice(0, 10); }
function uid(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function storageKey(key) { return STORAGE_PREFIX + key; }
function getLocal(key, fallback) {
  try { const value = localStorage.getItem(storageKey(key)); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function setLocal(key, value) { localStorage.setItem(storageKey(key), JSON.stringify(value)); }

export function verificationCodeButtonState(deadline = 0, now = Date.now()) {
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  return {
    disabled: remaining > 0,
    label: remaining > 0 ? `${remaining} 秒后重试` : "获取验证码",
    remaining,
  };
}

function verificationCodeButtonHTML(purpose) {
  const buttonState = verificationCodeButtonState(state.verificationCodeCooldowns[purpose]);
  return `<button class="btn btn-light" type="button" data-action="send-code" data-purpose="${purpose}" aria-live="polite" ${buttonState.disabled ? "disabled" : ""}>${buttonState.label}</button>`;
}

let verificationCodeTimer = null;

function syncVerificationCodeButtons() {
  document.querySelectorAll('[data-action="send-code"][data-purpose]').forEach(button => {
    const buttonState = verificationCodeButtonState(state.verificationCodeCooldowns[button.dataset.purpose]);
    button.disabled = buttonState.disabled;
    button.textContent = buttonState.label;
  });

  const hasActiveCooldown = Object.values(state.verificationCodeCooldowns)
    .some(deadline => verificationCodeButtonState(deadline).disabled);
  if (!hasActiveCooldown && verificationCodeTimer) {
    clearInterval(verificationCodeTimer);
    verificationCodeTimer = null;
  }
}

function startVerificationCodeCooldown(purpose) {
  state.verificationCodeCooldowns[purpose] = Date.now() + VERIFICATION_CODE_COOLDOWN_SECONDS * 1000;
  syncVerificationCodeButtons();
  if (!verificationCodeTimer) verificationCodeTimer = setInterval(syncVerificationCodeButtons, 1000);
}

async function apiRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error?.message || "服务器暂时无法处理请求");
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

function mergeById(existing, incoming) {
  const map = new Map(existing.map(item => [item.id, item]));
  incoming.forEach(item => map.set(item.id, item));
  return [...map.values()];
}

async function loadBootstrap() {
  const data = await apiRequest("/api/bootstrap");
  state.data.resources = data.resources;
  state.data.articles = data.articles;
  state.data.comments = data.comments;
  state.data.favorites = data.favorites;
  state.currentUser = data.currentUser;
  state.bootstrapped = true;
}

async function loadDashboardData() {
  if (!state.currentUser) return;
  const data = await apiRequest("/api/me/dashboard");
  state.currentUser = data.user;
  state.data.favorites = data.favorites;
  state.data.comments = mergeById(state.data.comments, data.comments);
  state.data.submissions = data.submissions;
}

async function loadAdminData() {
  if (state.currentUser?.role !== "admin") return;
  const data = await apiRequest("/api/admin/data");
  state.data.resources = data.resources;
  state.data.users = data.users;
  state.data.reports = data.reports;
}

async function prepareRouteData(route = parseRoute()) {
  if (route.path === "/profile") await loadDashboardData();
  if (route.path === "/admin") await loadAdminData();
}

function resources(includeOffline = false) {
  const all = state.data.resources;
  return includeOffline ? all : all.filter(item => item.status === "online");
}
function articles(includeOffline = false) {
  const all = state.data.articles;
  return includeOffline ? all : all.filter(item => item.status !== "offline");
}
function users() { return state.data.users; }
function comments() { return state.data.comments; }
function submissions() { return state.data.submissions; }
function favoritesFor(userId = state.currentUser?.id) { return userId && userId === state.currentUser?.id ? state.data.favorites.map(entry => entry.id) : []; }
function isFavorite(resourceId) { return favoritesFor().includes(resourceId); }

function parseRoute() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, parts: path.split("/").filter(Boolean), params: new URLSearchParams(query) };
}

function navigate(path, params = null) {
  let hash = path.startsWith("/") ? path : `/${path}`;
  if (params) {
    const query = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
    if (query) hash += `?${query}`;
  }
  location.hash = hash;
}

function updateRouteParams(changes) {
  const params = new URLSearchParams(state.route.params);
  Object.entries(changes).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
  state.listLimit = 12;
  const query = params.toString();
  history.replaceState(null, "", `#${state.route.path}${query ? `?${query}` : ""}`);
  renderApp(false);
}

function showToast(message, type = "success") {
  const root = document.querySelector("#toast-root");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === "error" ? "alert" : "check")}<span>${escapeHTML(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function openModal(content, wide = false) {
  document.body.classList.add("modal-open");
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop" data-action="close-modal-backdrop"><div class="modal ${wide ? "wide" : ""}">${content}</div></div>`;
}

function closeModal() {
  document.body.classList.remove("modal-open");
  document.querySelector("#modal-root").innerHTML = "";
}

function initials(name = "拾器") { return name.trim().slice(0, 2).toUpperCase(); }

function requireLogin(message = "登录后即可继续操作") {
  if (state.currentUser) return true;
  showToast(message, "error");
  setTimeout(() => navigate("/auth"), 450);
  return false;
}

function brandHTML() {
  return `<img class="brand-logo" src="./logo.svg" alt="拾器 SHIQI" width="1264" height="438">`;
}

function headerHTML() {
  const route = state.route.path;
  const isResource = route.startsWith("/resources") || route.startsWith("/resource/");
  const isLearning = route.startsWith("/learning") || route.startsWith("/article/");
  const isSoftware = route.startsWith("/software");
  const isSearch = route === "/search";
  const user = state.currentUser;
  return `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#/" aria-label="拾器首页">${brandHTML()}</a>
      <nav class="main-nav" id="main-nav">
        <a class="nav-link ${route === "/" ? "active" : ""}" href="#/">首页</a>
        <a class="nav-link ${isResource ? "active" : ""}" href="#/resources">AI 工具</a>
        <a class="nav-link ${isLearning ? "active" : ""}" href="#/learning">学习资源</a>
        <a class="nav-link ${isSoftware ? "active" : ""}" href="#/software">软件工具</a>
        ${user?.role === "admin" ? `<a class="nav-link ${route === "/admin" ? "active" : ""}" href="#/admin">管理后台</a>` : ""}
      </nav>
      <div class="header-actions">
        <button class="icon-btn ${isSearch ? "active" : ""}" data-action="toggle-global-search" aria-label="${isSearch ? "关闭搜索" : "全站搜索"}">${icon(isSearch ? "x" : "search")}</button>
        ${user ? `<button class="user-chip" data-action="go-profile"><span class="avatar">${escapeHTML(initials(user.nickname))}</span><span>${escapeHTML(user.nickname)}</span></button>` : `<a class="btn btn-light" href="#/auth">登录 / 注册</a>`}
        <button class="icon-btn mobile-toggle" data-action="toggle-menu" aria-label="打开菜单">${icon("menu")}</button>
      </div>
    </div>
  </header>`;
}

function globalSearchResultsHTML(query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return `<div class="global-search-idle">${icon("search")}<h2>搜索全站内容</h2><p>输入关键词后点击“搜索”或按 Enter，再展示工具、软件与学习文章结果。</p></div>`;
  const matches = values => values.filter(Boolean).join(" ").toLowerCase().includes(normalized);
  const toolResults = resources().filter(item => matches([
    item.name, item.short, item.description, item.category, item.subcategory,
    ...item.tags, ...item.scenarios,
  ])).sort((a,b) => Number(b.featured) - Number(a.featured) || b.favorites - a.favorites).slice(0, 8);
  const articleResults = articles().filter(article => matches([
    article.title, article.excerpt, article.category, article.author,
    ...article.tags, ...article.body,
  ])).sort((a,b) => Number(b.featured) - Number(a.featured) || b.views - a.views).slice(0, 6);
  const label = `“${escapeHTML(query.trim())}”的搜索结果`;
  return `<div class="global-search-summary"><strong>${label}</strong><span>${toolResults.length} 个工具 · ${articleResults.length} 篇文章</span></div>
    <section class="global-search-group">
      <div class="global-search-heading"><div><span class="eyebrow">TOOLS & SOFTWARE</span><h2>工具与软件</h2></div><small>宫格列表</small></div>
      ${toolResults.length ? `<div class="resource-grid global-search-tool-grid">${toolResults.map(item => resourceCard(item)).join("")}</div>` : `<div class="global-search-empty">没有找到匹配的工具或软件</div>`}
    </section>
    <section class="global-search-group">
      <div class="global-search-heading"><div><span class="eyebrow">ARTICLES</span><h2>学习文章</h2></div><small>文章列表</small></div>
      ${articleResults.length ? `<div class="global-search-article-list">${articleResults.map(article => `<article class="global-search-article" data-action="open-article" data-id="${article.id}"><div><span>${escapeHTML(article.category)}</span><h3>${escapeHTML(article.title)}</h3><p>${escapeHTML(article.excerpt)}</p></div><aside><strong>${article.readTime} 分钟</strong><small>${escapeHTML(article.author)} · ${formatNumber(article.views)} 阅读</small>${icon("arrowRight")}</aside></article>`).join("")}</div>` : `<div class="global-search-empty">没有找到匹配的学习文章</div>`}
    </section>`;
}

function searchPage() {
  const query = (state.route.params.get("q") || "").trim();
  return `<main class="main global-search-page">
    <div class="container">
      <form class="global-search-bar" id="global-search-form">
        ${icon("search")}
        <input id="global-search-input" name="q" value="${escapeHTML(query)}" autocomplete="off" placeholder="搜索 AI 工具、软件、文章或标签" aria-label="输入搜索关键词">
        <button class="global-search-clear ${query ? "" : "hidden"}" type="button" data-action="clear-global-search" aria-label="清空搜索">${icon("x")}</button>
        <button class="btn btn-dark" type="submit">搜索</button>
      </form>
      <div class="global-search-results" id="global-search-results">${globalSearchResultsHTML(query)}</div>
    </div>
  </main>`;
}

function focusSearchInput() {
  const input = document.querySelector("#global-search-input");
  if (!(input instanceof HTMLInputElement)) return;
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
  window.getSelection()?.removeAllRanges();
}

function releaseSearchFocus() {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement !== document.body) activeElement.blur();
  window.getSelection()?.removeAllRanges();
}

function openSearchPage(query = "") {
  if (state.route?.path !== "/search") state.searchReturnHash = location.hash || "#/";
  releaseSearchFocus();
  navigate("/search", query ? { q: query } : null);
}

function updateSearchPage(query = "") {
  const normalizedQuery = query.trim();
  const params = new URLSearchParams();
  if (normalizedQuery) params.set("q", normalizedQuery);
  const queryString = params.toString();
  history.replaceState(null, "", `#/search${queryString ? `?${queryString}` : ""}`);
  state.route = parseRoute();

  const input = document.querySelector("#global-search-input");
  if (input instanceof HTMLInputElement) input.value = normalizedQuery;
  focusSearchInput();
  document.querySelector(".global-search-clear")?.classList.toggle("hidden", !normalizedQuery);

  const results = document.querySelector("#global-search-results");
  if (results) results.innerHTML = globalSearchResultsHTML(normalizedQuery);
  document.title = pageTitle();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function closeSearchPage() {
  releaseSearchFocus();
  if (state.searchReturnHash) {
    state.searchReturnHash = null;
    history.back();
  } else navigate("/");
}

function footerHTML() {
  return `<footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand"><a class="brand" href="#/">${brandHTML()}</a><p>由用户共同发布和维护的工具与学习资源社区。清晰发现、真实分享，让有价值的内容更容易被看见。</p></div>
        <div class="footer-col"><h4>发现</h4><a href="#/resources">AI 工具</a><a href="#/software">软件工具</a><a href="#/learning">学习资源</a></div>
        <div class="footer-col"><h4>参与</h4><a href="#/submit">发布内容</a><a href="#/profile?tab=favorites">我的收藏</a><a href="#/learning?sort=latest">最新文章</a></div>
        <div class="footer-col"><h4>关于</h4><a href="javascript:void(0)" data-action="show-about">关于拾器</a><a href="javascript:void(0)" data-action="show-policy">收录标准</a><a href="javascript:void(0)" data-action="show-policy">隐私与条款</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 拾器 SHIQI</span><span>用户共建的工具与学习资源社区</span></div>
    </div>
  </footer>`;
}

function resourceIconURL(item) {
  try {
    const website = new URL(item.website);
    if (!["http:", "https:"].includes(website.protocol)) return "";
    if (item.icon) {
      const explicitIcon = new URL(item.icon, website.origin);
      return ["http:", "https:"].includes(explicitIcon.protocol) ? explicitIcon.href : "";
    }
    return `${website.origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function resourceLogo(item) {
  const iconURL = resourceIconURL(item);
  return `<span class="resource-logo" role="img" aria-label="${escapeHTML(item.name)}应用图标"><span class="resource-logo-fallback" aria-hidden="true">${escapeHTML(item.logo)}</span>${iconURL ? `<img class="resource-logo-image" data-resource-icon src="${escapeHTML(iconURL)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}</span>`;
}

function resourceCard(item, rank = null) {
  return `<article class="resource-card">
    <div class="resource-card-cover" style="--card-bg:${item.color};--logo-color:${item.logoColor}" data-action="open-resource" data-id="${item.id}">
      ${rank ? `<span class="resource-rank">NO. ${String(rank).padStart(2, "0")}</span>` : ""}
      ${resourceLogo(item)}
    </div>
    <div class="resource-body">
      <div class="resource-card-title"><h3 data-action="open-resource" data-id="${item.id}">${escapeHTML(item.name)}</h3><span class="score">${icon("star")} ${item.rating.toFixed(1)}</span></div>
      <p class="resource-desc">${escapeHTML(item.short)}</p>
      <div class="tag-row">${item.tags.slice(0,3).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>
      <div class="resource-meta"><span>${icon("bookmark")} ${formatNumber(item.favorites)}</span><span>${icon("eye")} ${formatNumber(item.views)}</span><span>${escapeHTML(item.subcategory.replace("AI ", ""))}</span></div>
    </div>
  </article>`;
}

function emptyState(title, description, actionText = "查看热门工具", action = "clear-filters") {
  return `<div class="empty-state"><div class="empty-icon">${icon("search")}</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p><button class="btn btn-light" data-action="${action}">${escapeHTML(actionText)}</button></div>`;
}

function homePage() {
  const all = resources().filter(r => r.category === "AI工具");
  const featured = all.filter(r => r.featured).sort((a,b) => b.favorites - a.favorites).slice(0,8);
  const latest = [...all].sort((a,b) => b.updated.localeCompare(a.updated)).slice(0,4);
  const latestArticles = [...articles()].sort((a,b) => b.updated.localeCompare(a.updated)).slice(0,3);
  return `<main class="main">
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <p class="eyebrow">COMMUNITY RESOURCE LIBRARY</p>
          <h1>发现优质<em>AI工具与数字资源。</em></h1>
          <p class="hero-copy">各类精选资源持续更新。</p>
          <form class="hero-search" id="home-search">${icon("search")}<input id="global-search" name="q" autocomplete="off" placeholder="搜索工具、场景或功能，例如：PPT 生成" aria-label="搜索资源"><button class="btn btn-primary" type="submit"><span>开始搜索</span>${icon("arrowRight")}</button></form>
          <div class="hot-searches"><span>大家都在搜</span>${["AI 写作","PPT 生成","编程助手","长文档","视频生成"].map(q => `<button class="hot-pill" data-action="hot-search" data-query="${q}">${q}</button>`).join("")}</div>
        </div>
      </div>
    </section>

    <section class="section"><div class="container">
      <div class="section-head"><div><p class="eyebrow">EXPLORE BY SCENE</p><h2 class="section-title">从你要解决的问题出发</h2><p class="section-note">不堆概念，按真实使用场景整理。选一个方向，快速找到合适的那一款。</p></div><a class="text-link" href="#/resources">查看全部 ${icon("arrowRight")}</a></div>
      <div class="category-grid">${CATEGORY_META.map((cat, i) => `<article class="category-card" data-action="category-search" data-category="${cat.name}"><span class="category-count">0${i+1} / ${all.filter(r => r.subcategory === cat.name).length} 款</span><span class="category-icon">${icon(cat.icon)}</span><h3>${cat.name}</h3><p>${cat.desc}</p></article>`).join("")}</div>
    </div></section>

    <section class="section-tight"><div class="container">
      <div class="section-head"><div><p class="eyebrow">EDITOR'S CHOICE</p><h2 class="section-title">本周值得试试</h2><p class="section-note">基于体验完整度、用户评价与近期关注度综合精选。</p></div><a class="text-link" href="#/resources?sort=rating">更多高分工具 ${icon("arrowRight")}</a></div>
      <div class="resource-grid">${featured.map((r,i) => resourceCard(r,i+1)).join("")}</div>
    </div></section>

    <section class="section curated"><div class="container">
      <div class="section-head"><div><p class="eyebrow curated-eyebrow">CURATED COLLECTIONS</p><h2 class="section-title">少一点搜索，多一点完成</h2><p class="section-note">围绕一个具体目标，组合可以直接上手的工具清单。</p></div></div>
      <div class="collection-grid">
        <article class="collection-card" data-action="hot-search" data-query="内容创作"><span class="collection-index">COLLECTION 01 · 6 TOOLS</span><h3>从空白到成稿：内容创作者工具箱</h3><p>选题、写作、配图与排版，一个完整的内容生产链路。</p><span class="collection-circle"></span></article>
        <article class="collection-card" data-action="category-search" data-category="AI 编程辅助"><span class="collection-index">COLLECTION 02</span><h3>独立开发提速组合</h3><p>从想法验证到代码交付。</p><span class="collection-circle"></span></article>
        <article class="collection-card" data-action="hot-search" data-query="新手友好"><span class="collection-index">COLLECTION 03</span><h3>第一次用 AI，先试这 5 个</h3><p>低门槛、易上手、不绕弯。</p><span class="collection-circle"></span></article>
      </div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head"><div><p class="eyebrow">JUST IN</p><h2 class="section-title">最新收录</h2><p class="section-note">持续追踪工具更新，让每一次发现都不过时。</p></div><a class="text-link" href="#/resources?sort=latest">查看更新 ${icon("arrowRight")}</a></div>
      <div class="resource-grid">${latest.map(r => resourceCard(r)).join("")}</div>
    </div></section>

    <section class="section home-learning"><div class="container">
      <div class="section-head"><div><p class="eyebrow">LEARN & PRACTICE</p><h2 class="section-title">学习资源</h2><p class="section-note">从真实问题出发的教程、方法与实践经验。</p></div><a class="text-link" href="#/learning">查看全部文章 ${icon("arrowRight")}</a></div>
      <div class="home-article-grid">${latestArticles.map(articleCard).join("")}</div>
    </div></section>
  </main>`;
}

const RESOURCE_SORTERS = {
  latest: (a,b) => b.updated.localeCompare(a.updated),
  rating: (a,b) => b.rating - a.rating,
  favorites: (a,b) => b.favorites - a.favorites,
  views: (a,b) => b.views - a.views,
  recommend: (a,b) => Number(b.featured) - Number(a.featured) || b.favorites - a.favorites,
};

function filteredChannelResources(channel) {
  const q = (state.route.params.get("q") || "").trim().toLowerCase();
  const category = state.route.params.get("category") || "";
  const sort = state.route.params.get("sort") || "recommend";
  const result = resources().filter(item => item.category === channel).filter(item => {
    const haystack = [item.name, item.short, item.description, item.subcategory, ...item.tags, ...item.scenarios].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) && (!category || item.subcategory === category);
  });
  return result.sort(RESOURCE_SORTERS[sort] || RESOURCE_SORTERS.recommend);
}

function resourceChannelPage({ channel, categories, categoryAction, categoryLabel = value => value, sortId, sortOptions, emptyTitle, emptyDescription, emptyActionText, clearAction, paginate = false, gridClass = "" }) {
  const result = filteredChannelResources(channel);
  const category = state.route.params.get("category") || "";
  const sort = state.route.params.get("sort") || "recommend";
  const visible = paginate ? result.slice(0, state.listLimit) : result;
  return `<main class="main channel-main">
    <section class="filters"><div class="container filter-bar">
      <div class="filter-chips"><button class="filter-chip ${!category ? "active" : ""}" data-action="${categoryAction}" data-value="">全部</button>${categories.map(value => `<button class="filter-chip ${category === value ? "active" : ""}" data-action="${categoryAction}" data-value="${escapeHTML(value)}">${escapeHTML(categoryLabel(value))}</button>`).join("")}</div>
      <select class="sort-select" id="${sortId}" aria-label="排序">${sortOptions.map(([value, label]) => `<option value="${value}" ${sort === value ? "selected" : ""}>${label}</option>`).join("")}</select>
    </div></section>
    <section class="page"><div class="container"><div class="resource-grid ${gridClass}">${result.length ? visible.map(item => resourceCard(item)).join("") : emptyState(emptyTitle, emptyDescription, emptyActionText, clearAction)}</div>${paginate && result.length > state.listLimit ? `<div class="load-more"><button class="btn btn-light btn-lg" data-action="load-more">加载更多 <span class="muted">${state.listLimit} / ${result.length}</span></button></div>` : ""}</div></section>
  </main>`;
}

function resourcesPage() {
  return resourceChannelPage({
    channel: "AI工具",
    categories: CATEGORY_META.map(category => category.name),
    categoryAction: "set-category",
    categoryLabel: value => value.replace("AI ", ""),
    sortId: "sort-select",
    sortOptions: [["recommend", "综合推荐"], ["latest", "最新收录"], ["rating", "评分最高"], ["favorites", "收藏最多"], ["views", "浏览最多"]],
    emptyTitle: "没有找到匹配的工具",
    emptyDescription: "换一个关键词或清除筛选条件，也许会有新的发现。",
    emptyActionText: "查看热门工具",
    clearAction: "clear-filters",
    paginate: true,
  });
}

function softwarePage() {
  return resourceChannelPage({
    channel: "软件工具",
    categories: SOFTWARE_CATEGORIES,
    categoryAction: "set-software-category",
    sortId: "software-sort-select",
    sortOptions: [["recommend", "综合推荐"], ["latest", "最近更新"], ["rating", "评分最高"], ["views", "浏览最多"]],
    emptyTitle: "没有找到匹配的软件",
    emptyDescription: "换一个关键词或查看其他软件分类。",
    emptyActionText: "查看全部软件",
    clearAction: "clear-software-filters",
    gridClass: "software-grid",
  });
}

function articleCoverImage(article) {
  return (article.images || []).find(image => typeof image === "string" && image.trim()) || "";
}

function articlePreview(article, className, readLabel) {
  const coverImage = articleCoverImage(article);
  const image = coverImage
    ? `<img class="article-preview-image" src="${escapeHTML(coverImage)}" alt="${escapeHTML(article.title)}封面图" loading="lazy" decoding="async">`
    : `<span>${escapeHTML(article.category)}</span><strong>${String(article.readTime).padStart(2, "0")}<small>${readLabel}</small></strong>`;
  return `<a class="article-preview ${className} ${coverImage ? "has-image" : ""}" href="#/article/${article.id}" style="--article-cover:${article.cover}">${image}</a>`;
}

function articleCard(article) {
  return `<article class="article-card">${articlePreview(article, "article-cover", "MIN READ")}<div class="article-card-body"><div class="article-byline"><span>${escapeHTML(article.author)}</span><span>${article.updated}</span></div><h3><a href="#/article/${article.id}">${escapeHTML(article.title)}</a></h3><p>${escapeHTML(article.excerpt)}</p><div class="tag-row">${article.tags.slice(0,3).map(tag => `<a class="tag" href="#/learning?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}</a>`).join("")}</div></div></article>`;
}

function learningPage() {
  const q = (state.route.params.get("q") || "").trim().toLowerCase();
  const tag = state.route.params.get("tag") || "";
  const sort = state.route.params.get("sort") || "latest";
  let result = articles().filter(article => {
    const haystack = [article.title, article.excerpt, article.category, article.author, ...article.tags, ...article.body].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) && (!tag || article.tags.includes(tag) || article.category === tag);
  });
  result.sort(sort === "popular" ? (a,b) => b.views - a.views : (a,b) => b.updated.localeCompare(a.updated));
  const recommended = [...articles()].sort((a,b) => Number(b.featured) - Number(a.featured) || b.views - a.views).slice(0,5);
  const popularTags = [...new Set(articles().flatMap(article => [article.category, ...article.tags]))].slice(0,12);
  return `<main class="main channel-main">
    <section class="filters learning-toolbar"><div class="container filter-bar filter-bar-single"><div class="filter-chips"><button class="filter-chip ${sort === "latest" ? "active" : ""}" data-action="set-learning-sort" data-value="latest">最新发布</button><button class="filter-chip ${sort === "popular" ? "active" : ""}" data-action="set-learning-sort" data-value="popular">热门阅读</button></div></div></section>
    <div class="container learning-layout">
      <section class="article-feed">${q || tag ? `<div class="feed-head"><div><h2>${q ? `“${escapeHTML(q)}”的搜索结果` : `标签：${escapeHTML(tag)}`}</h2><p>共 ${result.length} 篇内容</p></div><button class="btn btn-light btn-sm" data-action="clear-learning-filters">清除筛选</button></div>` : ""}
        ${result.length ? result.slice(0,state.articleLimit).map(articleListItem).join("") : emptyState("没有找到相关文章", "试试更简短的关键词，或者浏览右侧推荐标签。", "查看全部文章", "clear-learning-filters")}
        ${result.length > state.articleLimit ? `<div class="load-more"><button class="btn btn-light btn-lg" data-action="load-more-articles">加载更多 <span class="muted">${state.articleLimit} / ${result.length}</span></button></div>` : ""}
      </section>
      <aside class="learning-sidebar"><section class="learning-sidebar-panel">
        <div class="sidebar-section"><div class="sidebar-heading"><span>编辑推荐</span><small>READ NEXT</small></div><div class="recommend-list">${recommended.map(article => `<a href="#/article/${article.id}"><div><strong>${escapeHTML(article.title)}</strong><small>${article.readTime} 分钟阅读 · ${formatNumber(article.views)} 浏览</small></div></a>`).join("")}</div></div>
        <div class="sidebar-section"><div class="sidebar-heading"><span>推荐标签</span><small>TOPICS</small></div><div class="tag-cloud">${popularTags.map(value => `<a class="tag ${tag === value ? "active" : ""}" href="#/learning?tag=${encodeURIComponent(value)}">${escapeHTML(value)}</a>`).join("")}</div></div>
        <div class="sidebar-community"><p class="eyebrow">COMMUNITY FIRST</p><h3>把你的经验写下来</h3><p>工具经验、学习方法和踩坑记录，都可能成为下一位读者的参考。</p><a class="text-link" href="#/submit?type=article">发布文章 ${icon("arrowRight")}</a></div>
      </section></aside>
    </div>
  </main>`;
}

function articleListItem(article) {
  return `<article class="article-list-item">${articlePreview(article, "article-list-cover", "MIN")}<div class="article-list-main"><div class="article-byline"><span>${escapeHTML(article.author)}</span><span>${article.updated}</span><span>${formatNumber(article.views)} 次阅读</span></div><h2><a href="#/article/${article.id}">${escapeHTML(article.title)}</a></h2><p>${escapeHTML(article.excerpt)}</p><div class="article-list-bottom"><div class="tag-row">${article.tags.slice(0,3).map(value => `<a class="tag" href="#/learning?tag=${encodeURIComponent(value)}">${escapeHTML(value)}</a>`).join("")}</div><a class="read-link" href="#/article/${article.id}">阅读全文 ${icon("arrowRight")}</a></div></div></article>`;
}

function renderArticleBody(article) {
  const inlineImages = (article.images || []).slice(1);
  return article.body.map((paragraph, index) => {
    const copy = `<p class="${index === 0 ? "article-intro" : ""}">${linkifyText(paragraph)}</p>`;
    const image = inlineImages[index] ? `<figure class="article-inline-figure"><img src="${escapeHTML(inlineImages[index])}" alt="${escapeHTML(article.title)}配图 ${index + 2}"><figcaption>由发布者随文章提供的内容配图</figcaption></figure>` : "";
    return copy + image;
  }).join("");
}

function articleDetailPage(id) {
  const article = articles().find(item => item.id === id);
  if (!article) return notFoundPage();
  const favorite = isFavorite(id);
  const related = articles().filter(item => item.id !== id && (item.category === article.category || item.tags.some(tag => article.tags.includes(tag)))).slice(0,3);
  const coverImage = articleCoverImage(article);
  const heroVisual = coverImage ? `<figure class="article-hero-figure"><img src="${escapeHTML(coverImage)}" alt="${escapeHTML(article.title)}头图"></figure>` : `<div class="article-cover-wide" style="--article-cover:${article.cover}"><span>${escapeHTML(article.category)}</span><strong>${String(article.readTime).padStart(2,"0")}<small>MINUTE READ</small></strong></div>`;
  return `<main class="main article-page"><div class="container article-detail-shell">
    <a class="back-link" href="#/learning">${icon("arrowLeft")} 返回学习资源</a>
    <header class="article-header"><p class="eyebrow">${escapeHTML(article.category)}</p><h1>${escapeHTML(article.title)}</h1><p class="article-deck">${escapeHTML(article.excerpt)}</p><div class="article-meta-row"><div class="article-meta"><span class="avatar">${escapeHTML(initials(article.author))}</span><div><strong>${escapeHTML(article.author)}</strong><small>拾器社区发布者 · ${article.updated} · ${article.readTime} 分钟阅读 · ${formatNumber(article.views)} 次浏览</small></div></div><div class="tag-cloud">${article.tags.map(value => `<a class="tag" href="#/learning?tag=${encodeURIComponent(value)}">${escapeHTML(value)}</a>`).join("")}</div><button class="article-save-btn ${favorite ? "active" : ""}" data-action="toggle-favorite" data-id="${article.id}" data-type="article">${icon("heart")}<span>${favorite ? "已收藏" : "收藏"}</span></button></div></header>
    <div class="article-reading-layout"><article class="article-content">${heroVisual}${renderArticleBody(article)}<div class="article-end"><span>— END —</span><p>如果这篇文章对你有帮助，欢迎分享你的实践经验。</p><div class="detail-actions"><button class="btn btn-light" data-action="share-resource">${icon("share")} 分享文章</button><a class="btn btn-primary" href="#/submit?type=article">发布我的文章 ${icon("plus")}</a></div><button class="article-report-link" data-action="open-report" data-id="${article.id}" data-type="article">${icon("alert")} 内容错误、链接失效或违规？提交反馈</button></div></article></div>
    ${related.length ? `<section class="related-articles"><div class="section-head"><div><p class="eyebrow">KEEP READING</p><h2 class="section-title">继续阅读</h2></div><a class="text-link" href="#/learning">更多学习资源 ${icon("arrowRight")}</a></div><div class="home-article-grid">${related.map(articleCard).join("")}</div></section>` : ""}
  </div></main>`;
}

function detailPage(id) {
  const item = resources().find(r => r.id === id);
  if (!item) return notFoundPage();
  const itemComments = comments().filter(c => c.resourceId === id && c.status === "approved").sort((a,b) => b.created.localeCompare(a.created));
  const related = resources().filter(r => r.id !== id && r.category === item.category && (r.subcategory === item.subcategory || r.tags.some(t => item.tags.includes(t)))).slice(0,4);
  const favorite = isFavorite(id);
  const backPath = item.category === "软件工具" ? "/software" : "/resources";
  const backLabel = item.category === "软件工具" ? "返回软件工具" : "返回 AI 工具";
  return `<main class="main"><div class="container page">
    <div class="back-row"><a class="back-link" href="#${backPath}">${icon("arrowLeft")} ${backLabel}</a></div>
    <section class="detail-hero">
      <div class="detail-cover" style="--card-bg:${item.color};--logo-color:${item.logoColor}">${resourceLogo(item)}</div>
      <div class="detail-main">
        <div class="tag-row"><span class="tag primary">${escapeHTML(item.subcategory)}</span>${item.tags.slice(0,3).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}</div>
        <h1>${escapeHTML(item.name)}</h1><p class="detail-lead">${escapeHTML(item.short)}</p>
        <div class="detail-stats"><span>${icon("star")} <strong>${item.rating.toFixed(1)}</strong>（${formatNumber(item.ratings)} 条评价）</span><span>${icon("eye")} ${formatNumber(item.views)} 次浏览</span><span>${icon("bookmark")} ${formatNumber(item.favorites)} 人收藏</span><span>${icon("clock")} ${item.updated} 更新</span></div>
        <div class="detail-actions"><button class="btn btn-primary btn-lg" data-action="visit-resource" data-id="${item.id}">访问官网 ${icon("external")}</button><button class="btn btn-light btn-lg favorite-action ${favorite ? "active" : ""}" data-action="toggle-favorite" data-id="${item.id}" data-type="resource">${icon("heart")} ${favorite ? "已收藏" : "收藏"}</button><button class="btn btn-light btn-lg" data-action="share-resource" data-id="${item.id}">${icon("share")} 分享</button></div><a class="detail-url" href="${escapeHTML(item.website)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.website)} ${icon("external")}</a>
      </div>
    </section>
    <div class="detail-layout">
      <div>
        <section class="content-card"><p class="eyebrow">ABOUT THIS TOOL</p><h2>为什么值得一试</h2><p class="rich-copy">${linkifyText(item.description)}</p><h3>核心能力</h3><ul class="feature-list">${item.features.map(feature => `<li class="feature-item"><span class="feature-check">${icon("check")}</span>${linkifyText(feature)}</li>`).join("")}</ul><h3>三步开始使用</h3><div class="steps">${item.tutorial.map(step => `<div class="step">${linkifyText(step)}</div>`).join("")}</div></section>
        <section class="content-card" id="comments"><div class="section-head comment-section-head"><div><p class="eyebrow">COMMUNITY REVIEWS</p><h2 class="flush-title">真实使用者怎么说</h2></div><span class="result-count">${itemComments.length} 条评价</span></div>
          <form class="comment-form" id="comment-form" data-resource-id="${item.id}">
            <div class="field"><label>你的评分</label><div class="rating-input">${[1,2,3,4,5].map(n => `<button type="button" class="star-btn ${n <= state.ratingDraft ? "active" : ""}" data-action="set-rating" data-rating="${n}">${icon("star")}</button>`).join("")}</div></div>
            <div class="field"><label for="comment-content">分享真实体验</label><textarea class="textarea" id="comment-content" name="content" maxlength="500" placeholder="哪些功能好用？适合什么场景？有什么需要注意？"></textarea></div>
            <div><button class="btn btn-primary" type="submit">发布评价</button> <span class="field-hint">${state.currentUser ? `将以「${escapeHTML(state.currentUser.nickname)}」发布` : "登录后可参与评价"}</span></div>
          </form>
          <div class="comment-list">${itemComments.length ? itemComments.map(commentHTML).join("") : `<div class="empty-state compact-empty-state"><h3>还没有评价</h3><p>成为第一个分享使用体验的人。</p></div>`}</div>
        </section>
        <section class="section-tight"><div class="section-head"><div><p class="eyebrow">YOU MAY ALSO LIKE</p><h2 class="section-title related-title">同类好工具</h2></div></div><div class="resource-grid">${related.map(r => resourceCard(r)).join("")}</div></section>
      </div>
      <aside class="detail-sidebar">
        <section class="side-card detail-info-card"><h3>资源信息</h3><div class="info-list"><div class="info-row"><span>发布者</span><strong>${escapeHTML(item.source)}</strong></div><div class="info-row"><span>内容频道</span><strong>${escapeHTML(item.category)}</strong></div></div><div class="detail-scenarios"><h4>适用场景</h4><div class="tag-row">${item.scenarios.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}</div></div><button class="report-link" data-action="open-report" data-id="${item.id}" data-type="resource">${icon("alert")} 链接失效、信息错误或内容违规？提交反馈</button></section>
      </aside>
    </div>
  </div></main>`;
}

function commentHTML(comment) {
  const mine = state.currentUser?.id === comment.userId;
  return `<article class="comment"><div class="comment-head"><div class="comment-user"><span class="avatar">${escapeHTML(initials(comment.user))}</span><div><strong>${escapeHTML(comment.user)}</strong><small>${comment.created} · ${"★".repeat(comment.rating)}${"☆".repeat(5-comment.rating)}</small></div></div>${mine ? `<button class="comment-action" data-action="delete-own-comment" data-id="${comment.id}">${icon("trash")} 删除</button>` : ""}</div><p>${escapeHTML(comment.content)}</p><div class="comment-actions"><button class="comment-action" data-action="like-comment" data-id="${comment.id}">${icon("thumb")} 有帮助 ${comment.likes || 0}</button><button class="comment-action" data-action="reply-comment">${icon("message")} 回复</button></div></article>`;
}

function authPage() {
  const register = state.authMode === "register";
  return `<main class="main auth-page">
    <section class="auth-aside"><div><p class="auth-kicker">SHIQI COMMUNITY</p><h1><span>把好内容，</span><span>装进你的<em>收藏夹。</em></span></h1></div><div class="auth-testimonial"><p>“每一次真实分享，都可能帮另一个人少走一段弯路。”</p><small>— 拾器用户共建社区</small></div></section>
    <section class="auth-panel"><div class="auth-card"><p class="eyebrow">WELCOME TO SHIQI</p><h2>${register ? "创建账号" : "欢迎回来"}</h2><p>${register ? "加入拾器，收藏工具、发布文章，也把你的真实经验分享给大家。" : "登录后继续管理收藏、评论与已发布内容。"}</p>
      <div class="auth-tabs" role="tablist" aria-label="账号入口"><button class="auth-tab ${!register ? "active" : ""}" role="tab" aria-selected="${!register}" data-action="auth-tab" data-mode="login">登录</button><button class="auth-tab ${register ? "active" : ""}" role="tab" aria-selected="${register}" data-action="auth-tab" data-mode="register">注册</button></div>
      <form class="auth-form" id="auth-form" data-mode="${state.authMode}">
        ${register ? `<div class="field"><label for="auth-nickname">昵称</label><input class="input" id="auth-nickname" name="nickname" maxlength="20" placeholder="怎么称呼你"></div>` : ""}
        <div class="field"><label for="auth-email">邮箱</label><input class="input" id="auth-email" name="email" type="email" required autocomplete="email" placeholder="name@example.com"></div>
        ${register ? `<div class="field"><label for="auth-code">邮箱验证码</label><div class="auth-code-row"><input class="input" id="auth-code" name="code" required inputmode="numeric" autocomplete="one-time-code" placeholder="请输入 6 位验证码">${verificationCodeButtonHTML("register")}</div></div>` : ""}
        <div class="field"><label for="auth-password">密码</label><input class="input" id="auth-password" name="password" type="password" required autocomplete="${register ? "new-password" : "current-password"}" placeholder="10–72 位，包含字母和数字"></div>
        ${register ? `<div class="field"><label for="auth-confirm-password">确认密码</label><input class="input" id="auth-confirm-password" name="confirmPassword" type="password" required autocomplete="new-password" placeholder="再次输入密码"></div><label class="check-row"><input type="checkbox" name="agreement">我已阅读并同意《用户协议》和《隐私政策》</label>` : `<div class="auth-forgot-row"><button type="button" class="comment-action" data-action="forgot-password">忘记密码？</button></div>`}
        <button class="btn btn-primary btn-lg btn-block" type="submit">${register ? "创建账号" : "登录"} ${icon("arrowRight")}</button>
      </form>
      ${!register && ["localhost","127.0.0.1"].includes(location.hostname) ? `<div class="demo-box"><strong>本地开发账号</strong><br>普通用户：demo@shiqi.cn / demo1234<br>管理员：admin@shiqi.cn / admin1234</div>` : ""}
    </div></section>
  </main>`;
}

const PROFILE_TABS = [
  ["overview", "grid", "概览"], ["favorites", "heart", "我的收藏"], ["comments", "message", "我的评论"],
  ["submissions", "upload", "我的发布"], ["messages", "bell", "消息通知"], ["settings", "settings", "资料设置"]
];

function profilePage() {
  if (!state.currentUser) { setTimeout(() => navigate("/auth"), 0); return loadingPage(); }
  const user = users().find(u => u.id === state.currentUser.id) || state.currentUser;
  const tab = state.profileTab;
  return `<main class="main"><div class="container page">
    <section class="profile-head"><div class="profile-person"><span class="avatar lg">${escapeHTML(initials(user.nickname))}</span><div><h1>${escapeHTML(user.nickname)}</h1><p>${escapeHTML(user.bio || "还没有填写个人简介")}</p><span class="role-badge">${user.role === "admin" ? "运营账号" : "拾器用户"} · 加入于 ${user.joined || today()}</span></div></div><div class="profile-head-actions"><a class="btn btn-primary" href="#/submit">发布内容 ${icon("plus")}</a>${user.role === "admin" ? `<a class="btn btn-light" href="#/admin">管理后台 ${icon("arrowRight")}</a>` : ""}</div></section>
    <div class="profile-layout"><nav class="profile-nav">${PROFILE_TABS.map(([key,ic,label]) => `<button class="${tab === key ? "active" : ""}" data-action="profile-tab" data-tab="${key}">${icon(ic)} ${label}</button>`).join("")}<button class="logout" data-action="logout">${icon("logout")} 退出登录</button></nav><section class="profile-panel">${profilePanel(tab,user)}</section></div>
  </div></main>`;
}

function compactResource(item, removable = false) {
  return `<div class="compact-item"><div class="compact-main"><span class="mini-logo" style="--card-bg:${item.color}">${escapeHTML(item.logo)}</span><div><strong><a class="compact-title-link" href="#/resource/${item.id}">${escapeHTML(item.name)}</a></strong><small>${escapeHTML(item.subcategory)} · ${item.rating.toFixed(1)} 分</small></div></div>${removable ? `<div class="table-actions"><button class="btn btn-danger btn-sm" data-action="toggle-favorite" data-id="${item.id}" data-type="resource">取消收藏</button></div>` : ""}</div>`;
}

function compactArticle(article, removable = false) {
  return `<div class="compact-item"><div class="compact-main"><span class="mini-logo" style="--card-bg:${article.cover}">${icon("file")}</span><div><strong><a class="compact-title-link" href="#/article/${article.id}">${escapeHTML(article.title)}</a></strong><small>${escapeHTML(article.category)} · ${article.readTime} 分钟阅读</small></div></div>${removable ? `<div class="table-actions"><button class="btn btn-danger btn-sm" data-action="toggle-favorite" data-id="${article.id}" data-type="article">取消收藏</button></div>` : ""}</div>`;
}

function profilePanel(tab, user) {
  const favoriteIds = favoritesFor(user.id);
  const myFavoriteResources = resources().filter(item => favoriteIds.includes(item.id));
  const myFavoriteArticles = articles().filter(item => favoriteIds.includes(item.id));
  const myFavorites = [...myFavoriteResources, ...myFavoriteArticles];
  const myComments = comments().filter(c => c.userId === user.id);
  const mySubmissions = submissions().filter(s => s.userId === user.id);
  if (tab === "favorites") return `<h2>我的收藏</h2><p class="panel-subtitle">收藏的工具与学习文章集中放在这里，随时回来继续使用。</p><div class="compact-list">${myFavorites.length ? `${myFavoriteResources.map(item => compactResource(item,true)).join("")}${myFavoriteArticles.map(item => compactArticle(item,true)).join("")}` : emptyState("收藏夹还是空的", "遇到好工具或文章时点一下收藏，就能在这里快速找到。")}</div>`;
  if (tab === "comments") return `<h2>我的评论</h2><p class="panel-subtitle">管理你分享过的真实使用体验。</p><div class="compact-list">${myComments.length ? myComments.sort((a,b) => b.created.localeCompare(a.created)).map(c => { const item = resources(true).find(r => r.id === c.resourceId); return `<div class="compact-item"><div class="compact-main"><span class="mini-logo" style="--card-bg:${item?.color || "#eee"}">${escapeHTML(item?.logo || "AI")}</span><div><strong>${escapeHTML(item?.name || "已下架资源")} · ${"★".repeat(c.rating)}</strong><small>${escapeHTML(c.content.slice(0,55))}${c.content.length > 55 ? "…" : ""}</small></div></div><button class="btn btn-danger btn-sm" data-action="delete-own-comment" data-id="${c.id}">删除</button></div>`; }).join("") : emptyState("还没有发表过评论", "你的真实体验，可以帮助其他人少走弯路。")}</div>`;
  if (tab === "submissions") return `<h2>我的发布</h2><p class="panel-subtitle">点击标题浏览前台内容，也可以继续编辑或删除。</p><div class="compact-list">${mySubmissions.length ? mySubmissions.map(submission => { const detailPath = submission.contentType === "article" ? `/article/${submission.targetId}` : `/resource/${submission.targetId}`; return `<div class="compact-item submission-item"><div class="compact-main"><span class="mini-logo" style="--card-bg:#e5e2f7">${escapeHTML(initials(submission.name))}</span><div><strong><a class="compact-title-link" href="#${detailPath}">${escapeHTML(submission.name)}</a></strong><small>${submission.created} · ${submission.contentType === "article" ? "学习文章" : escapeHTML(submission.category || "工具资源")}</small></div></div><div class="table-actions"><button class="btn btn-soft btn-sm" data-action="edit-submission" data-id="${submission.id}">编辑</button><button class="btn btn-danger btn-sm" data-action="delete-submission" data-id="${submission.id}">删除</button></div></div>`; }).join("") : emptyState("还没有发布过内容", "分享一款好工具，或写下你的学习与实践经验。", "去发布内容", "go-submit")}</div>`;
  if (tab === "messages") return `<h2>消息通知</h2><p class="panel-subtitle">与你的账号和社区互动相关的消息会出现在这里。</p><div class="compact-list"><div class="compact-item"><div class="compact-main"><span class="notice-dot"></span><div><strong>欢迎加入拾器</strong><small>你可以收藏工具、分享评价，也可以直接发布工具或学习文章。</small></div></div><small class="muted">刚刚</small></div></div>`;
  if (tab === "settings") return `<h2>资料设置</h2><p class="panel-subtitle">完善你的公开资料与账号信息。</p><form class="form-grid" id="profile-form"><div class="field"><label>昵称</label><input class="input" name="nickname" required maxlength="20" value="${escapeHTML(user.nickname)}"></div><div class="field"><label>邮箱</label><input class="input" value="${escapeHTML(user.email)}" disabled></div><div class="field wide"><label>个人简介</label><textarea class="textarea" name="bio" maxlength="120" placeholder="介绍一下自己">${escapeHTML(user.bio || "")}</textarea></div><div class="field"><label>性别</label><select class="select" name="gender">${["不公开","女","男","其他"].map(v => `<option ${user.gender === v ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="field"><label>生日</label><input class="input" type="date" name="birthday" value="${escapeHTML(user.birthday || "")}"></div><div class="wide"><button class="btn btn-primary" type="submit">保存修改</button></div></form><div class="profile-security"><h3>账号安全</h3><p class="panel-subtitle">密码经过安全哈希存储；重置密码需要验证注册邮箱。</p><button class="btn btn-light" data-action="forgot-password">重置密码</button></div>`;
  const recentFavorites = [...myFavoriteResources.map(item => ({ type: "resource", item })), ...myFavoriteArticles.map(item => ({ type: "article", item }))].slice(0,3);
  return `<h2>个人概览</h2><p class="panel-subtitle">欢迎回来，今天也去发现一个让工作更轻松的工具吧。</p><div class="summary-grid"><div class="summary-card"><strong>${myFavorites.length}</strong><span>已收藏内容</span></div><div class="summary-card"><strong>${myComments.length}</strong><span>发表过评价</span></div><div class="summary-card"><strong>${mySubmissions.length}</strong><span>已发布内容</span></div></div><h3 class="profile-recent-title">最近收藏</h3><div class="compact-list">${recentFavorites.map(entry => entry.type === "article" ? compactArticle(entry.item) : compactResource(entry.item)).join("") || `<p class="muted">还没有收藏内容。</p>`}</div>`;
}

function articleImagePreviewHTML() {
  if (!state.articleImagesDraft.length) return `<p class="image-preview-empty">还没有添加图片</p>`;
  return state.articleImagesDraft.map((src, index) => `<figure><img src="${escapeHTML(src)}" alt="文章配图预览 ${index + 1}"><button type="button" data-action="remove-article-image" data-index="${index}" aria-label="移除第 ${index + 1} 张图片">${icon("x")}</button><figcaption>${index === 0 ? "文章头图" : `正文配图 ${index}`}</figcaption></figure>`).join("");
}

function submitPage() {
  if (!state.currentUser) return `<main class="main"><div class="container page">${emptyState("登录后发布内容", "登录后即可直接发布工具或学习文章，不需要等待审核。", "去登录", "go-login")}</div></main>`;
  const isArticle = state.submitType === "article";
  const categories = state.toolChannel === "软件工具" ? SOFTWARE_CATEGORIES : CATEGORY_META.map(item => item.name);
  const form = isArticle ? `<form class="form-grid publish-form" id="submit-article-form">
      <div class="field wide"><label>文章标题 *</label><input class="input" name="title" required maxlength="80" placeholder="用清楚、具体的标题告诉读者能学到什么"></div>
      <div class="field"><label>文章分类 *</label><select class="select" name="category" required>${["AI 入门","学习方法","工具教程","研究方法","安全指南","内容创作","基础技能","数字生活"].map(value => `<option>${value}</option>`).join("")}</select></div>
      <div class="field"><label>标签</label><input class="input" name="tags" maxlength="60" placeholder="用逗号分隔，例如：笔记，工作流"></div>
      <div class="field wide"><label>文章配图</label><label class="article-upload-zone" for="article-image-input">${icon("upload")}<span><strong>选择图片</strong><small>支持 JPG、PNG、WebP，最多 3 张</small></span><input class="hidden" id="article-image-input" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><div class="article-image-preview" id="article-image-preview">${articleImagePreviewHTML()}</div><p class="field-hint">第一张作为文章头图，其余图片会按顺序穿插在正文段落之间；单张不超过 500KB。</p></div>
      <div class="field wide"><label>文章摘要 *</label><textarea class="textarea compact" name="excerpt" required maxlength="160" placeholder="用一两句话概括文章要解决的问题"></textarea></div>
      <div class="field wide"><label>正文 *</label><textarea class="textarea article-editor" name="body" required minlength="80" placeholder="写下你的方法、过程和结论。段落之间请空一行；粘贴完整 https:// 链接后，详情页会自动变成可新开页面的外链。"></textarea><p class="field-hint">建议包含真实场景、操作步骤、结果与限制。正文至少 80 个字。</p></div>
      <label class="check-row wide"><input type="checkbox" name="confirm" required>我确认内容为真实分享，并愿意为内容准确性负责。</label>
      <div class="wide publish-actions"><span>将以「${escapeHTML(state.currentUser.nickname)}」发布</span><button class="btn btn-primary btn-lg" type="submit">立即发布文章 ${icon("arrowRight")}</button></div>
    </form>` : `<form class="form-grid publish-form" id="submit-tool-form">
      <div class="field wide"><label>发布频道 *</label><div class="channel-switch"><button type="button" class="${state.toolChannel === "AI工具" ? "active" : ""}" data-action="set-tool-channel" data-value="AI工具">AI 工具</button><button type="button" class="${state.toolChannel === "软件工具" ? "active" : ""}" data-action="set-tool-channel" data-value="软件工具">软件工具</button></div></div>
      <div class="field"><label>工具名称 *</label><input class="input" name="name" required maxlength="50" placeholder="例如：一款好用的工具"></div>
      <div class="field"><label>官网 / 项目链接 *</label><input class="input" name="url" type="url" pattern="https?://.*" required placeholder="https://"></div>
      <div class="field"><label>所属分类 *</label><select class="select" name="category" required>${categories.map(value => `<option>${value}</option>`).join("")}</select></div>
      <div class="field"><label>标签</label><input class="input" name="tags" maxlength="60" placeholder="用逗号分隔，例如：图片处理，效率"></div>
      <div class="field wide"><label>一句话介绍 *</label><textarea class="textarea compact" name="summary" required maxlength="120" placeholder="它主要解决什么问题？适合谁使用？"></textarea></div>
      <div class="field wide"><label>详细体验 *</label><textarea class="textarea" name="reason" required minlength="20" maxlength="600" placeholder="分享真实使用场景、主要亮点、使用步骤或需要注意的地方。正文中的完整链接会在详情页自动变成外链。"></textarea></div>
      <label class="check-row wide"><input type="checkbox" name="confirm" required>我确认链接和描述真实有效，且内容不包含违法、侵权或恶意信息。</label>
      <div class="wide publish-actions"><span>将以「${escapeHTML(state.currentUser.nickname)}」发布</span><button class="btn btn-primary btn-lg" type="submit">立即发布工具 ${icon("arrowRight")}</button></div>
    </form>`;
  return `<main class="main"><div class="container page"><div class="publish-hero"><div><p class="eyebrow">PUBLISH TOGETHER</p><h1 class="section-title">发布你的发现与经验</h1><p class="section-note">每位用户都可以直接发布；拾器运营同样使用这里，以普通发布者身份参与社区。</p></div><div class="publish-type-tabs"><button class="${!isArticle ? "active" : ""}" data-action="set-submit-type" data-value="tool">${icon("grid")} 工具资源</button><button class="${isArticle ? "active" : ""}" data-action="set-submit-type" data-value="article">${icon("file")} 学习文章</button></div></div><div class="submit-layout">
    <section class="content-card">${form}</section>
    <aside class="submit-intro"><p class="eyebrow publish-eyebrow">COMMUNITY PUBLISHING</p><h2>发布后，内容立即可见。</h2><p>平台不设置投稿审核队列。社区通过举报与链接失效反馈共同维护内容质量，运营只处理被反馈的内容。</p><ol class="guide-list"><li><span class="guide-num">1</span><span>选择工具资源或学习文章</span></li><li><span class="guide-num">2</span><span>提供真实、清晰、可核验的信息</span></li><li><span class="guide-num">3</span><span>发布后继续根据反馈更新内容</span></li></ol></aside>
  </div></div></main>`;
}

const ADMIN_TABS = [
  ["dashboard","grid","数据看板"], ["resources","file","资源管理"], ["users","users","用户管理"], ["moderation","shield","内容审核"]
];

function adminPage() {
  if (!state.currentUser || state.currentUser.role !== "admin") return `<main class="main"><div class="container page">${emptyState("没有访问权限", "管理后台仅对管理员开放。", "返回首页", "go-home")}</div></main>`;
  return `<main class="main admin-shell"><aside class="admin-sidebar"><div class="admin-title"><h2>拾器管理台</h2><p>SHIQI OPERATION CONSOLE</p></div><nav class="admin-nav">${ADMIN_TABS.map(([key,ic,label]) => `<button class="${state.adminTab === key ? "active" : ""}" data-action="admin-tab" data-tab="${key}">${icon(ic)} ${label}</button>`).join("")}</nav></aside><section class="admin-content">${adminPanel(state.adminTab)}</section></main>`;
}

function adminPanel(tab) {
  const allResources = resources(true);
  const allUsers = users();
  const allReports = state.data.reports;
  if (tab === "resources") return `<div class="admin-head"><div><h1>资源管理</h1><p>编辑资源信息与控制展示状态。新增内容统一从前台发布。</p></div><button class="btn btn-primary" data-action="new-resource">${icon("plus")} 前台发布</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>资源</th><th>频道 / 分类</th><th>发布者</th><th>数据</th><th>状态</th><th>操作</th></tr></thead><tbody>${allResources.map(r => `<tr><td><div class="table-resource"><span class="mini-logo" style="--card-bg:${r.color}">${escapeHTML(r.logo)}</span><strong>${escapeHTML(r.name)}</strong></div></td><td>${escapeHTML(r.category)} · ${escapeHTML(r.subcategory)}</td><td>${escapeHTML(r.source)}</td><td>${formatNumber(r.views)} 浏览</td><td><span class="status ${r.status === "online" ? "" : "offline"}">${r.status === "online" ? "展示中" : "已隐藏"}</span></td><td><div class="table-actions"><button class="btn btn-light btn-sm" data-action="edit-resource" data-id="${r.id}">编辑</button><button class="btn ${r.status === "online" ? "btn-danger" : "btn-soft"} btn-sm" data-action="toggle-resource-status" data-id="${r.id}">${r.status === "online" ? "隐藏" : "恢复"}</button></div></td></tr>`).join("")}</tbody></table></div>`;
  if (tab === "users") return `<div class="admin-head"><div><h1>用户管理</h1><p>查看用户状态与角色权限。</p></div><span class="result-count">${allUsers.length} 位用户</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>用户</th><th>邮箱</th><th>角色</th><th>注册时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${allUsers.map(u => `<tr><td><div class="table-resource"><span class="avatar">${escapeHTML(initials(u.nickname))}</span><strong>${escapeHTML(u.nickname)}</strong></div></td><td>${escapeHTML(u.email)}</td><td>${u.role === "admin" ? "管理员" : "注册用户"}</td><td>${u.joined || "—"}</td><td><span class="status ${u.status === "banned" ? "banned" : ""}">${u.status === "banned" ? "已封禁" : "正常"}</span></td><td>${u.role === "admin" ? `<span class="muted">—</span>` : `<button class="btn ${u.status === "banned" ? "btn-soft" : "btn-danger"} btn-sm" data-action="toggle-user-status" data-id="${u.id}">${u.status === "banned" ? "解封" : "封禁"}</button>`}</td></tr>`).join("")}</tbody></table></div>`;
  if (tab === "moderation") {
    const pendingReports = allReports.filter(report => report.status === "pending");
    return `<div class="admin-head"><div><h1>内容审核</h1><p>这里只处理用户举报、链接失效和信息错误反馈；正常发布内容与评论不进入审核队列。</p></div><span class="result-count">${pendingReports.length} 项待处理</span></div><div class="chart-card report-queue"><h3>举报与反馈 · ${pendingReports.length} 项</h3><div class="compact-list">${pendingReports.length ? pendingReports.map(report => { const target = report.targetType === "article" ? articles(true).find(item => item.id === report.targetId) : allResources.find(item => item.id === (report.targetId || report.resourceId)); const reporter = allUsers.find(user => user.id === report.userId); return `<div class="compact-item report-item"><div class="compact-main"><span class="metric-icon">${icon("alert")}</span><div><strong>${escapeHTML(report.type)} · ${escapeHTML(target?.title || target?.name || "未知内容")}</strong><small>${escapeHTML(report.detail)} · 提交者：${escapeHTML(reporter?.nickname || "访客")} · ${report.created}</small></div></div><div class="table-actions"><button class="btn btn-soft btn-sm" data-action="resolve-report" data-id="${report.id}">标记已处理</button><button class="btn btn-light btn-sm" data-action="dismiss-report" data-id="${report.id}">忽略</button></div></div>`; }).join("") : `<div class="empty-state admin-empty-state"><h3>暂无待处理举报</h3><p>所有反馈均已处理。正常发布内容不会出现在这里。</p></div>`}</div></div>`;
  }
  const pending = allReports.filter(report => report.status === "pending").length;
  const chartValues = [42,61,54,78,66,92,84];
  return `<div class="admin-head"><div><h1>数据看板</h1><p>平台内容与用户核心指标概览。</p></div><span class="result-count">数据更新于 ${today()}</span></div><div class="metric-grid"><div class="metric-card"><span class="metric-icon">${icon("file")}</span><strong>${allResources.filter(r => r.status === "online").length + articles().length}</strong><span>公开内容 · 本周持续增长</span></div><div class="metric-card"><span class="metric-icon">${icon("users")}</span><strong>${formatNumber(5286 + allUsers.length)}</strong><span>累计注册用户 · +12.6%</span></div><div class="metric-card"><span class="metric-icon">${icon("eye")}</span><strong>8.6w</strong><span>本月内容访问 · +18.2%</span></div><div class="metric-card"><span class="metric-icon">${icon("shield")}</span><strong>${pending}</strong><span>待处理举报</span></div></div><div class="chart-card"><h3>近 7 日访问趋势</h3><div class="bar-chart">${chartValues.map((v,i) => `<div class="bar-col"><div class="bar" style="height:${v}%"></div><span>${["周四","周五","周六","周日","周一","周二","今天"][i]}</span></div>`).join("")}</div></div>`;
}

function notFoundPage() { return `<main class="main"><div class="container page">${emptyState("页面没有找到", "它可能已被移动、删除或暂时下架。", "返回首页", "go-home")}</div></main>`; }
function loadingPage() { return `<main class="main"><div class="container page"><div class="empty-state"><div class="empty-icon skeleton"></div><h3>正在加载…</h3></div></div></main>`; }

function modalFrame(title, subtitle, body, actions = "") {
  return `<div class="modal-head"><div><h2>${escapeHTML(title)}</h2>${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ""}</div><button class="modal-close" data-action="close-modal">${icon("x")}</button></div><div class="modal-body">${body}</div>${actions ? `<div class="modal-actions">${actions}</div>` : ""}`;
}

function reportModal(targetId, targetType = "resource") {
  const item = targetType === "article" ? articles(true).find(article => article.id === targetId) : resources(true).find(resource => resource.id === targetId);
  const title = item?.title || item?.name || "该内容";
  openModal(modalFrame("提交内容反馈", `关于「${title}」`, `<form id="report-form" class="auth-form" data-target-id="${targetId}" data-target-type="${targetType}"><div class="field"><label>问题类型</label><select class="select" name="type"><option>链接失效</option><option>信息错误</option><option>内容违规</option><option>疑似侵权</option><option>其他问题</option></select></div><div class="field"><label>补充说明</label><textarea class="textarea" name="detail" required maxlength="300" placeholder="请描述你遇到的问题，方便运营人员核查处理"></textarea></div><button class="btn btn-primary btn-block" type="submit">提交反馈</button></form>`));
}

function submissionEditorModal(submissionId) {
  const submission = submissions().find(item => item.id === submissionId);
  if (!submission || submission.userId !== state.currentUser?.id) return showToast("没有权限编辑该内容", "error");
  const isArticle = submission.contentType === "article";
  const target = isArticle ? articles(true).find(item => item.id === submission.targetId) : resources(true).find(item => item.id === submission.targetId);
  if (!target) return showToast("前台内容不存在，无法编辑", "error");
  const articleCategories = ["AI 入门","学习方法","工具教程","研究方法","安全指南","内容创作","基础技能","数字生活"];
  const allToolCategories = [...CATEGORY_META.map(item => item.name), ...SOFTWARE_CATEGORIES];
  const form = isArticle
    ? `<form id="user-submission-form" class="form-grid" data-submission-id="${submission.id}" data-target-id="${target.id}" data-content-type="article"><div class="field wide"><label>文章标题 *</label><input class="input" name="title" required maxlength="80" value="${escapeHTML(target.title)}"></div><div class="field"><label>文章分类 *</label><select class="select" name="category">${articleCategories.map(value => `<option ${target.category === value ? "selected" : ""}>${value}</option>`).join("")}</select></div><div class="field"><label>标签</label><input class="input" name="tags" maxlength="60" value="${escapeHTML(target.tags.join("，"))}"></div><div class="field wide"><label>文章摘要 *</label><textarea class="textarea compact" name="excerpt" required maxlength="160">${escapeHTML(target.excerpt)}</textarea></div><div class="field wide"><label>正文 *</label><textarea class="textarea article-editor" name="body" required minlength="80">${escapeHTML(target.body.join("\n\n"))}</textarea><p class="field-hint">现有文章配图会继续保留。</p></div><div class="wide modal-form-actions"><button class="btn btn-light" type="button" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存并更新前台</button></div></form>`
    : `<form id="user-submission-form" class="form-grid" data-submission-id="${submission.id}" data-target-id="${target.id}" data-content-type="tool"><div class="field"><label>工具名称 *</label><input class="input" name="name" required maxlength="50" value="${escapeHTML(target.name)}"></div><div class="field"><label>官网 / 项目链接 *</label><input class="input" name="url" type="url" pattern="https?://.*" required value="${escapeHTML(target.website)}"></div><div class="field"><label>发布频道 *</label><select class="select" name="channel"><option value="AI工具" ${target.category === "AI工具" ? "selected" : ""}>AI 工具</option><option value="软件工具" ${target.category === "软件工具" ? "selected" : ""}>软件工具</option></select></div><div class="field"><label>所属分类 *</label><select class="select" name="category">${allToolCategories.map(value => `<option ${target.subcategory === value ? "selected" : ""}>${value}</option>`).join("")}</select></div><div class="field wide"><label>标签</label><input class="input" name="tags" maxlength="60" value="${escapeHTML(target.tags.join("，"))}"></div><div class="field wide"><label>一句话介绍 *</label><textarea class="textarea compact" name="summary" required maxlength="120">${escapeHTML(target.short)}</textarea></div><div class="field wide"><label>详细体验 *</label><textarea class="textarea" name="reason" required minlength="20" maxlength="600">${escapeHTML(submission.reason || target.description)}</textarea></div><div class="wide modal-form-actions"><button class="btn btn-light" type="button" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">保存并更新前台</button></div></form>`;
  openModal(modalFrame(isArticle ? "编辑学习文章" : "编辑工具资源", "保存后会立即同步到前台详情页。", form), true);
}

function deleteSubmissionModal(submissionId) {
  const submission = submissions().find(item => item.id === submissionId);
  if (!submission || submission.userId !== state.currentUser?.id) return showToast("没有权限删除该内容", "error");
  openModal(modalFrame("删除已发布内容", `「${submission.name}」将从前台移除`, `<p class="rich-copy">删除后，该内容的详情页、关联收藏与评论将一并移除，且无法撤销。</p>`, `<button class="btn btn-light" data-action="close-modal">取消</button><button class="btn btn-danger" data-action="confirm-delete-submission" data-id="${submission.id}">确认删除</button>`));
}

function resourceEditorModal(item = null) {
  const editing = Boolean(item);
  const data = item || { name: "", website: "", category: "AI工具", subcategory: CATEGORY_META[0].name, short: "", tags: [], description: "", status: "online" };
  const allCategories = [...CATEGORY_META.map(c => c.name), ...SOFTWARE_CATEGORIES];
  openModal(modalFrame(editing ? "编辑资源" : "新增资源", "修改会直接同步到前台详情页。", `<form id="admin-resource-form" class="form-grid" data-id="${item?.id || ""}"><div class="field"><label>工具名称 *</label><input class="input" id="admin-resource-name" name="name" required value="${escapeHTML(data.name)}"></div><div class="field"><label>官网链接 *</label><input class="input" name="website" type="url" pattern="https?://.*" required value="${escapeHTML(data.website)}" placeholder="https://"></div><div class="field"><label>内容频道</label><select class="select" name="category"><option value="AI工具" ${data.category === "AI工具" ? "selected" : ""}>AI 工具</option><option value="软件工具" ${data.category === "软件工具" ? "selected" : ""}>软件工具</option></select></div><div class="field"><label>分类</label><select class="select" id="admin-resource-category" name="subcategory">${allCategories.map(value => `<option ${data.subcategory === value ? "selected" : ""}>${value}</option>`).join("")}</select></div><div class="field wide"><label>一句话介绍</label><textarea class="textarea" id="admin-resource-short" name="short" required>${escapeHTML(data.short)}</textarea></div><div class="field wide"><label>标签（逗号分隔）</label><input class="input" id="admin-resource-tags" name="tags" value="${escapeHTML(data.tags.join("，"))}"></div><div class="field wide"><label>详细介绍</label><textarea class="textarea admin-description" id="admin-resource-description" name="description" required>${escapeHTML(data.description)}</textarea></div><div class="field"><label>展示状态</label><select class="select" name="status"><option value="online" ${data.status === "online" ? "selected" : ""}>展示中</option><option value="offline" ${data.status === "offline" ? "selected" : ""}>已隐藏</option></select></div><div class="field"><label>内容辅助</label><button class="btn btn-soft" type="button" data-action="ai-assist">${icon("spark")} AI 辅助补全</button></div><div class="wide modal-form-actions"><button class="btn btn-light" type="button" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">${editing ? "保存修改" : "创建资源"}</button></div></form>`), true);
}

function renderApp(scrollTop = false) {
  state.route = parseRoute();
  if (state.route.path === "/profile" && state.route.params.get("tab")) state.profileTab = state.route.params.get("tab");
  if (state.route.path === "/admin" && state.route.params.get("tab")) state.adminTab = state.route.params.get("tab");
  if (state.route.path === "/submit" && state.route.params.get("type")) state.submitType = state.route.params.get("type") === "article" ? "article" : "tool";
  let page;
  if (state.route.path === "/") page = homePage();
  else if (state.route.path === "/search") page = searchPage();
  else if (state.route.path === "/resources") page = resourcesPage();
  else if (state.route.path === "/software") page = softwarePage();
  else if (state.route.path === "/learning") page = learningPage();
  else if (state.route.parts[0] === "article" && state.route.parts[1]) page = articleDetailPage(state.route.parts[1]);
  else if (state.route.parts[0] === "resource" && state.route.parts[1]) page = detailPage(state.route.parts[1]);
  else if (state.route.path === "/auth") page = authPage();
  else if (state.route.path === "/profile") page = profilePage();
  else if (state.route.path === "/submit") page = submitPage();
  else if (state.route.path === "/admin") page = adminPage();
  else page = notFoundPage();
  const hideFooter = ["/auth", "/admin"].includes(state.route.path);
  document.querySelector("#app").innerHTML = `<div class="app-shell">${headerHTML()}${page}${hideFooter ? "" : footerHTML()}</div>`;
  document.title = pageTitle();
  document.querySelector("#main-nav")?.classList.remove("open");
  if (scrollTop) window.scrollTo({ top: 0, behavior: "instant" });
  if (state.route.path === "/search") requestAnimationFrame(focusSearchInput);
}

function pageTitle() {
  if (state.route.path === "/search") {
    const query = (state.route.params.get("q") || "").trim();
    return query ? `搜索“${query}” · 拾器` : "全站搜索 · 拾器";
  }
  if (state.route.parts[0] === "resource") {
    const item = resources(true).find(r => r.id === state.route.parts[1]);
    return item ? `${item.name} · 拾器` : "页面未找到 · 拾器";
  }
  if (state.route.parts[0] === "article") {
    const article = articles(true).find(item => item.id === state.route.parts[1]);
    return article ? `${article.title} · 拾器学习资源` : "文章未找到 · 拾器";
  }
  return ({ "/": "拾器 · 发现优质AI工具与数字资源", "/resources": "AI 工具 · 拾器", "/software": "软件工具 · 拾器", "/learning": "学习资源 · 拾器", "/auth": "登录与注册 · 拾器", "/profile": "个人中心 · 拾器", "/submit": "发布内容 · 拾器", "/admin": "管理后台 · 拾器" })[state.route.path] || "拾器 SHIQI";
}

function handleResourceIcon(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.matches("[data-resource-icon]")) return;
  if (event.type === "load" && image.naturalWidth > 0) image.classList.add("loaded");
  else image.remove();
}

if (typeof document !== "undefined") {
document.addEventListener("load", handleResourceIcon, true);
document.addEventListener("error", handleResourceIcon, true);

document.addEventListener("click", async event => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;
  const action = trigger.dataset.action;
  const id = trigger.dataset.id;
  if (action === "toggle-menu") return document.querySelector("#main-nav")?.classList.toggle("open");
  if (action === "open-resource") return navigate(`/resource/${id}`);
  if (action === "open-article") return navigate(`/article/${id}`);
  if (action === "toggle-global-search") {
    if (state.route.path === "/search") closeSearchPage();
    else openSearchPage("");
    return;
  }
  if (action === "clear-global-search") return updateSearchPage("");
  if (action === "go-profile") return navigate("/profile");
  if (action === "go-login") return navigate("/auth");
  if (action === "go-home") return navigate("/");
  if (action === "reload-app") return location.reload();
  if (action === "go-submit") return navigate("/submit");
  if (action === "category-search") return navigate("/resources", { category: trigger.dataset.category });
  if (action === "hot-search") {
    const query = trigger.dataset.query;
    const history = getLocal("searchHistory", []).filter(v => v !== query);
    setLocal("searchHistory", [query, ...history].slice(0, 10));
    return openSearchPage(query);
  }
  if (action === "set-category") return updateRouteParams({ category: trigger.dataset.value });
  if (action === "set-software-category") return updateRouteParams({ category: trigger.dataset.value });
  if (action === "set-learning-sort") return updateRouteParams({ sort: trigger.dataset.value });
  if (action === "clear-filters") return navigate("/resources");
  if (action === "clear-software-filters") return navigate("/software");
  if (action === "clear-learning-filters") { state.articleLimit = 6; return navigate("/learning"); }
  if (action === "load-more") { state.listLimit += 8; return renderApp(false); }
  if (action === "load-more-articles") { state.articleLimit += 6; return renderApp(false); }
  if (action === "set-submit-type") { state.submitType = trigger.dataset.value; return navigate("/submit", { type: state.submitType }); }
  if (action === "set-tool-channel") { state.toolChannel = trigger.dataset.value; return renderApp(false); }
  if (action === "remove-article-image") {
    state.articleImagesDraft.splice(Number(trigger.dataset.index), 1);
    const preview = document.querySelector("#article-image-preview");
    if (preview) preview.innerHTML = articleImagePreviewHTML();
    return;
  }
  if (action === "toggle-favorite") {
    event.stopPropagation();
    if (!requireLogin("登录后即可收藏内容")) return;
    const targetType = trigger.dataset.type || (resources(true).some(item => item.id === id) ? "resource" : "article");
    try {
      const result = await apiRequest("/api/favorites/toggle", { method: "POST", body: { targetType, targetId: id } });
      state.data.favorites = result.favorite
        ? [...state.data.favorites.filter(entry => !(entry.type === targetType && entry.id === id)), { type: targetType, id }]
        : state.data.favorites.filter(entry => !(entry.type === targetType && entry.id === id));
      const collection = targetType === "article" ? state.data.articles : state.data.resources;
      const delta = result.favorite ? 1 : -1;
      collection.forEach(item => { if (item.id === id) item.favorites = Math.max(0, (item.favorites || 0) + delta); });
      renderApp(false);
      showToast(result.favorite ? "已加入收藏" : "已取消收藏");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "visit-resource") {
    const item = resources(true).find(r => r.id === id); if (!item) return;
    window.open(item.website, "_blank", "noopener,noreferrer");
    item.views += 1;
    renderApp(false);
    apiRequest(`/api/resources/${encodeURIComponent(id)}/view`, { method: "POST", body: {} }).catch(() => {});
    return;
  }
  if (action === "share-resource") {
    try { await navigator.clipboard.writeText(location.href); showToast("分享链接已复制"); }
    catch { showToast("请复制浏览器地址栏中的链接"); }
    return;
  }
  if (action === "set-rating") { state.ratingDraft = Number(trigger.dataset.rating); renderApp(false); return; }
  if (action === "like-comment") {
    if (!requireLogin("登录后才能点赞评价")) return;
    try {
      const result = await apiRequest(`/api/comments/${encodeURIComponent(id)}/like`, { method: "POST", body: {} });
      if (result.added) state.data.comments.forEach(comment => { if (comment.id === id) comment.likes = (comment.likes || 0) + 1; });
      renderApp(false); showToast(result.added ? "谢谢你的反馈" : "你已经点过赞了");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "reply-comment") return showToast("回复功能正在完善中");
  if (action === "delete-own-comment") {
    const target = comments().find(c => c.id === id);
    if (!target || target.userId !== state.currentUser?.id) return showToast("无权删除该评论", "error");
    try {
      await apiRequest(`/api/comments/${encodeURIComponent(id)}`, { method: "DELETE" });
      state.data.comments = comments().filter(c => c.id !== id);
      renderApp(false); showToast("评论已删除");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "edit-submission") return submissionEditorModal(id);
  if (action === "delete-submission") return deleteSubmissionModal(id);
  if (action === "confirm-delete-submission") {
    const submission = submissions().find(item => item.id === id);
    if (!submission || submission.userId !== state.currentUser?.id) return showToast("没有权限删除该内容", "error");
    try {
      await apiRequest(`/api/submissions/${encodeURIComponent(id)}`, { method: "DELETE" });
      closeModal();
      await loadBootstrap();
      await loadDashboardData();
      renderApp(false);
      showToast("已删除发布内容");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "open-report") return reportModal(id, trigger.dataset.type || "resource");
  if (action === "close-modal") return closeModal();
  if (action === "close-modal-backdrop" && event.target === trigger) return closeModal();
  if (action === "auth-tab") { state.authMode = trigger.dataset.mode; return renderApp(false); }
  if (action === "send-code") {
    const form = trigger.closest("form");
    const email = form?.querySelector('[name="email"]')?.value.trim();
    const purpose = trigger.dataset.purpose || (form?.id === "reset-form" ? "reset" : "register");
    if (!email) return showToast("请先填写有效邮箱", "error");
    if (verificationCodeButtonState(state.verificationCodeCooldowns[purpose]).disabled) return;
    trigger.disabled = true;
    trigger.textContent = "发送中…";
    try {
      const result = await apiRequest("/api/auth/request-code", { method: "POST", body: { email, purpose } });
      startVerificationCodeCooldown(purpose);
      showToast(result.developmentCode ? `验证码已发送（开发环境：${result.developmentCode}）` : result.message);
    } catch (error) { showToast(error.message, "error"); }
    finally { syncVerificationCodeButtons(); }
    return;
  }
  if (action === "forgot-password") return openModal(modalFrame("重置密码", "验证码将发送到你的注册邮箱。", `<form id="reset-form" class="auth-form"><div class="field"><label>邮箱</label><input class="input" name="email" type="email" required autocomplete="email" placeholder="name@example.com"></div><div class="field"><label>验证码</label><div class="auth-code-row"><input class="input" name="code" required inputmode="numeric" autocomplete="one-time-code" placeholder="请输入 6 位验证码">${verificationCodeButtonHTML("reset")}</div></div><div class="field"><label>新密码</label><input class="input" name="password" type="password" required autocomplete="new-password" placeholder="10–72 位，包含字母和数字"></div><button class="btn btn-primary btn-block" type="submit">确认重置</button></form>`));
  if (action === "logout") {
    try { await apiRequest("/api/auth/logout", { method: "POST", body: {} }); } catch {}
    state.currentUser = null;
    state.data.favorites = [];
    state.data.submissions = [];
    navigate("/"); showToast("已安全退出"); return;
  }
  if (action === "profile-tab") { state.profileTab = trigger.dataset.tab; return navigate("/profile", { tab: state.profileTab }); }
  if (action === "admin-tab") { state.adminTab = trigger.dataset.tab; return navigate("/admin", { tab: state.adminTab }); }
  if (action === "new-resource") return navigate("/submit", { type: "tool" });
  if (action === "edit-resource") return resourceEditorModal(resources(true).find(r => r.id === id));
  if (action === "ai-assist") {
    const name = document.querySelector("#admin-resource-name")?.value.trim();
    const category = document.querySelector("#admin-resource-category")?.value;
    if (!name) return showToast("请先填写工具名称", "error");
    const short = document.querySelector("#admin-resource-short"); const tags = document.querySelector("#admin-resource-tags"); const desc = document.querySelector("#admin-resource-description");
    short.value = `${name} 是一款面向真实工作场景的 ${category.replace("AI ", "")}工具，帮助用户更高效地完成创作与信息处理。`;
    tags.value = "新手友好，效率提升，AI 工具";
    desc.value = `${name} 聚焦于日常工作中的高频需求，通过清晰的交互与 AI 能力简化复杂流程。建议首次使用时从一个具体、边界清楚的小任务开始，逐步验证输出结果，并根据真实场景继续调整。此内容由 AI 辅助生成，发布前请人工核验功能与链接信息。`;
    showToast("AI 已生成初稿，请人工复核后发布"); return;
  }
  if (action === "toggle-resource-status") {
    const all = resources(true); const item = all.find(r => r.id === id); if (!item) return;
    const next = item.status === "online" ? "offline" : "online";
    try {
      await apiRequest(`/api/admin/resources/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status: next } });
      item.status = next; renderApp(false); showToast(next === "online" ? "资源已上架" : "资源已下架");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "toggle-user-status") {
    const all = users(); const user = all.find(u => u.id === id); if (!user || user.role === "admin") return;
    const next = user.status === "banned" ? "active" : "banned";
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status: next } });
      user.status = next; renderApp(false); showToast(next === "banned" ? "用户已封禁" : "用户已解封");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "resolve-report" || action === "dismiss-report") {
    const next = action === "resolve-report" ? "resolved" : "dismissed";
    try {
      await apiRequest(`/api/admin/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: { status: next } });
      state.data.reports.forEach(report => { if (report.id === id) Object.assign(report, { status: next, handledAt: today(), handledBy: state.currentUser?.id }); });
      renderApp(false); showToast(next === "resolved" ? "反馈已标记处理" : "反馈已忽略");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "show-about") return openModal(modalFrame("关于拾器", "发现优质AI工具与数字资源。", `<p class="rich-copy">拾器是一个由用户共同发布和维护的工具与学习资源社区。我们希望用清晰的分类、真实的评价和可直接访问的来源链接，降低寻找与试错成本。</p><p class="rich-copy">拾器运营也使用前台发布入口，以普通社区用户的方式分享内容。</p>`));
  if (action === "show-policy") return openModal(modalFrame("发布与使用说明", "社区内容规则摘要", `<p class="rich-copy">工具和文章发布后直接展示，不进入预审队列。运营后台只处理用户提交的内容违规、疑似侵权、信息错误和链接失效反馈。</p><p class="rich-copy">本平台仅提供资源信息与外部链接导航，不托管第三方软件文件。所有外链会在新页面打开，请在离开本站后自行核验来源与安全性。</p>`));
});

document.addEventListener("input", event => {
  if (event.target.id !== "global-search-input") return;
  document.querySelector(".global-search-clear")?.classList.toggle("hidden", !event.target.value);
});

document.addEventListener("change", async event => {
  if (event.target.id === "sort-select") updateRouteParams({ sort: event.target.value });
  if (event.target.id === "software-sort-select") updateRouteParams({ sort: event.target.value });
  if (event.target.id === "article-image-input") {
    const files = [...(event.target.files || [])].slice(0, 3);
    if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) return showToast("请选择 JPG、PNG 或 WebP 图片", "error");
    if (files.some(file => file.size > 500 * 1024)) return showToast("单张图片不能超过 500KB", "error");
    const readImage = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      state.articleImagesDraft = await Promise.all(files.map(readImage));
      const preview = document.querySelector("#article-image-preview");
      if (preview) preview.innerHTML = articleImagePreviewHTML();
      showToast(`已添加 ${state.articleImagesDraft.length} 张文章配图`);
    } catch {
      showToast("图片读取失败，请重新选择", "error");
    }
  }
});

document.addEventListener("submit", async event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === "global-search-form") {
    const query = String(data.get("q") || "").trim();
    if (!query) return form.querySelector("input")?.focus();
    const history = getLocal("searchHistory", []).filter(value => value !== query);
    setLocal("searchHistory", [query, ...history].slice(0,10));
    return updateSearchPage(query);
  }
  if (form.id === "home-search") {
    const query = String(data.get("q") || "").trim();
    if (!query) return form.querySelector("input")?.focus();
    const history = getLocal("searchHistory", []).filter(v => v !== query);
    setLocal("searchHistory", [query, ...history].slice(0,10));
    return openSearchPage(query);
  }
  if (form.id === "auth-form") {
    const mode = form.dataset.mode;
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      if (mode === "login") {
        const result = await apiRequest("/api/auth/login", { method: "POST", body: { email, password } });
        state.currentUser = result.user;
        await loadBootstrap();
        showToast(`欢迎回来，${result.user.nickname}`);
        return navigate("/profile");
      }
      const confirmPassword = String(data.get("confirmPassword") || "");
      if (password !== confirmPassword) return showToast("两次输入的密码不一致", "error");
      const result = await apiRequest("/api/auth/register", { method: "POST", body: {
        email,
        password,
        code: String(data.get("code") || "").trim(),
        nickname: String(data.get("nickname") || "").trim(),
        agreement: Boolean(data.get("agreement")),
      } });
      state.currentUser = result.user;
      await loadBootstrap();
      showToast("注册成功，欢迎加入拾器");
      return navigate("/profile");
    } catch (error) { showToast(error.message, "error"); }
    finally { submitButton.disabled = false; }
    return;
  }
  if (form.id === "comment-form") {
    if (!requireLogin("登录后才能发表评价")) return;
    const content = String(data.get("content") || "").trim();
    try {
      const result = await apiRequest("/api/comments", { method: "POST", body: { resourceId: form.dataset.resourceId, rating: state.ratingDraft, content } });
      state.data.comments = [result.comment, ...comments()];
      state.ratingDraft = 5;
      renderApp(false); showToast("评价已发布");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "submit-tool-form") {
    if (!requireLogin()) return;
    try {
      const result = await apiRequest("/api/resources", { method: "POST", body: {
        name: String(data.get("name") || "").trim(),
        website: String(data.get("url") || "").trim(),
        channel: state.toolChannel,
        category: String(data.get("category") || ""),
        tags: parseTags(data.get("tags")),
        summary: String(data.get("summary") || "").trim(),
        reason: String(data.get("reason") || "").trim(),
      } });
      await loadBootstrap();
      showToast("工具已发布");
      return navigate(`/resource/${result.resource.id}`);
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "submit-article-form") {
    if (!requireLogin()) return;
    try {
      let images = [];
      if (state.articleImagesDraft.length) {
        const uploaded = await apiRequest("/api/uploads/images", { method: "POST", body: { images: state.articleImagesDraft } });
        images = uploaded.images;
      }
      const result = await apiRequest("/api/articles", { method: "POST", body: {
        title: String(data.get("title") || "").trim(),
        excerpt: String(data.get("excerpt") || "").trim(),
        category: String(data.get("category") || ""),
        tags: parseTags(data.get("tags")),
        body: String(data.get("body") || "").trim(),
        images,
      } });
      state.articleImagesDraft = [];
      await loadBootstrap();
      showToast("文章已发布");
      return navigate(`/article/${result.article.id}`);
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "user-submission-form") {
    const submissionId = form.dataset.submissionId;
    const contentType = form.dataset.contentType;
    const submission = submissions().find(item => item.id === submissionId);
    if (!submission || submission.userId !== state.currentUser?.id) return showToast("没有权限编辑该内容", "error");
    const body = contentType === "article" ? {
      title: String(data.get("title") || "").trim(),
      excerpt: String(data.get("excerpt") || "").trim(),
      category: String(data.get("category") || ""),
      tags: parseTags(data.get("tags")),
      body: String(data.get("body") || "").trim(),
    } : {
      name: String(data.get("name") || "").trim(),
      website: String(data.get("url") || "").trim(),
      channel: String(data.get("channel") || ""),
      category: String(data.get("category") || ""),
      tags: parseTags(data.get("tags")),
      summary: String(data.get("summary") || "").trim(),
      reason: String(data.get("reason") || "").trim(),
    };
    try {
      await apiRequest(`/api/submissions/${encodeURIComponent(submissionId)}`, { method: "PATCH", body });
      closeModal();
      await loadBootstrap();
      await loadDashboardData();
      renderApp(false);
      showToast("内容已更新并同步到前台");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "profile-form") {
    try {
      const result = await apiRequest("/api/me/profile", { method: "PATCH", body: { nickname: String(data.get("nickname") || "").trim(), bio: String(data.get("bio") || "").trim(), gender: String(data.get("gender") || ""), birthday: String(data.get("birthday") || "") } });
      state.currentUser = result.user;
      renderApp(false); showToast("个人资料已更新");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "report-form") {
    try {
      await apiRequest("/api/reports", { method: "POST", body: { targetId: form.dataset.targetId, targetType: form.dataset.targetType || "resource", type: String(data.get("type") || ""), detail: String(data.get("detail") || "").trim() } });
      closeModal(); showToast("反馈已收到，感谢你的帮助");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "reset-form") {
    try {
      const email = String(data.get("email") || "").trim().toLowerCase();
      await apiRequest("/api/auth/reset-password", { method: "POST", body: { email, code: String(data.get("code") || "").trim(), password: String(data.get("password") || "") } });
      const resetCurrentSession = state.currentUser?.email?.toLowerCase() === email;
      if (resetCurrentSession) {
        state.currentUser = null;
        state.data.favorites = [];
        state.data.submissions = [];
      }
      closeModal();
      showToast("密码已重置，请重新登录");
      if (resetCurrentSession) navigate("/auth");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (form.id === "admin-resource-form") {
    const existingId = form.dataset.id;
    const existing = resources(true).find(r => r.id === existingId);
    if (!existing) return showToast("请通过前台发布入口创建新资源", "error");
    try {
      const result = await apiRequest(`/api/admin/resources/${encodeURIComponent(existingId)}`, { method: "PATCH", body: {
        name: String(data.get("name") || "").trim(), website: String(data.get("website") || "").trim(), category: String(data.get("category") || "AI工具"),
        subcategory: String(data.get("subcategory") || ""), tags: parseTags(data.get("tags")), short: String(data.get("short") || "").trim(),
        description: String(data.get("description") || "").trim(), status: String(data.get("status") || "online"),
      } });
      state.data.resources = resources(true).map(item => item.id === existingId ? result.resource : item);
      closeModal(); renderApp(false); showToast("资源信息已更新");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
});

window.addEventListener("hashchange", async () => {
  try {
    await prepareRouteData();
    renderApp(true);
  } catch (error) {
    showToast(error.message, "error");
    if (error.status === 401) navigate("/auth");
  }
});
window.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (state.route.path === "/search") closeSearchPage();
  else closeModal();
});

async function initializeApp() {
  if (!location.hash) history.replaceState(null, "", "#/" );
  document.querySelector("#app").innerHTML = loadingPage();
  try {
    await loadBootstrap();
    await prepareRouteData();
    renderApp(false);
  } catch (error) {
    document.querySelector("#app").innerHTML = `<main class="main"><div class="container page">${emptyState("暂时无法连接服务", escapeHTML(error.message), "重新加载", "reload-app")}</div></main>`;
  }
}

initializeApp();
}
