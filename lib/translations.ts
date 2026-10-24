/**
 * Trilingual strings (Req 11). EN / 简体中文 / Español.
 *
 * Every Branch_Bank promptKey and choice labelKey has an entry in all three
 * dictionaries (enforced by a property test, Req 11.2). The generated appeal
 * draft stays English (Req 6.1); only UI chrome and question text translate.
 */

export type Lang = "en" | "zh" | "es";

export const LANGS: Lang[] = ["en", "zh", "es"];

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  zh: "简体中文",
  es: "Español",
};

/** BCP-47 tags used for speech synthesis/recognition. */
export const SPEECH_LANG: Record<Lang, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
};

export type Dict = Record<string, string>;

const en: Dict = {
  // App chrome
  "app.name": "AppealFlow",
  "app.tagline": "Every ticket has a story. Every voice deserves to be heard.",
  "app.independence":
    "Independent demo — not a City of Boston service, not legal advice. AppealFlow never files or decides an appeal.",
  "nav.resident": "Resident",
  "nav.reviewer": "Reviewer (Demo)",
  "nav.home": "Home",
  "lang.label": "Language",

  // Landing
  "landing.resident.title": "I got a parking ticket",
  "landing.resident.desc":
    "Answer a few simple questions and get a clear, honest appeal letter you can review and edit.",
  "landing.reviewer.title": "Reviewer demo",
  "landing.reviewer.desc":
    "See how a clerk or hearing officer could review the claims, evidence, and open questions.",
  "landing.start": "Start",

  // Resident wizard
  "resident.pickCase": "Start from a demo case",
  "resident.pickCase.desc":
    "These are clearly fictional examples that are safe to use in a public demo.",
  "resident.manual": "Or describe a fictional ticket",
  "resident.manual.placeholder":
    "Briefly describe the situation (do not include real names, plate, or ticket numbers).",
  "resident.manual.start": "Start a blank case",
  "resident.noPii":
    "Please do not enter real personal information such as a name, license plate, ticket number, or barcode.",
  "resident.pickScenario": "What best describes your situation?",
  "resident.scenario.payment": "I think I paid or had a valid permit",
  "resident.scenario.breakdown": "My vehicle broke down or was towed",
  "resident.scenario.unclear_sign": "The sign or marking was unclear or damaged",
  "resident.scenario.permit": "Residential parking permit confusion",
  "resident.scenario.street_cleaning":
    "Street cleaning or temporary restriction",
  "resident.scenario.incorrect_ticket":
    "Wrong vehicle, plate, time, or location on the ticket",
  "resident.scenario.extraordinary_circumstances":
    "Accessibility or extraordinary circumstances",
  "resident.scenario.other": "Something else",
  "resident.answer": "Answer",
  "resident.next": "Next",
  "resident.back": "Back",
  "resident.skip": "Skip",
  "resident.reviewFacts": "Review your statements",
  "resident.reviewFacts.desc":
    "These are your claims in your own words. Edit or remove anything that is not accurate. They stay labeled as claims until verified.",
  "resident.addEvidence": "Add supporting evidence",
  "resident.evidence.kind": "Type",
  "resident.evidence.label": "Label",
  "resident.evidence.notes": "Notes (optional)",
  "resident.evidence.status": "Status",
  "resident.evidence.add": "Add evidence",
  "resident.generate": "Generate appeal draft",
  "resident.draft": "Your appeal letter (editable)",
  "resident.copy": "Copy",
  "resident.copied": "Copied",
  "resident.download": "Download .txt",
  "resident.submitNote":
    "When you are ready, submit this separately at the official City of Boston parking ticket appeal portal. AppealFlow does not submit it for you.",
  "resident.clarification.title": "The reviewer asked a question",
  "resident.clarification.respond": "Your response",
  "resident.clarification.send": "Send response",
  "resident.markReady": "Mark as ready",

  // Fact/evidence meta
  "meta.source": "Source",
  "meta.verification": "Verification",
  "source.resident_answer": "Your answer",
  "source.resident_edit": "Edited by you",
  "source.demo_seed": "Demo seed",
  "verification.claimed": "Claimed",
  "verification.simulated": "Simulated",
  "verification.unverified": "Unverified",
  "evidenceStatus.uploaded": "Uploaded",
  "evidenceStatus.simulated": "Simulated",
  "evidenceStatus.missing": "Missing",

  // Reviewer
  "reviewer.title": "Case review (simulated)",
  "reviewer.notCity":
    "This reviewer view is a simulation for demonstration. It is not a City of Boston system or account.",
  "reviewer.selectCase": "Select a case",
  "reviewer.noCase":
    "No case yet. Open the Resident view and start a case first.",
  "reviewer.claims": "Resident's claims",
  "reviewer.evidence": "Evidence (reported separately from claims)",
  "reviewer.missing": "Missing information",
  "reviewer.sources": "Cited sources",
  "reviewer.hardship": "Disclosed circumstances (context only, not a score)",
  "reviewer.original": "Original-language note",
  "reviewer.uncertain": "What remains uncertain",
  "reviewer.requestClarification": "Request clarification",
  "reviewer.clarification.placeholder": "Ask one clarifying question…",
  "reviewer.clarification.send": "Send request",
  "reviewer.recordOutcome": "Record simulated outcome",
  "reviewer.outcome.note":
    "Any outcome here is a simulated demo result only and requires a human click. It is not an official decision.",
  "reviewer.history": "Provenance history",
  "reviewer.noMissing": "No missing items flagged.",

  // Status labels
  "status.draft": "Draft",
  "status.ready": "Ready",
  "status.clarification_requested": "Clarification requested",
  "status.responded": "Responded",
  "status.submission_unverified": "Export only (not submitted)",
  "status.simulated_outcome": "Simulated outcome",

  // Questions — payment
  "q.pay_q1": "What happened with your parking payment?",
  "q.pay_q1.c1": "I believe I paid and have a record",
  "q.pay_q1.c2": "I believe I paid but have no record",
  "q.pay_q1.c3": "I am not sure whether payment went through",
  "q.pay_q2": "What kind of payment record can you show?",
  "q.pay_q2.c1": "An app or card transaction record",
  "q.pay_q2.c2": "A paper or meter receipt",
  "q.pay_q2.c3": "An account or statement entry",
  "q.pay_q3": "What detail on the ticket do you want to compare?",
  "q.pay_q3.c1": "The time on the ticket",
  "q.pay_q3.c2": "The zone or space number",
  "q.pay_q3.c3": "The date on the ticket",

  // Questions — breakdown
  "q.brk_q1": "What best describes the vehicle situation?",
  "q.brk_q1.c1": "The vehicle would not start or move",
  "q.brk_q1.c2": "The vehicle had a safety issue I was addressing",
  "q.brk_q2": "Did you arrange any assistance?",
  "q.brk_q2.c1": "I contacted a tow service",
  "q.brk_q2.c2": "I contacted roadside assistance",
  "q.brk_q2.c3": "I did not arrange assistance yet",
  "q.brk_q3": "What can you show about the time involved?",
  "q.brk_q3.c1": "A receipt or service record with a time",
  "q.brk_q3.c2": "A message or call log with a time",
  "q.brk_q3.c3": "No time record is available",

  // Questions — unclear/damaged/obstructed sign
  "q.sign_q1": "What was the problem with the sign or marking?",
  "q.sign_c1": "The sign was missing, damaged, or faded",
  "q.sign_c2": "The sign was blocked or hard to see",
  "q.sign_c3": "The sign or marking was confusing or contradictory",
  "q.sign_q2": "What could you show about the sign?",
  "q.sign_e1": "A photo of the sign or location",
  "q.sign_e2": "A note describing where it was",
  "q.sign_e3": "No photo is available",

  // Questions — residential parking permit
  "q.perm_q1": "What is the situation with your parking permit?",
  "q.perm_c1": "I hold a valid permit for this area",
  "q.perm_c2": "My permit was being renewed or processed",
  "q.perm_c3": "The permit zone boundary was unclear to me",
  "q.perm_q2": "What could you show about the permit?",
  "q.perm_e1": "The permit itself or its number",
  "q.perm_e2": "A renewal or application record",
  "q.perm_e3": "No permit record is available",

  // Questions — street cleaning / temporary restriction
  "q.clean_q1": "What happened with the temporary restriction?",
  "q.clean_c1": "The restriction sign was posted late or not visible",
  "q.clean_c2": "The posted time did not match when I was ticketed",
  "q.clean_c3": "The restriction appeared to be lifted or inactive",
  "q.clean_q2": "What could you show about the timing?",
  "q.clean_e1": "A photo with a time or date",
  "q.clean_e2": "A note about when you parked",
  "q.clean_e3": "No time record is available",

  // Questions — incorrect vehicle / plate / time / location
  "q.inc_q1": "What on the ticket appears to be incorrect?",
  "q.inc_c1": "The vehicle or make does not match mine",
  "q.inc_c2": "The license plate is wrong",
  "q.inc_c3": "The time does not match when I was there",
  "q.inc_c4": "The location or street is wrong",
  "q.inc_q2": "What could you show to compare?",
  "q.inc_e1": "A photo or document showing the correct detail",
  "q.inc_e2": "A record of my actual plate or vehicle",
  "q.inc_e3": "No supporting record is available",

  // Questions — accessibility / extraordinary circumstances
  "q.extra_q1": "What best describes the circumstance?",
  "q.extra_c1": "An accessibility or medical need was involved",
  "q.extra_c2": "An emergency required me to stop",
  "q.extra_c3": "Another unavoidable situation occurred",
  "q.extra_q2": "What could you show about it?",
  "q.extra_e1": "A document or record related to the situation",
  "q.extra_e2": "A note explaining what happened",
  "q.extra_e3": "No supporting record is available",

  // Stub + other
  "q.stub":
    "You can describe your situation in your own words below, add evidence, and generate a draft.",
  "choice.other_not_sure": "Other / not sure",

  // Generic UI
  "ui.loading": "Working…",
  "ui.error": "Something went wrong. Please try again.",
  "ui.verifyOfficial": "Verify on the official site",
  "ui.mic": "Speak",
  "ui.micStop": "Stop",
  "ui.readAloud": "Read aloud",
  "ui.micUnsupported": "Voice input is not available in this browser.",

  // Mode switch (Simple / Advanced)
  "mode.simple": "Simple mode",
  "mode.advanced": "Advanced mode",
  "mode.switchToSimple": "Switch to Simple mode",
  "mode.switchToAdvanced": "Switch to Advanced mode",
  "simple.progress": "Step {current} of {total}",
  "simple.chooseScenario": "What best describes your situation?",
  "simple.start": "Let's begin",

  // Insights / case intelligence
  "insights.title": "Case overview",
  "insights.claims": "Claims",
  "insights.evidence": "Evidence attached",
  "insights.verified": "Verified (attached)",
  "insights.missing": "Missing information",
  "insights.unsupported": "Claims without attached evidence",
  "insights.traceTitle": "Claim → Evidence → Official rule",
  "insights.traceClaim": "Claim",
  "insights.traceEvidence": "Supporting evidence",
  "insights.traceRule": "Related official rule",
  "insights.noEvidence": "No attached evidence yet",
  "insights.noTrace": "Add a claim to see how it connects to evidence and official rules.",
  "insights.completeness": "Factual completeness",
  "insights.coverage": "Evidence coverage",
  "insights.prep": "Case preparation",
  "insights.prepNote":
    "A case preparation indicator computed from your answers and attached evidence. It is NOT a prediction of appeal success.",
  "insights.nextBest": "Suggested next step",
  "insights.nextBestComplete": "All required questions for this scenario are answered.",
  "insights.deterministic": "Deterministic analytics — no AI inference, no trained model.",

  // Translation warning (P0 #3)
  "translation.needed":
    "Some statements are in your language and were not translated into English. Translate the marked lines before submitting.",

  // Submission handoff (P3)
  "handoff.title": "Submit at the official Boston portal",
  "handoff.reviewedBy":
    "Boston parking tickets are reviewed by the City of Boston Office of the Parking Clerk — not the RMV.",
  "handoff.openPortal": "Open the official Boston appeal portal",
  "handoff.noAuto":
    "AppealFlow does not submit anything for you and never marks a ticket submitted without an official receipt.",
  "handoff.checklist": "Evidence checklist",
  "handoff.checkDraft": "Copy your appeal letter",
  "handoff.checkAttached": "Attach your supporting evidence",
  "handoff.checkMissing": "Still needed before you submit",
};

const zh: Dict = {
  "app.name": "AppealFlow 申诉助手",
  "app.tagline": "每张罚单背后都有故事，每个声音都应被听见。",
  "app.independence":
    "独立演示项目——并非波士顿市政务服务，也不构成法律意见。AppealFlow 不会代为提交或裁定申诉。",
  "nav.resident": "居民",
  "nav.reviewer": "审核员（演示）",
  "nav.home": "首页",
  "lang.label": "语言",

  "landing.resident.title": "我收到了一张停车罚单",
  "landing.resident.desc":
    "回答几个简单问题，即可得到一封清晰、诚实、可编辑的申诉信。",
  "landing.reviewer.title": "审核员演示",
  "landing.reviewer.desc":
    "查看文员或听证官如何审阅主张、证据和待解答的问题。",
  "landing.start": "开始",

  "resident.pickCase": "从演示案例开始",
  "resident.pickCase.desc": "这些是明确虚构的示例，可安全用于公开演示。",
  "resident.manual": "或描述一张虚构的罚单",
  "resident.manual.placeholder":
    "简要描述情况（请勿填写真实姓名、车牌或罚单编号）。",
  "resident.manual.start": "开始空白案例",
  "resident.noPii":
    "请勿输入真实个人信息，如姓名、车牌、罚单编号或条形码。",
  "resident.pickScenario": "以下哪项最符合您的情况？",
  "resident.scenario.payment": "我认为我已付费或持有有效许可",
  "resident.scenario.breakdown": "我的车辆发生故障或被拖走",
  "resident.scenario.unclear_sign": "标志或标线不清晰或损坏",
  "resident.scenario.permit": "居民停车许可相关困惑",
  "resident.scenario.street_cleaning": "街道清扫或临时限制",
  "resident.scenario.incorrect_ticket": "罚单上的车辆、车牌、时间或地点有误",
  "resident.scenario.extraordinary_circumstances": "无障碍需要或特殊情况",
  "resident.scenario.other": "其他情况",
  "resident.answer": "回答",
  "resident.next": "下一步",
  "resident.back": "返回",
  "resident.skip": "跳过",
  "resident.reviewFacts": "检查您的陈述",
  "resident.reviewFacts.desc":
    "以下是您用自己的话作出的主张。请编辑或删除不准确之处。在核实前它们始终标记为“主张”。",
  "resident.addEvidence": "添加支持证据",
  "resident.evidence.kind": "类型",
  "resident.evidence.label": "名称",
  "resident.evidence.notes": "备注（可选）",
  "resident.evidence.status": "状态",
  "resident.evidence.add": "添加证据",
  "resident.generate": "生成申诉草稿",
  "resident.draft": "您的申诉信（可编辑）",
  "resident.copy": "复制",
  "resident.copied": "已复制",
  "resident.download": "下载 .txt",
  "resident.submitNote":
    "准备好后，请在波士顿市官方停车罚单申诉门户单独提交。AppealFlow 不会代您提交。",
  "resident.clarification.title": "审核员提出了一个问题",
  "resident.clarification.respond": "您的回复",
  "resident.clarification.send": "发送回复",
  "resident.markReady": "标记为就绪",

  "meta.source": "来源",
  "meta.verification": "核实状态",
  "source.resident_answer": "您的回答",
  "source.resident_edit": "您已编辑",
  "source.demo_seed": "演示数据",
  "verification.claimed": "主张",
  "verification.simulated": "模拟",
  "verification.unverified": "未核实",
  "evidenceStatus.uploaded": "已上传",
  "evidenceStatus.simulated": "模拟",
  "evidenceStatus.missing": "缺失",

  "reviewer.title": "案件审核（模拟）",
  "reviewer.notCity":
    "此审核界面仅为演示模拟，并非波士顿市系统或账户。",
  "reviewer.selectCase": "选择案件",
  "reviewer.noCase": "暂无案件。请先打开“居民”视图并创建案件。",
  "reviewer.claims": "居民的主张",
  "reviewer.evidence": "证据（与主张分开列示）",
  "reviewer.missing": "缺失信息",
  "reviewer.sources": "引用来源",
  "reviewer.hardship": "已披露的情况（仅作背景，不作评分）",
  "reviewer.original": "原文语言备注",
  "reviewer.uncertain": "仍存不确定之处",
  "reviewer.requestClarification": "请求澄清",
  "reviewer.clarification.placeholder": "提出一个澄清问题……",
  "reviewer.clarification.send": "发送请求",
  "reviewer.recordOutcome": "记录模拟结果",
  "reviewer.outcome.note":
    "此处的任何结果仅为模拟演示，且需人工点击。它不是正式裁定。",
  "reviewer.history": "溯源记录",
  "reviewer.noMissing": "未标记缺失项。",

  "status.draft": "草稿",
  "status.ready": "就绪",
  "status.clarification_requested": "已请求澄清",
  "status.responded": "已回复",
  "status.submission_unverified": "仅导出（未提交）",
  "status.simulated_outcome": "模拟结果",

  "q.pay_q1": "您的停车付款发生了什么情况？",
  "q.pay_q1.c1": "我认为已付费并有记录",
  "q.pay_q1.c2": "我认为已付费但没有记录",
  "q.pay_q1.c3": "我不确定付款是否成功",
  "q.pay_q2": "您能出示哪种付款记录？",
  "q.pay_q2.c1": "App 或银行卡交易记录",
  "q.pay_q2.c2": "纸质或计时器收据",
  "q.pay_q2.c3": "账户或对账单条目",
  "q.pay_q3": "您想核对罚单上的哪项信息？",
  "q.pay_q3.c1": "罚单上的时间",
  "q.pay_q3.c2": "区域或车位编号",
  "q.pay_q3.c3": "罚单上的日期",

  "q.brk_q1": "以下哪项最符合车辆情况？",
  "q.brk_q1.c1": "车辆无法启动或移动",
  "q.brk_q1.c2": "车辆存在我正在处理的安全问题",
  "q.brk_q2": "您是否安排了救援？",
  "q.brk_q2.c1": "我联系了拖车服务",
  "q.brk_q2.c2": "我联系了道路救援",
  "q.brk_q2.c3": "我尚未安排救援",
  "q.brk_q3": "关于所涉时间，您能出示什么？",
  "q.brk_q3.c1": "带时间的收据或服务记录",
  "q.brk_q3.c2": "带时间的短信或通话记录",
  "q.brk_q3.c3": "没有时间记录",

  "q.sign_q1": "标志或标线存在什么问题？",
  "q.sign_c1": "标志缺失、损坏或褪色",
  "q.sign_c2": "标志被遮挡或难以看清",
  "q.sign_c3": "标志或标线令人困惑或相互矛盾",
  "q.sign_q2": "关于该标志，您能出示什么？",
  "q.sign_e1": "标志或地点的照片",
  "q.sign_e2": "描述其位置的说明",
  "q.sign_e3": "没有照片",

  "q.perm_q1": "您的停车许可情况如何？",
  "q.perm_c1": "我持有该区域的有效许可",
  "q.perm_c2": "我的许可正在续办或办理中",
  "q.perm_c3": "我不清楚许可区域的边界",
  "q.perm_q2": "关于许可，您能出示什么？",
  "q.perm_e1": "许可本身或其编号",
  "q.perm_e2": "续办或申请记录",
  "q.perm_e3": "没有许可记录",

  "q.clean_q1": "临时限制发生了什么情况？",
  "q.clean_c1": "限制标志张贴过晚或不可见",
  "q.clean_c2": "张贴的时间与开罚单的时间不符",
  "q.clean_c3": "限制似乎已解除或无效",
  "q.clean_q2": "关于时间，您能出示什么？",
  "q.clean_e1": "带时间或日期的照片",
  "q.clean_e2": "关于停车时间的说明",
  "q.clean_e3": "没有时间记录",

  "q.inc_q1": "罚单上的哪项信息似乎有误？",
  "q.inc_c1": "车辆或品牌与我的不符",
  "q.inc_c2": "车牌号码有误",
  "q.inc_c3": "时间与我在场的时间不符",
  "q.inc_c4": "地点或街道有误",
  "q.inc_q2": "您能出示什么进行比对？",
  "q.inc_e1": "显示正确信息的照片或文件",
  "q.inc_e2": "我实际车牌或车辆的记录",
  "q.inc_e3": "没有佐证记录",

  "q.extra_q1": "以下哪项最符合该情况？",
  "q.extra_c1": "涉及无障碍或医疗需要",
  "q.extra_c2": "紧急情况迫使我停车",
  "q.extra_c3": "发生了其他不可避免的情况",
  "q.extra_q2": "关于此情况，您能出示什么？",
  "q.extra_e1": "与该情况相关的文件或记录",
  "q.extra_e2": "说明经过的文字",
  "q.extra_e3": "没有佐证记录",

  "q.stub":
    "您可在下方用自己的话描述情况、添加证据并生成草稿。",
  "choice.other_not_sure": "其他 / 不确定",

  "ui.loading": "处理中……",
  "ui.error": "出现问题，请重试。",
  "ui.verifyOfficial": "请在官方网站核实",
  "ui.mic": "语音输入",
  "ui.micStop": "停止",
  "ui.readAloud": "朗读",
  "ui.micUnsupported": "此浏览器不支持语音输入。",

  "mode.simple": "简易模式",
  "mode.advanced": "高级模式",
  "mode.switchToSimple": "切换到简易模式",
  "mode.switchToAdvanced": "切换到高级模式",
  "simple.progress": "第 {current} 步，共 {total} 步",
  "simple.chooseScenario": "以下哪项最符合您的情况？",
  "simple.start": "开始",

  "insights.title": "案件概览",
  "insights.claims": "主张",
  "insights.evidence": "已附证据",
  "insights.verified": "已核实（已附）",
  "insights.missing": "缺失信息",
  "insights.unsupported": "无附带证据的主张",
  "insights.traceTitle": "主张 → 证据 → 官方规则",
  "insights.traceClaim": "主张",
  "insights.traceEvidence": "支持证据",
  "insights.traceRule": "相关官方规则",
  "insights.noEvidence": "尚无已附证据",
  "insights.noTrace": "添加一条主张，即可查看它与证据和官方规则的关联。",
  "insights.completeness": "事实完整度",
  "insights.coverage": "证据覆盖率",
  "insights.prep": "案件准备度",
  "insights.prepNote":
    "根据您的回答和已附证据计算的案件准备度指标。它不是对申诉成功与否的预测。",
  "insights.nextBest": "建议的下一步",
  "insights.nextBestComplete": "该情况所需的问题均已回答。",
  "insights.deterministic": "确定性分析——无 AI 推理，无训练模型。",

  "translation.needed":
    "部分陈述仍为您的母语，尚未翻译成英文。提交前请翻译标记的行。",

  "handoff.title": "在波士顿官方门户提交",
  "handoff.reviewedBy":
    "波士顿停车罚单由波士顿市停车文员办公室审核，而非机动车管理局（RMV）。",
  "handoff.openPortal": "打开波士顿官方申诉门户",
  "handoff.noAuto":
    "AppealFlow 不会代您提交任何内容，也绝不会在没有官方回执的情况下将罚单标记为已提交。",
  "handoff.checklist": "证据清单",
  "handoff.checkDraft": "复制您的申诉信",
  "handoff.checkAttached": "附上您的佐证证据",
  "handoff.checkMissing": "提交前仍需补充",
};

const es: Dict = {
  "app.name": "AppealFlow",
  "app.tagline": "Cada multa tiene una historia. Cada voz merece ser escuchada.",
  "app.independence":
    "Demostración independiente: no es un servicio de la Ciudad de Boston ni asesoría legal. AppealFlow nunca presenta ni decide una apelación.",
  "nav.resident": "Residente",
  "nav.reviewer": "Revisor (Demo)",
  "nav.home": "Inicio",
  "lang.label": "Idioma",

  "landing.resident.title": "Recibí una multa de estacionamiento",
  "landing.resident.desc":
    "Responde unas preguntas sencillas y obtén una carta de apelación clara y honesta que puedes revisar y editar.",
  "landing.reviewer.title": "Demo de revisor",
  "landing.reviewer.desc":
    "Mira cómo un funcionario podría revisar las afirmaciones, la evidencia y las preguntas abiertas.",
  "landing.start": "Comenzar",

  "resident.pickCase": "Empezar desde un caso de demostración",
  "resident.pickCase.desc":
    "Son ejemplos claramente ficticios, seguros para una demostración pública.",
  "resident.manual": "O describe una multa ficticia",
  "resident.manual.placeholder":
    "Describe brevemente la situación (no incluyas nombres, placa ni números de multa reales).",
  "resident.manual.start": "Comenzar un caso en blanco",
  "resident.noPii":
    "No ingreses información personal real como nombre, placa, número de multa o código de barras.",
  "resident.pickScenario": "¿Qué describe mejor tu situación?",
  "resident.scenario.payment": "Creo que pagué o tenía un permiso válido",
  "resident.scenario.breakdown": "Mi vehículo se averió o fue remolcado",
  "resident.scenario.unclear_sign": "La señal o marca no estaba clara o dañada",
  "resident.scenario.permit": "Confusión con el permiso de estacionamiento residencial",
  "resident.scenario.street_cleaning": "Limpieza de calles o restricción temporal",
  "resident.scenario.incorrect_ticket":
    "Vehículo, placa, hora o lugar incorrectos en la multa",
  "resident.scenario.extraordinary_circumstances":
    "Accesibilidad o circunstancias extraordinarias",
  "resident.scenario.other": "Otra cosa",
  "resident.answer": "Responder",
  "resident.next": "Siguiente",
  "resident.back": "Atrás",
  "resident.skip": "Omitir",
  "resident.reviewFacts": "Revisa tus declaraciones",
  "resident.reviewFacts.desc":
    "Estas son tus afirmaciones con tus propias palabras. Edita o elimina lo que no sea exacto. Siguen marcadas como afirmaciones hasta verificarse.",
  "resident.addEvidence": "Agregar evidencia de respaldo",
  "resident.evidence.kind": "Tipo",
  "resident.evidence.label": "Etiqueta",
  "resident.evidence.notes": "Notas (opcional)",
  "resident.evidence.status": "Estado",
  "resident.evidence.add": "Agregar evidencia",
  "resident.generate": "Generar borrador de apelación",
  "resident.draft": "Tu carta de apelación (editable)",
  "resident.copy": "Copiar",
  "resident.copied": "Copiado",
  "resident.download": "Descargar .txt",
  "resident.submitNote":
    "Cuando estés listo, preséntala por separado en el portal oficial de apelaciones de multas de la Ciudad de Boston. AppealFlow no la presenta por ti.",
  "resident.clarification.title": "El revisor hizo una pregunta",
  "resident.clarification.respond": "Tu respuesta",
  "resident.clarification.send": "Enviar respuesta",
  "resident.markReady": "Marcar como listo",

  "meta.source": "Origen",
  "meta.verification": "Verificación",
  "source.resident_answer": "Tu respuesta",
  "source.resident_edit": "Editado por ti",
  "source.demo_seed": "Dato de demostración",
  "verification.claimed": "Afirmado",
  "verification.simulated": "Simulado",
  "verification.unverified": "Sin verificar",
  "evidenceStatus.uploaded": "Subido",
  "evidenceStatus.simulated": "Simulado",
  "evidenceStatus.missing": "Faltante",

  "reviewer.title": "Revisión del caso (simulada)",
  "reviewer.notCity":
    "Esta vista de revisor es una simulación para demostración. No es un sistema ni una cuenta de la Ciudad de Boston.",
  "reviewer.selectCase": "Seleccionar un caso",
  "reviewer.noCase":
    "Aún no hay caso. Abre la vista de Residente y crea un caso primero.",
  "reviewer.claims": "Afirmaciones del residente",
  "reviewer.evidence": "Evidencia (informada por separado de las afirmaciones)",
  "reviewer.missing": "Información faltante",
  "reviewer.sources": "Fuentes citadas",
  "reviewer.hardship": "Circunstancias declaradas (solo contexto, no es puntuación)",
  "reviewer.original": "Nota en el idioma original",
  "reviewer.uncertain": "Lo que sigue siendo incierto",
  "reviewer.requestClarification": "Solicitar aclaración",
  "reviewer.clarification.placeholder": "Haz una sola pregunta de aclaración…",
  "reviewer.clarification.send": "Enviar solicitud",
  "reviewer.recordOutcome": "Registrar resultado simulado",
  "reviewer.outcome.note":
    "Cualquier resultado aquí es solo un resultado de demostración simulado y requiere un clic humano. No es una decisión oficial.",
  "reviewer.history": "Historial de procedencia",
  "reviewer.noMissing": "No se marcaron elementos faltantes.",

  "status.draft": "Borrador",
  "status.ready": "Listo",
  "status.clarification_requested": "Aclaración solicitada",
  "status.responded": "Respondido",
  "status.submission_unverified": "Solo exportado (no presentado)",
  "status.simulated_outcome": "Resultado simulado",

  "q.pay_q1": "¿Qué pasó con el pago de tu estacionamiento?",
  "q.pay_q1.c1": "Creo que pagué y tengo un comprobante",
  "q.pay_q1.c2": "Creo que pagué pero no tengo comprobante",
  "q.pay_q1.c3": "No estoy seguro si el pago se procesó",
  "q.pay_q2": "¿Qué tipo de comprobante de pago puedes mostrar?",
  "q.pay_q2.c1": "Un registro de transacción de app o tarjeta",
  "q.pay_q2.c2": "Un recibo en papel o del parquímetro",
  "q.pay_q2.c3": "Un movimiento de cuenta o estado de cuenta",
  "q.pay_q3": "¿Qué dato de la multa quieres comparar?",
  "q.pay_q3.c1": "La hora en la multa",
  "q.pay_q3.c2": "La zona o el número de espacio",
  "q.pay_q3.c3": "La fecha en la multa",

  "q.brk_q1": "¿Qué describe mejor la situación del vehículo?",
  "q.brk_q1.c1": "El vehículo no arrancaba ni se movía",
  "q.brk_q1.c2": "El vehículo tenía un problema de seguridad que atendía",
  "q.brk_q2": "¿Gestionaste alguna asistencia?",
  "q.brk_q2.c1": "Contacté un servicio de grúa",
  "q.brk_q2.c2": "Contacté asistencia en carretera",
  "q.brk_q2.c3": "Aún no gestioné asistencia",
  "q.brk_q3": "¿Qué puedes mostrar sobre el tiempo transcurrido?",
  "q.brk_q3.c1": "Un recibo o registro de servicio con hora",
  "q.brk_q3.c2": "Un mensaje o registro de llamada con hora",
  "q.brk_q3.c3": "No hay registro de tiempo disponible",

  "q.sign_q1": "¿Cuál fue el problema con la señal o marca?",
  "q.sign_c1": "La señal faltaba, estaba dañada o descolorida",
  "q.sign_c2": "La señal estaba tapada o difícil de ver",
  "q.sign_c3": "La señal o marca era confusa o contradictoria",
  "q.sign_q2": "¿Qué podrías mostrar sobre la señal?",
  "q.sign_e1": "Una foto de la señal o del lugar",
  "q.sign_e2": "Una nota que describa dónde estaba",
  "q.sign_e3": "No hay foto disponible",

  "q.perm_q1": "¿Cuál es la situación con tu permiso de estacionamiento?",
  "q.perm_c1": "Tengo un permiso válido para esta zona",
  "q.perm_c2": "Mi permiso estaba en renovación o trámite",
  "q.perm_c3": "El límite de la zona de permiso no me quedaba claro",
  "q.perm_q2": "¿Qué podrías mostrar sobre el permiso?",
  "q.perm_e1": "El permiso o su número",
  "q.perm_e2": "Un registro de renovación o solicitud",
  "q.perm_e3": "No hay registro del permiso",

  "q.clean_q1": "¿Qué pasó con la restricción temporal?",
  "q.clean_c1": "La señal se colocó tarde o no era visible",
  "q.clean_c2": "La hora indicada no coincidía con la de la multa",
  "q.clean_c3": "La restricción parecía levantada o inactiva",
  "q.clean_q2": "¿Qué podrías mostrar sobre el horario?",
  "q.clean_e1": "Una foto con hora o fecha",
  "q.clean_e2": "Una nota sobre cuándo estacionaste",
  "q.clean_e3": "No hay registro de tiempo disponible",

  "q.inc_q1": "¿Qué dato de la multa parece incorrecto?",
  "q.inc_c1": "El vehículo o la marca no coincide con el mío",
  "q.inc_c2": "La placa es incorrecta",
  "q.inc_c3": "La hora no coincide con cuando estuve ahí",
  "q.inc_c4": "El lugar o la calle es incorrecto",
  "q.inc_q2": "¿Qué podrías mostrar para comparar?",
  "q.inc_e1": "Una foto o documento con el dato correcto",
  "q.inc_e2": "Un registro de mi placa o vehículo reales",
  "q.inc_e3": "No hay registro de respaldo",

  "q.extra_q1": "¿Qué describe mejor la circunstancia?",
  "q.extra_c1": "Hubo una necesidad de accesibilidad o médica",
  "q.extra_c2": "Una emergencia me obligó a detenerme",
  "q.extra_c3": "Ocurrió otra situación inevitable",
  "q.extra_q2": "¿Qué podrías mostrar al respecto?",
  "q.extra_e1": "Un documento o registro relacionado",
  "q.extra_e2": "Una nota explicando lo sucedido",
  "q.extra_e3": "No hay registro de respaldo",

  "q.stub":
    "Puedes describir tu situación con tus propias palabras abajo, agregar evidencia y generar un borrador.",
  "choice.other_not_sure": "Otro / no estoy seguro",

  "ui.loading": "Trabajando…",
  "ui.error": "Algo salió mal. Inténtalo de nuevo.",
  "ui.verifyOfficial": "Verifica en el sitio oficial",
  "ui.mic": "Hablar",
  "ui.micStop": "Detener",
  "ui.readAloud": "Leer en voz alta",
  "ui.micUnsupported": "La entrada de voz no está disponible en este navegador.",

  "mode.simple": "Modo simple",
  "mode.advanced": "Modo avanzado",
  "mode.switchToSimple": "Cambiar a modo simple",
  "mode.switchToAdvanced": "Cambiar a modo avanzado",
  "simple.progress": "Paso {current} de {total}",
  "simple.chooseScenario": "¿Qué describe mejor tu situación?",
  "simple.start": "Comencemos",

  "insights.title": "Resumen del caso",
  "insights.claims": "Afirmaciones",
  "insights.evidence": "Evidencia adjunta",
  "insights.verified": "Verificada (adjunta)",
  "insights.missing": "Información faltante",
  "insights.unsupported": "Afirmaciones sin evidencia adjunta",
  "insights.traceTitle": "Afirmación → Evidencia → Regla oficial",
  "insights.traceClaim": "Afirmación",
  "insights.traceEvidence": "Evidencia de respaldo",
  "insights.traceRule": "Regla oficial relacionada",
  "insights.noEvidence": "Aún no hay evidencia adjunta",
  "insights.noTrace": "Agrega una afirmación para ver cómo se conecta con la evidencia y las reglas oficiales.",
  "insights.completeness": "Completitud de los hechos",
  "insights.coverage": "Cobertura de evidencia",
  "insights.prep": "Preparación del caso",
  "insights.prepNote":
    "Un indicador de preparación del caso calculado a partir de tus respuestas y la evidencia adjunta. NO es una predicción del éxito de la apelación.",
  "insights.nextBest": "Siguiente paso sugerido",
  "insights.nextBestComplete": "Todas las preguntas requeridas para esta situación están respondidas.",
  "insights.deterministic": "Analítica determinista: sin inferencia de IA, sin modelo entrenado.",

  "translation.needed":
    "Algunas declaraciones están en tu idioma y no se tradujeron al inglés. Traduce las líneas marcadas antes de enviar.",

  "handoff.title": "Envía en el portal oficial de Boston",
  "handoff.reviewedBy":
    "Las multas de estacionamiento de Boston las revisa la Oficina del Secretario de Estacionamiento de la Ciudad de Boston, no el RMV.",
  "handoff.openPortal": "Abrir el portal oficial de apelaciones de Boston",
  "handoff.noAuto":
    "AppealFlow no envía nada por ti y nunca marca una multa como enviada sin un recibo oficial.",
  "handoff.checklist": "Lista de evidencia",
  "handoff.checkDraft": "Copia tu carta de apelación",
  "handoff.checkAttached": "Adjunta tu evidencia de respaldo",
  "handoff.checkMissing": "Aún necesario antes de enviar",
};

export const translations: Record<Lang, Dict> = { en, zh, es };

/** Resolve a key for a language, falling back to English then the key itself. */
export function t(lang: Lang, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
