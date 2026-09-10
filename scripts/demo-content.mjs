import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Explicit, local-only sample import. Never called by production or normal startup.
if (process.env.NODE_ENV === "production")
  throw new Error("演示内容只允许导入本地预览。");
const pid = (
  await readFile(resolve(".tools/postgres-preview/data/postmaster.pid"), "utf8")
).split(/\r?\n/);
const port = Number(pid[3]);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("请先运行 npm run dev:local。");
process.env.DATABASE_URL = `postgres://postgres@127.0.0.1:${port}/shiqi_preview`;
process.env.DATABASE_SSL = "false";
const { createDatabase } = await import("../server/db.mjs");
const { createCommunityService } =
  await import("../server/community-service.mjs");
const database = createDatabase();
const demo = "【演示】";
const notice =
  "本条为虚构的页面样式演示，名称、流程、核验和成果均为示例，不构成真实推荐；外链为占位入口。";
const hour = 3600000,
  start = Date.now();
let clock = new Date(start);
const service = createCommunityService(database, { now: () => clock });
const platforms = {
  design: "图像平台（演示）",
  video: "视频平台（演示）",
  audio: "语音平台（演示）",
  coding: "代码平台（演示）",
  agent: "自动化平台（演示）",
};
const specs = [
  [
    "architecture",
    "design",
    "workflow",
    "空间草图 · 建筑概念表达工作流",
    "建筑",
    "把建筑草图转为多组 AI 体块与空间氛围方案，比较材料、采光和视角。",
    "SPATIAL STUDY",
  ],
  [
    "storyboard",
    "video",
    "tool",
    "映格 · AI 分镜与镜头预演",
    "影视",
    "从故事大纲生成 AI 分镜、镜头运动说明和短片预演，统一人物与场景。",
    "FRAME / 01",
  ],
  [
    "voice",
    "audio",
    "model",
    "声屿 · 授权声音克隆与多语种配音",
    "教育",
    "用已获授权的声音样本生成多语种 AI 配音，并记录音色和语速参数。",
    "VOICE STUDIO",
  ],
  [
    "fullstack",
    "coding",
    "project",
    "从需求到上线 · AI 全栈应用起步套件",
    "办公",
    "结合编程 Agent 生成全栈应用的页面、接口与测试，建立可复查的开发流程。",
    "BUILD WITH AI",
  ],
  [
    "research",
    "agent",
    "skill",
    "研究搭档 · 深度资料整理 Skill",
    "研究",
    "让 Agent 收集、归纳并交叉核对资料，按主题输出带来源的研究提纲。",
    "RESEARCH AGENT",
  ],
  [
    "fashion",
    "design",
    "model",
    "织构 · AI 服装轮廓与面料风格模型",
    "服装",
    "在固定服装轮廓下探索 AI 面料、配色和图案组合，形成虚拟系列设计。",
    "FASHION FORMS",
  ],
  [
    "character",
    "video",
    "workflow",
    "同一个角色 · 连续镜头一致性流程",
    "影视",
    "使用角色参考图与 AI 视频生成流程，比较不同镜头中的面部和服装一致性。",
    "CHARACTER / CUT",
  ],
  [
    "presenter",
    "audio",
    "tool",
    "镜声 · AI 数字人口播与对口型",
    "电商",
    "把文本、授权形象和 AI 配音组织成数字人口播样片，并检查音画同步。",
    "DIGITAL PRESENTER",
  ],
  [
    "mobile",
    "coding",
    "skill",
    "移动应用搭建 · 编程 Agent 任务包",
    "教育",
    "将移动端需求拆解为界面、状态和数据任务，交给编程 Agent 分步实现。",
    "MOBILE LAB",
  ],
  [
    "knowledge",
    "agent",
    "workflow",
    "团队知识库 · 从资料到问答流程",
    "办公",
    "用 AI 完成文档提取、分段整理和带来源的知识问答，明确知识更新边界。",
    "KNOWLEDGE FLOW",
  ],
  [
    "product",
    "design",
    "knowledge",
    "造物实验室 · AI 产品与包装方案模板",
    "工业产品",
    "用 AI 模板整理工业产品与包装的设计约束，批量探索造型和视觉方向。",
    "OBJECT / FORM",
  ],
  [
    "animation",
    "video",
    "project",
    "纸上剧场 · AI 动画短片项目",
    "游戏",
    "把角色设定、关键帧和 AI 动画镜头组织为可复用的短片制作项目。",
    "MOTION STUDIES",
  ],
  [
    "music",
    "audio",
    "workflow",
    "声景设计 · AI 音乐与环境音效流程",
    "影视",
    "依据场景节奏生成 AI 音乐与环境音效，逐层比较声音对叙事氛围的影响。",
    "SOUND SCAPES",
  ],
  [
    "testing",
    "coding",
    "plugin",
    "测试巡航 · AI 调试与回归插件",
    "游戏",
    "让 AI 辅助定位应用错误、生成复现步骤，并补充有针对性的回归测试。",
    "DEBUG / REPEAT",
  ],
  [
    "connector",
    "agent",
    "plugin",
    "工具桥 · 多工具协作 MCP 连接示例",
    "办公",
    "通过 MCP 为 Agent 提供任务工具，在多步自动化中追踪输入、输出和异常。",
    "CONNECTED TOOLS",
  ],
];
function cover(domain, index, title) {
  const colors = {
    design: ["#ede6d8", "#1b6656", "#91b2a3"],
    video: ["#242444", "#d8c5ff", "#7d70b9"],
    audio: ["#dceff0", "#147b85", "#8abec5"],
    coding: ["#1b2d30", "#b7dd9a", "#438175"],
    agent: ["#f1e7dc", "#b86640", "#dcaa86"],
  };
  const [background, ink, accent] = colors[domain];
  let art = "";
  if (domain === "design" && index === 5)
    art = `<path d="M450 260 530 218 573 277 617 218 704 260 762 389 692 426 662 361 691 635 460 635 484 361 447 426 380 389Z" fill="${ink}"/><path d="M573 277 576 635M480 477H677" stroke="${background}" stroke-width="3"/><path d="M824 255 900 225 950 271 1000 225 1070 255 1120 367 1060 390 1040 360 1080 625H820L858 360 838 390 779 367Z" fill="${accent}"/>`;
  else if (domain === "design")
    art = `<path d="M335 487 655 315 1030 452 710 650Z" fill="${accent}" opacity=".55"/><path d="M418 453V288L619 178 827 255V455L624 564Z" fill="${ink}"/><path d="M619 178V397L827 455M418 288 619 397 827 255" fill="none" stroke="${background}" stroke-width="3"/><path d="M494 432V327L571 366V475Z" fill="${accent}"/><path d="M678 423V307L765 273V469Z" fill="${background}" opacity=".9"/><path d="M892 477V321L1020 369V531Z" fill="${ink}" opacity=".55"/>`;
  else if (domain === "video")
    art = [0, 1, 2]
      .map(
        (i) =>
          `<g transform="translate(${210 + i * 284},${220 + (i === 1 ? 42 : 0)})"><rect width="270" height="300" rx="12" fill="${accent}" opacity="${0.35 + i * 0.18}"/><circle cx="179" cy="85" r="34" fill="${ink}"/><path d="M0 255 94 121 161 209 220 151 270 221V300H0Z" fill="${background}" opacity=".65"/><path d="M110 113 110 177 159 145Z" fill="${ink}"/><text x="22" y="277" fill="${ink}" font-size="14">SCENE 0${i + 1} / AI PREVIEW</text></g>`,
      )
      .join("");
  else if (domain === "audio")
    art =
      `<circle cx="674" cy="389" r="207" fill="none" stroke="${accent}" stroke-width="2"/><circle cx="674" cy="389" r="156" fill="none" stroke="${accent}" stroke-width="2"/>` +
      Array.from({ length: 45 }, (_, i) => {
        const h =
          30 + Math.abs(Math.sin(i * 0.61 + index) * Math.cos(i * 0.19)) * 205;
        return `<rect x="${205 + i * 19}" y="${389 - h / 2}" width="7" height="${h}" rx="3.5" fill="${ink}" opacity="${0.5 + (i % 4) * 0.14}"/>`;
      }).join("");
  else if (domain === "coding")
    art =
      `<rect x="250" y="184" width="785" height="420" rx="22" fill="#122224" stroke="${accent}"/><path d="M250 244H1035M580 244V604" stroke="${accent}" opacity=".6"/><circle cx="283" cy="215" r="7" fill="#dc9279"/><circle cx="307" cy="215" r="7" fill="#deca8e"/><circle cx="331" cy="215" r="7" fill="${ink}"/>` +
      Array.from(
        { length: 8 },
        (_, i) =>
          `<rect x="${287 + (i % 3) * 18}" y="${284 + i * 32}" width="${130 + (i % 4) * 27}" height="8" rx="4" fill="${i % 3 === 0 ? ink : accent}" opacity=".8"/>`,
      ).join("") +
      `<rect x="622" y="280" width="372" height="135" rx="12" fill="${accent}"/><rect x="646" y="309" width="148" height="14" rx="5" fill="${ink}"/><rect x="646" y="341" width="285" height="8" rx="4" fill="#d8e5dc"/><rect x="622" y="439" width="175" height="121" rx="12" fill="${ink}"/><rect x="817" y="439" width="177" height="121" rx="12" fill="${accent}"/>`;
  else
    art =
      `<path d="M350 297 630 403 924 244M630 403 950 550M630 403 321 587" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="9 9"/>` +
      [
        [350, 297, "INPUT"],
        [630, 403, "AGENT"],
        [924, 244, "TOOLS"],
        [950, 550, "OUTPUT"],
        [321, 587, "KNOWLEDGE"],
      ]
        .map(
          ([x, y, label], i) =>
            `<g><rect x="${x - 88}" y="${y - 55}" width="176" height="110" rx="24" fill="${i === 1 ? ink : "#fffaf4"}" stroke="${accent}"/><circle cx="${x}" cy="${y - 14}" r="12" fill="${i === 1 ? background : accent}"/><text x="${x}" y="${y + 28}" text-anchor="middle" fill="${i === 1 ? background : ink}" font-size="15">${label}</text></g>`,
        )
        .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800"><rect width="1280" height="800" fill="${background}"/><g fill="none" stroke="${accent}" opacity=".15">${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 100} 0V800"/>`).join("")}${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${i * 100}H1280"/>`).join("")}</g><g font-family="Arial,sans-serif"><text x="68" y="94" fill="${ink}" font-size="20" letter-spacing="4">SHIQI / ${domain.toUpperCase()}</text><text x="1180" y="94" text-anchor="end" fill="${ink}" font-size="17">DEMO · ${String(index + 1).padStart(2, "0")}</text>${art}<text x="68" y="726" fill="${ink}" font-size="34" letter-spacing="4">${title}</text><text x="1180" y="728" text-anchor="end" fill="${ink}" font-size="14">FICTIONAL UI SAMPLE</text></g></svg>`;
}
const { chromium } = await import("@playwright/test");
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" ? { channel: "msedge" } : {}),
});
const artwork = await browser.newPage({
  viewport: { width: 1280, height: 800 },
});
const resources = [],
  articles = [];
const report = { resources: 0, articles: 0, topics: 0, existing: 0 };
try {
  const admin = (
    await database.query(
      "SELECT * FROM users WHERE role='admin' AND status='active' ORDER BY created_at LIMIT 1",
    )
  ).rows[0];
  if (!admin) throw new Error("请先初始化本地管理员。");
  await mkdir(resolve("uploads"), { recursive: true });
  for (const [index, spec] of specs.entries()) {
    const [key, domain, kind, title, industry, aiUse, english] = spec;
    const name = demo + title,
      path = `/uploads/demo-${key}.png`,
      image = path;
    await artwork.setContent(
      "<style>body{margin:0}</style>" + cover(domain, index, english),
    );
    await artwork
      .locator("svg")
      .screenshot({ path: resolve("uploads", "demo-" + key + ".png") });
    const existing = (
      await database.query("SELECT * FROM resources WHERE name=$1", [name])
    ).rows[0];
    if (existing) {
      resources.push(existing.deleted_at ? null : existing.id);
      report.existing++;
      continue;
    }
    clock = new Date(start - (48 - index) * hour);
    const input = {
      name,
      domain,
      kind,
      aiUse,
      description:
        notice +
        "\n\n" +
        aiUse +
        "本示例展示输入约束、任务拆解、结果对比和下一步实践建议的排版，可根据实际资源替换文字与封面。",
      industries: [industry],
      platforms: [platforms[domain]],
      tags: ["样式演示"],
      website: "https://example.com/#shiqi-demo-" + key,
      coverImage: image,
      details: {
        version: "Demo 1.0（虚构版本）",
        requirements:
          "演示环境：一份任务描述和已授权的输入素材；实际依赖待正式投稿时补充。",
        cost: "演示字段：费用与额度以正式资源说明为准。",
        inputs: "输入任务目标、参考素材和期望的输出格式。",
        output: "虚构成果：一组用于展示详情排版的概念结果。",
        limitations: notice,
        rights: ["audio", "video", "design"].includes(domain)
          ? "演示内容不含真实人物声音或形象，也未调用任何声音克隆服务。"
          : "",
      },
      links: [
        {
          kind:
            domain === "audio"
              ? "audio"
              : domain === "video"
                ? "video"
                : kind === "project"
                  ? "repository"
                  : "source",
          label: "查看演示入口（占位）",
          url: "https://example.com/#sample-" + key,
        },
      ],
    };
    let result = await service.save("resource", input, admin);
    resources.push(result.item.id);
    report.resources++;
    if (index === 0 || index === 6) {
      clock = new Date(start - (12 - index) * hour);
      result = await service.save(
        "resource",
        {
          revision: 1,
          details: {
            version: "Demo 1.1（虚构版本）",
            updateNote: "【演示更新】补充参数对比和成果检查步骤。",
          },
        },
        admin,
        result.item.id,
      );
    }
    if (index < 11) {
      clock = new Date(start - (11 - index) * hour);
      const method =
        index < 6
          ? kind === "tool"
            ? "source_checked"
            : "editor_tested"
          : index % 2
            ? "author_tested"
            : "source_checked";
      await service.verify(
        { type: "resource", id: result.item.id },
        {
          revision: result.item.revision,
          method,
          environment: "虚构演示环境，用于核验信息区域的样式预览。",
          evidence:
            "【演示核验】这是一条虚构记录，没有进行实际测试；用于展示不同核验状态、环境与时间的排版。",
        },
        admin,
      );
      if (index < 6)
        await service.moderate(
          { type: "resource", id: result.item.id },
          {
            revision: result.item.revision,
            action: "feature",
            reason: "【演示精选】仅用于首页精选模块的前端预览。",
          },
          admin,
        );
    }
    if (index === 14)
      await service.moderate(
        { type: "resource", id: result.item.id },
        {
          revision: result.item.revision,
          action: "review",
          reason: "【演示复核】展示到期复核队列与作者提醒的样式。",
        },
        admin,
      );
  }
  const articleSpecs = [
    [
      "从建筑草图到三种空间氛围方案",
      "design",
      "tutorial",
      0,
      "建筑",
      "明确空间尺度、相机视角与材料范围，再逐组比较 AI 生成的方案。",
    ],
    [
      "一件外套的 AI 系列设计复盘",
      "design",
      "case",
      5,
      "服装",
      "固定廓形后改变面料、配色和细节，整理虚拟服装系列的设计过程。",
    ],
    [
      "让 AI 短片里的主角保持一致",
      "video",
      "tutorial",
      6,
      "影视",
      "准备统一的角色参考，再比较不同景别与运动镜头中的角色表现。",
    ],
    [
      "AI 声音克隆到多语种配音的完整实践",
      "audio",
      "tutorial",
      2,
      "教育",
      "从已授权样本出发，组织音色、文本和语言信息，展示配音工作流。",
    ],
    [
      "用编程 Agent 完成一个全栈应用",
      "coding",
      "case",
      3,
      "办公",
      "将需求拆分为页面、接口与测试任务，逐步复查 AI 编程产物。",
    ],
    [
      "资料检索 Agent 与知识库如何搭配",
      "agent",
      "comparison",
      4,
      "研究",
      "比较临时研究与持续知识维护的边界，选择合适的资料组织方式。",
    ],
    [
      "AI 数字人口播的音画协同",
      "audio",
      "tutorial",
      7,
      "电商",
      "将授权形象、配音节奏和字幕对齐，检查口播样片的可读性。",
    ],
    [
      "把一次 AI 实践整理成可复用方案",
      "agent",
      "method",
      9,
      "教育",
      "记录任务目标、输入条件、验证过程与使用限制，形成可复用经验。",
    ],
  ];
  for (const [
    index,
    [title, domain, kind, resourceIndex, industry, goal],
  ] of articleSpecs.entries()) {
    const name = demo + title;
    const existing = (
      await database.query("SELECT * FROM articles WHERE title=$1", [name])
    ).rows[0];
    if (existing) {
      articles.push(existing.deleted_at ? null : existing.id);
      report.existing++;
      continue;
    }
    clock = new Date(start - (26 - index) * hour);
    const image = "/uploads/demo-" + specs[resourceIndex][0] + ".png";
    const body = [
      { type: "blockquote", content: [{ text: notice }] },
      { type: "h2", content: [{ text: "01 / 定义目标与准备输入" }] },
      {
        type: "p",
        content: [
          {
            text:
              goal +
              "先用清晰的文字描述期望结果，把输入格式、参考素材、约束条件和判断标准放在同一份记录中。本段是虚构教学文案，方便检查长文的字距、行距与段落层次。",
          },
        ],
      },
      {
        type: "ul",
        items: [
          [{ text: "整理参考素材及来源，写下允许使用的范围。" }],
          [{ text: "把任务分为可观察的步骤，记录每一步的输入输出。" }],
          [{ text: "保留不同方案的对比和失败说明。" }],
        ],
      },
      { type: "image", src: image, alt: "演示成果插图，仅供页面样式预览" },
      { type: "h2", content: [{ text: "02 / 组织 AI 流程" }] },
      {
        type: "p",
        content: [
          {
            text: "在正式实践中，应核对工具来源、当前版本和使用条件。这里用简化的参数片段展示代码块样式，演示条目没有可以直接运行的模型或工作流。",
          },
        ],
      },
      {
        type: "code",
        language: "json",
        text: JSON.stringify(
          {
            mode: "fictional-demo",
            task: specs[resourceIndex][0],
            input: "authorized-reference",
            output: "preview-only",
          },
          null,
          2,
        ),
      },
      { type: "h2", content: [{ text: "03 / 比较结果与记录限制" }] },
      {
        type: "p",
        content: [
          {
            text: "从一致性、可控性和修改成本等维度组织观察结果。记录哪些条件需要再次确认，哪些步骤依赖具体平台。演示图片与文字不代表实际效果，正式教程应替换为真实过程和可验证的成果。",
          },
        ],
      },
    ];
    let result = await service.save(
      "article",
      {
        title: name,
        domain,
        kind,
        aiUse: goal,
        excerpt:
          "虚构的 AI 实践案例，用于检查教程卡片、正文、代码块及关联资源样式。",
        body,
        cover: image,
        industries: [industry],
        platforms: [platforms[domain]],
        tags: ["样式演示"],
        resourceIds: resources[resourceIndex] ? [resources[resourceIndex]] : [],
        details: {
          origin: "original",
          version: "Demo 1.0",
          requirements: "虚构演示流程，实际环境待正式实践补充。",
          cost: "演示费用说明，不代表任何平台报价。",
          output: "示例结构、概念插图与参数排版。",
          limitations: notice,
        },
      },
      admin,
    );
    articles.push(result.item.id);
    report.articles++;
    if (index === 0) {
      clock = new Date(start - 2 * hour);
      result = await service.save(
        "article",
        {
          revision: 1,
          body: [
            ...body,
            {
              type: "p",
              content: [
                {
                  text: "【演示更新】新增结果检查清单，用于预览实质更新时间与修订历史。",
                },
              ],
            },
          ],
          details: { updateNote: "【演示更新】补充成果检查清单。" },
        },
        admin,
        result.item.id,
      );
    }
    if (index < 5)
      await service.verify(
        { type: "article", id: result.item.id },
        {
          revision: result.item.revision,
          method: index % 2 ? "author_tested" : "editor_tested",
          environment: "虚构的教程演示环境，未进行真实复现。",
          evidence:
            "【演示核验】仅用于预览教程状态和历史记录；所有步骤与结果均为虚构示例。",
        },
        admin,
      );
  }
  const topicSpecs = [
    [
      "architecture",
      "AI 建筑与室内方案表达",
      "从草图、空间氛围到方案讲述，串联建筑设计的 AI 实践路径。",
      [0, 10],
      [0],
    ],
    [
      "fashion",
      "AI 服装设计与虚拟系列",
      "从轮廓到面料、配色与系列表达，组织服装设计的 AI 灵感。",
      [5, 0],
      [1],
    ],
    [
      "agent-development",
      "编程 Agent 完成应用开发",
      "从需求拆解到页面、接口和回归测试，走完整个应用开发流程。",
      [3, 8, 13],
      [4],
    ],
    [
      "video",
      "AI 视频角色一致性与镜头控制",
      "把角色参考、分镜与连续镜头连接起来，构建短片制作路径。",
      [1, 6, 11],
      [2],
    ],
    [
      "voice",
      "授权声音克隆与多语种配音",
      "理解授权范围、配音流程与音画协同，组织声音创作任务。",
      [2, 7, 12],
      [3, 6],
    ],
    [
      "knowledge",
      "Agent 与团队知识共建",
      "从资料整理、研究协作到知识库维护，设计可持续更新的流程。",
      [4, 9],
      [5, 7],
    ],
  ];
  for (const [key, title, description, rs, as] of topicSpecs) {
    const slug = "demo-" + key;
    if (
      (await database.query("SELECT id FROM topics WHERE slug=$1", [slug])).rows
        .length
    ) {
      report.existing++;
      continue;
    }
    clock = new Date(start - hour);
    await service.saveTopic(
      {
        slug,
        title: demo + title,
        description: description + " " + notice,
        status: "online",
        items: [
          ...rs
            .filter((i) => resources[i])
            .map((i) => ({ type: "resource", id: resources[i] })),
          ...as
            .filter((i) => articles[i])
            .map((i) => ({ type: "article", id: articles[i] })),
        ],
      },
      admin,
    );
    report.topics++;
  }
  for (const [index, id] of resources.slice(0, 4).entries()) {
    if (!id) continue;
    const ref = { type: "resource", id };
    await database.query(
      "INSERT INTO favorites(user_id,target_type,target_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [admin.id, "resource", id],
    );
    const text =
      "【演示讨论】" +
      [
        "这套输入说明很清晰，期待补充不同光照条件的对比。",
        "分镜之间的衔接可以增加一个结果对比区。",
        "建议在声音样本旁边展示授权说明。",
        "任务拆解与测试记录适合放在同一份实践文档中。",
      ][index];
    if (
      !(
        await database.query(
          "SELECT id FROM comments WHERE resource_id=$1 AND content=$2",
          [id, text],
        )
      ).rows.length
    )
      await service.comment(ref, { content: text }, admin);
    if (index < 3) {
      const row = await service.raw("resource", id);
      await service.feedback(
        ref,
        {
          revision: row.revision,
          outcome: ["success", "partial", "failed"][index],
          environment: "【演示环境】虚构的复现反馈，仅用于界面预览。",
          content: "虚构结果，用于展示当前版本的反馈统计及后台问题列表。",
        },
        admin,
      );
    }
  }
  for (const [index, id] of articles.slice(0, 2).entries())
    if (id) {
      const text =
        "【演示讨论】教程的章节、配图和代码示例很适合用于检查长文布局。";
      if (
        !(
          await database.query(
            "SELECT id FROM comments WHERE article_id=$1 AND content=$2",
            [id, text],
          )
        ).rows.length
      )
        await service.comment(
          { type: "article", id },
          { content: text },
          admin,
        );
      await database.query(
        "INSERT INTO favorites(user_id,target_type,target_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [admin.id, "article", id],
      );
    }
  for (const name of Object.values(platforms))
    await database.query(
      "INSERT INTO catalog_tags(category,name) VALUES('platform',$1) ON CONFLICT DO NOTHING",
      [name],
    );
  await database.query(
    "INSERT INTO catalog_tags(category,name) VALUES('task','样式演示') ON CONFLICT DO NOTHING",
  );
  console.log(
    JSON.stringify(
      {
        ...report,
        message:
          "演示内容已导入，可在后台搜索“演示”逐条删除；正常启动不会重新生成。",
      },
      null,
      2,
    ),
  );
} finally {
  await artwork.close();
  await browser.close();
  await database.close();
}
