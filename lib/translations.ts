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
  "resident.scenario.breakdown": "My vehicle broke down",
  "resident.scenario.unclear_sign": "The sign or marking was unclear",
  "resident.scenario.extraordinary_circumstances":
    "There were extraordinary circumstances",
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

  // Stub + other
  "q.stub":
    "This situation type is not yet fully guided in this demo. You can still describe it in your own words below, add evidence, and generate a draft.",
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

  // Translation warning (P0 #3)
  "translation.needed":
    "Some statements are in your language and were not translated into English. Translate the marked lines before submitting.",
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
  "resident.scenario.breakdown": "我的车辆发生故障",
  "resident.scenario.unclear_sign": "标志或标线不清晰",
  "resident.scenario.extraordinary_circumstances": "存在特殊情况",
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

  "q.stub":
    "本演示尚未对该情况类型提供完整引导。您仍可在下方用自己的话描述、添加证据并生成草稿。",
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

  "translation.needed":
    "部分陈述仍为您的母语，尚未翻译成英文。提交前请翻译标记的行。",
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
  "resident.scenario.breakdown": "Mi vehículo se averió",
  "resident.scenario.unclear_sign": "La señal o marca no estaba clara",
  "resident.scenario.extraordinary_circumstances":
    "Hubo circunstancias extraordinarias",
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

  "q.stub":
    "Este tipo de situación aún no tiene guía completa en esta demo. Puedes describirla con tus propias palabras abajo, agregar evidencia y generar un borrador.",
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

  "translation.needed":
    "Algunas declaraciones están en tu idioma y no se tradujeron al inglés. Traduce las líneas marcadas antes de enviar.",
};

export const translations: Record<Lang, Dict> = { en, zh, es };

/** Resolve a key for a language, falling back to English then the key itself. */
export function t(lang: Lang, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
