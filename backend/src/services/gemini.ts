import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import type { GenerateDeckInput, InterviewDeck } from "../types/deck.js";

const GeneratedCardSchema = z.object({
  category: z.enum(["role_general", "company_focused", "role_deep_dive"]).optional(),
  questionZh: z.string().min(4),
  meaningEn: z.string().min(5),
  keywords: z
    .array(
      z.object({
        zh: z.string().min(1),
        en: z.string().min(1)
      })
    )
    .min(1),
  technicalTerms: z
    .array(
      z.object({
        zh: z.string().min(1),
        en: z.string().min(1)
      })
    )
    .optional(),
  answerPlanEn: z.array(z.string().min(5)).min(3).max(5).optional(),
  answerPlanZh: z.array(z.string().min(5)).min(3).max(5).optional(),
  answerFrameworkZh: z.string().min(8)
});

const GeneratedDeckSchema = z.object({
  title: z.string().min(2),
  jobDescriptionTerms: z
    .array(
      z.object({
        zh: z.string().min(1),
        en: z.string().min(1)
      })
    )
    .optional(),
  resumeTerms: z
    .array(
      z.object({
        zh: z.string().min(1),
        en: z.string().min(1)
      })
    )
    .optional(),
  cards: z.array(GeneratedCardSchema).min(15)
});

const ai = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export type GenerationSource = "gemini" | "fallback";

const getPrompt = (input: GenerateDeckInput) => `
You are helping a bilingual candidate prepare for Mandarin interviews.
Return STRICT JSON only. Do not include markdown or explanation.

Output shape:
{
  "title": "string",
  "jobDescriptionTerms": [{"zh":"...", "en":"..."}],
  "resumeTerms": [{"zh":"...", "en":"..."}],
  "cards": [
    {
        "category": "role_general | company_focused | role_deep_dive",
        "questionZh": "Chinese interview question",
        "meaningEn": "English meaning",
        "keywords": [{"zh":"...", "en":"..."}],
        "technicalTerms": [{"zh":"...", "en":"..."}],
        "answerPlanEn": ["point form, how to answer in English"],
        "answerPlanZh": ["mapped point form in Chinese with keywords"],
        "answerFrameworkZh": "short, speakable Chinese structure guide"
    }
  ]
}

Constraints:
- Return exactly 20 cards.
- Category mix MUST be:
  - role_general: 3 cards (general for this role)
  - company_focused: 3 cards (specific to this company context and team expectations)
  - role_deep_dive: 14 cards (deep role-specific questions from job description)
- Prioritize likely interview relevance.
- Mix general + role-specific + small number of behavioral questions.
- Avoid obvious duplicates.
- Mandarin should be realistic and concise.
- questionZh must be short and speakable: one sentence, ideally <= 16 Chinese characters.
- Do not use long multi-part prompts in one question.
- keywords are for answering this interview question (4-5 items), including behavioral and communication language.
- technicalTerms are a separate bank for role/domain jargon only (5-8 items), and should not duplicate keywords.
- If English and Chinese are effectively the same term (e.g. API, SQL, KPI, OKR), do not include it as a vocab item.
- If needed, briefly mention that such terms are commonly used in English in meaningEn.
- answerPlanEn should be 3-5 short bullet-like points showing how to structure a response using keywords.
- answerPlanZh should be a practical Chinese sample answer (3-5 short lines, first-person, speakable),
  not a direct translation of answerPlanEn.
- answerPlanZh should demonstrate how to naturally use the Chinese keywords in context.
- jobDescriptionTerms: 12-20 domain terms extracted from JD and translated for quick concept deep dive.
- resumeTerms: 8-16 terms extracted from candidate resume and translated (if resume exists, otherwise return []).
- Use the resume aggressively when relevant:
  - If resume includes a matching project/achievement, anchor answerPlan to that experience.
  - Prefer concrete experience-backed phrasing over generic advice.
- For role_deep_dive cards, each question should map to a concrete responsibility/skill in the JD.
- answerFrameworkZh must be a framework, not full script.

Input:
Company: ${input.companyName}
Role: ${input.roleTitle}
Job Description:
${input.jobDescription}

Resume (optional):
${input.resume ?? "N/A"}
`;

const shuffleArray = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickRandomTerms = (
  pool: Array<{ zh: string; en: string }>,
  count: number
): Array<{ zh: string; en: string }> => shuffleArray(pool).slice(0, count);

const buildFallbackDeck = (input: GenerateDeckInput): InterviewDeck => {
  const cards = Array.from({ length: 15 }).map((_, index) => ({
    id: randomUUID(),
    order: index + 1,
    questionZh:
      index % 4 === 0
        ? "请用中文做简短自我介绍。"
        : "你如何解决过关键挑战？",
    meaningEn:
      index % 4 === 0
        ? "Please introduce yourself in Chinese and explain why you fit this role."
        : "How did you solve a key challenge in a past project? Describe context, action, and result.",
    keywords: [
      { zh: "岗位匹配", en: "role fit" },
      { zh: "项目经验", en: "project experience" },
      { zh: "沟通能力", en: "communication" },
      { zh: "结果导向", en: "outcome driven" }
    ],
    technicalTerms: pickRandomTerms(
      [
        { zh: "需求分析", en: "requirements analysis" },
        { zh: "系统设计", en: "system design" },
        { zh: "性能优化", en: "performance optimization" },
        { zh: "异常处理", en: "exception handling" },
        { zh: "上线部署", en: "deployment" },
        { zh: "监控告警", en: "monitoring and alerting" },
        { zh: "数据建模", en: "data modeling" },
        { zh: "灰度发布", en: "canary release" },
        { zh: "日志分析", en: "log analysis" },
        { zh: "根因分析", en: "root cause analysis" }
      ],
      5
    ),
    answerPlanEn: [
      "Open with a one-line context and your role.",
      "Use 2-3 keywords to explain your action clearly.",
      "Close with measurable results and role fit."
    ],
    answerPlanZh: [
      "先用一句话交代背景和你的职责。",
      "用2到3个关键词说明你的具体做法。",
      "最后补充量化结果并连接岗位匹配。"
    ],
    answerFrameworkZh:
      "先说明背景与目标，再讲你的具体做法，最后用可量化结果收尾，并连接到当前岗位需求。",
    status: "unseen" as const
  }));

  return {
    id: randomUUID(),
    title: `${input.companyName} ${input.roleTitle} 面试准备`,
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    cardCount: cards.length,
    jobDescriptionTerms: [
      { zh: "产品路线图", en: "product roadmap" },
      { zh: "用户分层", en: "user segmentation" },
      { zh: "转化漏斗", en: "conversion funnel" },
      { zh: "指标拆解", en: "metric decomposition" },
      { zh: "跨团队协作", en: "cross-functional collaboration" }
    ],
    resumeTerms: input.resume
      ? [
          { zh: "增长实验", en: "growth experiment" },
          { zh: "A/B测试", en: "A/B testing" },
          { zh: "需求优先级", en: "feature prioritization" },
          { zh: "项目复盘", en: "project retrospective" }
        ]
      : [],
    cards,
    createdAt: new Date().toISOString()
  };
};

const defaultCoreKeywords = [
  { zh: "岗位匹配", en: "role fit" },
  { zh: "项目经验", en: "project experience" },
  { zh: "沟通协作", en: "collaboration" },
  { zh: "结果导向", en: "results driven" },
  { zh: "问题解决", en: "problem solving" }
];

const defaultTechnicalTerms = [
  { zh: "需求分析", en: "requirements analysis" },
  { zh: "系统设计", en: "system design" },
  { zh: "性能优化", en: "performance tuning" },
  { zh: "异常处理", en: "error handling" },
  { zh: "接口集成", en: "API integration" },
  { zh: "数据建模", en: "data modeling" },
  { zh: "监控告警", en: "monitoring and alerting" },
  { zh: "容量规划", en: "capacity planning" },
  { zh: "日志分析", en: "log analysis" },
  { zh: "灰度发布", en: "canary release" },
  { zh: "根因分析", en: "root cause analysis" },
  { zh: "自动化测试", en: "automated testing" }
];

const normalizeCompare = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s\-_./\\(){}[\],;:!?'"`~@#$%^&*+=|<>]/g, "");

const termKey = (item: { zh: string; en: string }) =>
  `${normalizeCompare(item.zh)}::${normalizeCompare(item.en)}`;

const isUniversalEnglishTerm = (item: { zh: string; en: string }) =>
  normalizeCompare(item.zh) === normalizeCompare(item.en);

const normalizeTerms = (
  source: Array<{ zh: string; en: string }>,
  fallback: Array<{ zh: string; en: string }>,
  min: number,
  max: number,
  excludedKeys: Set<string> = new Set()
) => {
  const cleaned = source
    .map((item) => ({ zh: item.zh.trim(), en: item.en.trim() }))
    .filter(
      (item) =>
        item.zh.length > 0 &&
        item.en.length > 0 &&
        !isUniversalEnglishTerm(item) &&
        !excludedKeys.has(termKey(item))
    );

  const merged: Array<{ zh: string; en: string }> = [];
  const seen = new Set<string>();

  for (const item of cleaned) {
    const key = termKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }

  // Randomized fallback prevents the same default term from always appearing first.
  for (const item of shuffleArray(fallback)) {
    if (merged.length >= min) {
      break;
    }
    const key = termKey(item);
    if (isUniversalEnglishTerm(item) || excludedKeys.has(key) || seen.has(key)) {
      continue;
    }
    if (!merged.some((entry) => entry.zh === item.zh)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.slice(0, max);
};

const shortenQuestion = (questionZh: string) => {
  const trimmed = questionZh.trim();
  if (trimmed.length <= 18) {
    return trimmed;
  }

  const firstClause = trimmed.split(/[，。？！；,!?;]/)[0]?.trim();
  if (firstClause && firstClause.length >= 5) {
    return firstClause.endsWith("？") ? firstClause : `${firstClause}？`;
  }

  const sliced = trimmed.slice(0, 16).trim();
  return sliced.endsWith("？") ? sliced : `${sliced}？`;
};

type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

const pickCardsByQuota = (cards: GeneratedCard[]) => {
  const quotas: Record<"role_general" | "company_focused" | "role_deep_dive", number> = {
    role_general: 3,
    company_focused: 3,
    role_deep_dive: 14
  };
  const buckets: Record<"role_general" | "company_focused" | "role_deep_dive", GeneratedCard[]> =
    {
      role_general: [],
      company_focused: [],
      role_deep_dive: []
    };

  cards.forEach((card) => {
    const category = card.category ?? "role_deep_dive";
    buckets[category].push(card);
  });

  const selected: GeneratedCard[] = [];
  const selectedIds = new Set<GeneratedCard>();

  (Object.keys(quotas) as Array<keyof typeof quotas>).forEach((category) => {
    const picked = buckets[category].slice(0, quotas[category]);
    picked.forEach((card) => {
      selected.push(card);
      selectedIds.add(card);
    });
  });

  // Fill remaining slots by deep-dive first, then any leftovers.
  const fillPool = [
    ...buckets.role_deep_dive,
    ...buckets.company_focused,
    ...buckets.role_general
  ].filter((card) => !selectedIds.has(card));

  for (const card of fillPool) {
    if (selected.length >= 20) {
      break;
    }
    selected.push(card);
  }

  return selected.slice(0, 20);
};

const buildDefaultAnswerPlanEn = (keywords: Array<{ zh: string; en: string }>) => [
  `Start with one-line context and objective (${keywords[0]?.en ?? "context"}).`,
  `Explain your action with 2-3 keywords (${keywords
    .slice(1, 3)
    .map((item) => item.en)
    .join(", ") || "execution"}).`,
  "End with measurable outcome and role relevance."
];

const buildDefaultAnswerPlanZh = (keywords: Array<{ zh: string; en: string }>) => [
  `我先说背景：当时目标是提升${keywords[0]?.zh ?? "关键指标"}。`,
  `我主要做了两件事：第一，优化${keywords[1]?.zh ?? "执行流程"}；第二，强化${keywords[2]?.zh ?? "协作沟通"}。`,
  `结果是指标有明显改善，也让我更确认自己和这个岗位很匹配。`
];

export const generateDeckWithGemini = async (
  input: GenerateDeckInput,
  requestId: string
): Promise<{ deck: InterviewDeck; source: GenerationSource }> => {
  if (!ai) {
    console.warn("[gemini] API key missing, using fallback deck", { requestId });
    return { deck: buildFallbackDeck(input), source: "fallback" };
  }

  const startedAt = Date.now();
  console.info("[gemini] generation started", {
    requestId,
    model: env.GEMINI_MODEL,
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    jobDescriptionLength: input.jobDescription.length,
    resumeLength: input.resume?.length ?? 0
  });

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: getPrompt(input),
      config: {
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    const parsed = GeneratedDeckSchema.parse(JSON.parse(response.text ?? "{}"));
    const deckId = randomUUID();
    const prioritizedCards = pickCardsByQuota(parsed.cards);

    const deck: InterviewDeck = {
      id: deckId,
      title: parsed.title,
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      cardCount: prioritizedCards.length,
      jobDescriptionTerms: normalizeTerms(
        parsed.jobDescriptionTerms ?? [],
        defaultTechnicalTerms,
        12,
        20
      ),
      resumeTerms: input.resume?.trim()
        ? normalizeTerms(parsed.resumeTerms ?? [], defaultTechnicalTerms, 8, 16)
        : [],
      createdAt: new Date().toISOString(),
      cards: prioritizedCards.map((card, idx) => {
        const keywords = normalizeTerms(card.keywords, defaultCoreKeywords, 4, 5);
        const keywordKeys = new Set(keywords.map((item) => termKey(item)));
        const technicalTerms = normalizeTerms(
          card.technicalTerms ?? [],
          defaultTechnicalTerms,
          5,
          8,
          keywordKeys
        );

        return {
          id: randomUUID(),
          order: idx + 1,
          questionZh: shortenQuestion(card.questionZh),
          meaningEn: card.meaningEn,
          keywords,
          technicalTerms,
          answerPlanEn: card.answerPlanEn?.slice(0, 5) ?? buildDefaultAnswerPlanEn(keywords),
          answerPlanZh: card.answerPlanZh?.slice(0, 5) ?? buildDefaultAnswerPlanZh(keywords),
          answerFrameworkZh: card.answerFrameworkZh,
          status: "unseen"
        };
      })
    };

    console.info("[gemini] generation succeeded", {
      requestId,
      elapsedMs: Date.now() - startedAt,
      cardCount: deck.cardCount,
      title: deck.title,
      categoryMix: {
        role_general: prioritizedCards.filter((card) => card.category === "role_general").length,
        company_focused: prioritizedCards.filter((card) => card.category === "company_focused")
          .length,
        role_deep_dive: prioritizedCards.filter(
          (card) => (card.category ?? "role_deep_dive") === "role_deep_dive"
        ).length
      }
    });

    return { deck, source: "gemini" };
  } catch (error) {
    console.error("[gemini] generation failed", {
      requestId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};
