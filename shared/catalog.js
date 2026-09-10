// Set iconSrc to the uploaded SVG path to replace a home domain placeholder.
export const DOMAINS = [
  {
    id: "design",
    iconSrc: "/assets/domain-design.svg",
    name: "AI 设计与图像",
    description: "从建筑、服装到品牌与三维，探索 AI 的创作方式。",
    icon: "◈",
  },
  {
    id: "video",
    iconSrc: "/assets/domain-video.svg",
    name: "AI 视频与动画",
    description: "生成影像、控制镜头，让角色与故事连贯起来。",
    icon: "▷",
  },
  {
    id: "audio",
    iconSrc: "/assets/domain-audio.svg",
    name: "AI 音频与数字人",
    description: "配音、声音克隆、音乐与数字人的创作实践。",
    icon: "≋",
  },
  {
    id: "coding",
    iconSrc: "/assets/domain-coding.svg",
    name: "AI 编程与应用开发",
    description: "与 AI 一起开发应用、插件、游戏与完整产品。",
    icon: "⌘",
  },
  {
    id: "agent",
    iconSrc: "/assets/domain-agent.svg",
    name: "Agent 与自动化",
    description: "连接工具与知识，让可以复用的流程持续工作。",
    icon: "⌁",
  },
];
export const RESOURCE_KINDS = [
  { id: "tool", name: "工具与应用" },
  { id: "model", name: "模型与 LoRA" },
  { id: "skill", name: "Skills" },
  { id: "workflow", name: "工作流" },
  { id: "plugin", name: "MCP 与插件" },
  { id: "knowledge", name: "AI 模板与知识包" },
  { id: "project", name: "AI 项目源码" },
];
export const ARTICLE_KINDS = [
  { id: "tutorial", name: "操作教程" },
  { id: "case", name: "作品复盘" },
  { id: "comparison", name: "方案对比" },
  { id: "method", name: "方法与经验" },
];
export const LINK_KINDS = [
  { id: "website", name: "访问工具" },
  { id: "source", name: "查看来源" },
  { id: "repository", name: "查看仓库" },
  { id: "download", name: "获取资源" },
  { id: "image", name: "查看图片" },
  { id: "video", name: "查看作品" },
  { id: "audio", name: "试听样例" },
];
export const VERIFICATION_LABELS = {
  unverified: "待验证",
  source_checked: "资料核对",
  author_tested: "作者自测",
  editor_tested: "编辑复测",
  review_due: "待复核",
  broken: "确认失效",
  legacy_review: "迁移待复核",
  excluded: "非 AI 内容",
};
export const DEFAULT_INDUSTRIES = [
  "建筑",
  "室内",
  "景观",
  "服装",
  "工业产品",
  "平面品牌",
  "包装",
  "UI / UX",
  "游戏",
  "电商",
  "教育",
  "影视",
  "办公",
  "研究",
];
export function labelOf(list, id) {
  return list.find((item) => item.id === id)?.name || id || "未分类";
}
export function defaultReviewDays(type, kind) {
  return type === "resource"
    ? kind === "tool"
      ? 14
      : 30
    : kind === "method"
      ? 90
      : 30;
}
export function contentPath(type, id) {
  return `/${type === "article" ? "articles" : "resources"}/${encodeURIComponent(id)}`;
}
