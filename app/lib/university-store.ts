import "server-only";

import { getRuntimeEnv } from "./runtime-env";
import { PortalError, type PortalProfile } from "./directory-store";

const PARTICIPANT_TYPES = new Set(["participant", "center_director"]);
const USER_STATUSES = new Set(["pending", "active", "paused", "completed", "archived"]);
const REQUEST_STATUSES = new Set(["received", "in_review", "approved", "changes_requested", "closed"]);
const CERTIFICATE_STATUSES = new Set(["pending_validation", "in_review", "approved", "ready", "delivered", "closed"]);
const PAYMENT_STATUSES = new Set(["total", "partial", "pending"]);
const TASK_STATUSES = new Set(["complete", "partial", "pending"]);
const REQUEST_TYPES = new Set(["printing", "reprinting"]);
const CONTENT_STATUSES = new Set(["draft", "published", "archived"]);
const SETTING_KEYS = ["phone", "taskUrl", "spinHolder", "spinClabe", "spinDepositCode"] as const;
const TASK_FORM_URL = "https://forms.gle/2K6RpwpTjRU8Sm8s9";

const initialModules = [
  ["El liderazgo comienza contigo", "https://www.youtube.com/watch?v=fo25kF4ubQc&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=6"],
  ["Comunicación asertiva I", "https://www.youtube.com/watch?v=9IjvaLmG-a4&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=11"],
  ["Comunicación asertiva II", "https://www.youtube.com/watch?v=I5CIVyMITZ8&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=12"],
  ["Inteligencia emocional I", "https://www.youtube.com/watch?v=tSSD7kId0OU&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=2"],
  ["Inteligencia emocional II", "https://www.youtube.com/watch?v=8vdm1dTqmWg&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=1"],
  ["Inteligencia social I", "https://www.youtube.com/watch?v=t08dwWwa7uU&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=5"],
  ["Inteligencia social II", "https://www.youtube.com/watch?v=QU1lI5sGMCk&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=4"],
  ["Oratoria", "https://www.youtube.com/watch?v=xvdvhEl5vwg&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=7"],
  ["Apadrinamiento I", "https://www.youtube.com/watch?v=CwU_YxPBJm8&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=10"],
  ["Apadrinamiento II", "https://www.youtube.com/watch?v=qYpoHNnOpac&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=9"],
  ["Coordinación", "https://www.youtube.com/watch?v=NBIVWtSx1S0&list=PLARxxudTSjh1m4kRlvhlCMdrglV6tMX2E&index=8"],
  ["Historia y filosofía FGDLL", "https://youtu.be/Q8Bot_dV2mo"],
  ["ADN FGDLL", "https://www.youtube.com/watch?v=vmZpoi3dbOk"],
];

const dpl2026Modules = [
  ["M1 · El liderazgo comienza contigo", "https://youtu.be/LEF07f077Us"],
  ["M1 · Repaso", "https://youtu.be/Vsu1DuyINEY"],
  ["M2 · Tu brújula interior", "https://youtu.be/oynTPaOFXLk"],
  ["M2 · Repaso", "https://youtu.be/GQcofqCg0Ys"],
  ["M3 · Comunicación consciente · Parte 1", "https://youtu.be/8WAt3AEEkN8"],
  ["M3 · Comunicación consciente · Parte 2", "https://youtu.be/g3mkioyQKos"],
  ["M3 · Repaso", "https://youtu.be/DVU_wtAYlUc"],
  ["M4 · El triángulo dramático", "https://youtu.be/8ngXSlUMUkg"],
  ["M5 · El liderazgo prescindible", "https://youtu.be/cN5HfW5YOe8"],
  ["M6 · La filosofía del Guerrero de la Luz · Parte 1", "https://youtu.be/u8Fx1O0lfJ0"],
  ["M6 · La filosofía del Guerrero de la Luz · Parte 2", "https://youtu.be/r69vgXnX2dA"],
];

const dpl2026Materials = [
  ["Aula completa DPL-2026", "Índice con los seis módulos, clases, repasos, cuadernillos y entrega de actividades.", "/universidad/dpl-2026/index.html", "guide"],
  ["Cuadernillo digital M1 · El liderazgo empieza contigo", "Ejercicios interactivos del primer módulo.", "/universidad/dpl-2026/cuadernillos/M1.html", "digital_workbook"],
  ["Cuadernillo digital M2 · La brújula interior", "Ejercicios interactivos del segundo módulo.", "/universidad/dpl-2026/cuadernillos/M2.html", "digital_workbook"],
  ["Cuadernillo digital M3 · Comunicación consciente", "Ejercicios interactivos del tercer módulo.", "/universidad/dpl-2026/cuadernillos/M3.html", "digital_workbook"],
  ["Cuadernillo digital M4 · Conflicto y crisis", "Ejercicios interactivos del cuarto módulo.", "/universidad/dpl-2026/cuadernillos/M4.html", "digital_workbook"],
  ["Cuadernillo digital M5 · Servicio y equipo", "Ejercicios interactivos del quinto módulo.", "/universidad/dpl-2026/cuadernillos/M5.html", "digital_workbook"],
  ["Cuadernillo digital M6 · Filosofía del Guerrero de la Luz", "Integración y cierre del diplomado.", "/universidad/dpl-2026/cuadernillos/M6.html", "digital_workbook"],
  ["Entregar actividades DPL-2026", "Formulario oficial de Google para enviar las evidencias de los cuadernillos.", TASK_FORM_URL, "assignment"],
];

function db() {
  const value = getRuntimeEnv().DB;
  if (!value) throw new PortalError("Formación FGDLL no está disponible en este momento.", 503);
  return value;
}

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function email(value: unknown) {
  const normalized = clean(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new PortalError("Escribe un correo electrónico válido.");
  return normalized;
}

function phone(value: unknown) {
  const normalized = clean(value, 30).replace(/[^\d+]/g, "").slice(0, 18);
  if (normalized.replace(/\D/g, "").length < 10) throw new PortalError("Escribe un número de contacto válido.");
  return normalized;
}

function requireAdmin(profile: PortalProfile) {
  if (profile.role !== "admin") throw new PortalError("Solo Administración puede gestionar Formación FGDLL.", 403);
}

function version(value: unknown) {
  const result = clean(value, 40);
  if (!result || !/^[\p{L}\p{N} ._/-]+$/u.test(result)) throw new PortalError("Selecciona una generación válida.");
  return result;
}

function safeUrl(value: unknown) {
  const result = clean(value, 1000);
  if (result.startsWith("/")) return result;
  try { const url = new URL(result); if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol"); return result; }
  catch { throw new PortalError("Escribe un enlace válido que comience con https://."); }
}

async function ensureUniversityContent() {
  const marker = await db().prepare("SELECT value FROM content_settings WHERE key = 'university_content_v1'").first();
  if (marker) return;
  const statements = [
    db().prepare(`INSERT OR IGNORE INTO university_programs
      (id, title, generation, description, status, sort_order, created_by)
      VALUES ('DPL1-2022', 'Diplomado en Liderazgo I', '2022', 'Formación básica para fortalecer el liderazgo, la comunicación, el apadrinamiento y la identidad FGDLL.', 'published', 10, 'initial-import')`),
    ...initialModules.map(([title, videoUrl], index) => db().prepare(`INSERT OR IGNORE INTO university_modules
      (id, program_id, title, video_url, status, sort_order, created_by)
      VALUES (?, 'DPL1-2022', ?, ?, 'published', ?, 'initial-import')`)
      .bind(`DPL1-2022-M${String(index + 1).padStart(2, "0")}`, title, videoUrl, (index + 1) * 10)),
    db().prepare(`INSERT OR IGNORE INTO university_materials
      (id, program_id, title, description, resource_url, resource_type, status, sort_order, created_by)
      VALUES ('MAT-DPL1-2022-ACTIVIDAD', 'DPL1-2022', 'Guía de actividades DPL1 2022', 'Instrucciones, módulos y criterios para entregar las actividades.', '/universidad/dpl1-2022', 'guide', 'published', 10, 'initial-import')`),
    db().prepare(`INSERT OR IGNORE INTO university_materials
      (id, program_id, title, description, resource_url, resource_type, status, sort_order, created_by)
      VALUES ('MAT-DPL1-2022-ENTREGA', 'DPL1-2022', 'Enviar actividades', 'Formulario oficial de Google para cargar las fotografías de las tareas.', ?, 'assignment', 'published', 20, 'initial-import')`).bind(TASK_FORM_URL),
    ...Object.entries({ phone: "9999011852", taskUrl: TASK_FORM_URL, spinHolder: "LAURA CORTAZAR", spinClabe: "728969000008838228", spinDepositCode: "2242-1787-4421-1658" })
      .map(([key, value]) => db().prepare("INSERT OR IGNORE INTO content_settings (key, value) VALUES (?, ?)").bind(`university.${key}`, value)),
    db().prepare("INSERT OR REPLACE INTO content_settings (key, value, updated_at) VALUES ('university_content_v1', 'seeded', CURRENT_TIMESTAMP)"),
  ];
  await db().batch(statements);
}

async function ensureDpl2026Content() {
  const marker = await db().prepare("SELECT value FROM content_settings WHERE key = 'university_dpl2026_v1'").first();
  if (marker) return;
  const statements = [
    db().prepare(`INSERT OR IGNORE INTO university_programs
      (id, title, generation, description, status, sort_order, created_by)
      VALUES ('DPL1-2026', 'Diplomado de Liderazgo Efectivo I', '2026', 'Seis módulos para trabajar liderazgo personal, brújula interior, comunicación consciente, conflicto, servicio y filosofía del Guerrero de la Luz.', 'published', 20, 'dpl2026-import')`),
    ...dpl2026Modules.map(([title, videoUrl], index) => db().prepare(`INSERT OR IGNORE INTO university_modules
      (id, program_id, title, video_url, status, sort_order, created_by)
      VALUES (?, 'DPL1-2026', ?, ?, 'published', ?, 'dpl2026-import')`)
      .bind(`DPL1-2026-VIDEO-${String(index + 1).padStart(2, "0")}`, title, videoUrl, (index + 1) * 10)),
    ...dpl2026Materials.map(([title, description, resourceUrl, resourceType], index) => db().prepare(`INSERT OR IGNORE INTO university_materials
      (id, program_id, title, description, resource_url, resource_type, status, sort_order, created_by)
      VALUES (?, 'DPL1-2026', ?, ?, ?, ?, 'published', ?, 'dpl2026-import')`)
      .bind(`DPL1-2026-MATERIAL-${String(index + 1).padStart(2, "0")}`, title, description, resourceUrl, resourceType, (index + 1) * 10)),
    db().prepare("INSERT OR REPLACE INTO content_settings (key, value, updated_at) VALUES ('university_dpl2026_v1', 'seeded', CURRENT_TIMESTAMP)"),
  ];
  await db().batch(statements);
}

async function ensureOfficialTaskForm() {
  const marker = await db().prepare("SELECT value FROM content_settings WHERE key = 'university_task_form_v2'").first();
  if (marker) return;
  await db().batch([
    db().prepare("UPDATE university_materials SET resource_url = ?, description = 'Formulario oficial de Google para enviar las evidencias de las tareas.', updated_at = CURRENT_TIMESTAMP WHERE resource_type = 'assignment'").bind(TASK_FORM_URL),
    db().prepare("INSERT INTO content_settings (key, value, updated_at) VALUES ('university.taskUrl', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP").bind(TASK_FORM_URL),
    db().prepare("INSERT OR REPLACE INTO content_settings (key, value, updated_at) VALUES ('university_task_form_v2', 'google-forms', CURRENT_TIMESTAMP)"),
  ]);
}

async function audit(actorEmail: string, action: string, targetId: string, details: unknown) {
  await db().prepare("INSERT INTO audit_log (actor_email, action, target_type, target_id, details_json) VALUES (?, ?, 'university', ?, ?)")
    .bind(actorEmail, action, targetId, JSON.stringify(details)).run();
}

export async function registerUniversityUser(input: Record<string, unknown>, actorEmail = "public-form", source = "self_registration") {
  const userEmail = email(input.email);
  const fullName = clean(input.fullName, 180) || (source === "admin_manual" ? userEmail.split("@")[0] : "");
  const mobilePhone = source === "admin_manual" && !clean(input.mobilePhone) ? "" : phone(input.mobilePhone);
  const organization = clean(input.organization, 180);
  const diplomaVersion = version(input.diplomaVersion);
  const participantType = PARTICIPANT_TYPES.has(String(input.participantType)) ? String(input.participantType) : "participant";
  const requestNotes = clean(input.requestNotes, 2000);
  // Toda persona que completa el registro recibe acceso inmediato al aula.
  // La solicitud permanece en Administración para seguimiento, pero ya no
  // funciona como una barrera de admisión.
  const initialStatus = "active";
  if (!fullName) throw new PortalError("Escribe el nombre completo.");
  if (source !== "admin_manual" && !organization) throw new PortalError("Escribe el grupo o centro.");
  const existing = await db().prepare("SELECT id, status FROM university_users WHERE email = ?").bind(userEmail).first<Record<string, unknown>>();
  if (existing) {
    if (existing.status === "pending") {
      await db().prepare("UPDATE university_users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(existing.id).run();
    }
    await audit(actorEmail, "university_access_confirmed", userEmail, { source, previousStatus: existing.status });
    return { ok: true, id: Number(existing.id), email: userEmail, status: "active", accessGranted: true, existing: true };
  }
  const result = await db().prepare(`INSERT INTO university_users
    (email, full_name, mobile_phone, organization, participant_type, diploma_version, status, source, request_notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(userEmail, fullName, mobilePhone, organization, participantType, diplomaVersion, initialStatus, source, requestNotes, actorEmail).run();
  await audit(actorEmail, "university_user_created", userEmail, { source, diplomaVersion, participantType });
  return { ok: true, id: Number(result.meta.last_row_id), email: userEmail, status: initialStatus, accessGranted: true };
}

export async function grantUniversityAccessFromPortalRequest(input: {
  email: string; fullName?: string; mobilePhone?: string; organization?: string; requestNotes?: string;
}) {
  await ensureUniversityContent();
  const userEmail = email(input.email);
  const fullName = clean(input.fullName, 180) || userEmail.split("@")[0];
  const mobilePhone = clean(input.mobilePhone, 30).replace(/[^\d+]/g, "").slice(0, 18);
  const organization = clean(input.organization, 180);
  const requestNotes = clean(input.requestNotes, 2000);
  const existing = await db().prepare("SELECT status FROM university_users WHERE email = ?").bind(userEmail).first<Record<string, unknown>>();
  if (existing?.status === "active") {
    return { ok: true, email: userEmail, status: "active", accessGranted: true, existing: true };
  }
  await db().prepare(`INSERT INTO university_users
    (email, full_name, mobile_phone, organization, participant_type, diploma_version, status, source, request_notes, created_by)
    VALUES (?, ?, ?, ?, 'participant', 'Acceso general', 'active', 'portal_access_request', ?, ?)
    ON CONFLICT(email) DO UPDATE SET full_name = excluded.full_name, mobile_phone = excluded.mobile_phone,
    organization = CASE WHEN excluded.organization != '' THEN excluded.organization ELSE university_users.organization END,
    status = 'active', updated_at = CURRENT_TIMESTAMP`)
    .bind(userEmail, fullName, mobilePhone, organization, requestNotes, userEmail).run();
  await audit(userEmail, "university_access_granted_from_portal", userEmail, { organization });
  return { ok: true, email: userEmail, status: "active", accessGranted: true };
}

export async function registerCenterBatch(input: Record<string, unknown>) {
  const directorEmail = email(input.directorEmail);
  const mobilePhone = phone(input.mobilePhone);
  const centerName = clean(input.centerName, 180);
  const diplomaVersion = version(input.diplomaVersion);
  const participantNames = clean(input.participantNames, 6000).split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 100);
  const requestNotes = clean(input.requestNotes, 2000);
  if (!centerName) throw new PortalError("Escribe el nombre del centro.");
  if (!participantNames.length) throw new PortalError("Agrega al menos un participante, uno por línea.");
  const id = `UNI-CEN-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db().prepare(`INSERT INTO university_center_batches
    (id, director_email, mobile_phone, center_name, diploma_version, participant_names_json, participant_count, request_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, directorEmail, mobilePhone, centerName, diplomaVersion, JSON.stringify(participantNames), participantNames.length, requestNotes).run();
  await audit("public-center-form", "university_center_batch_created", id, { centerName, diplomaVersion, participantCount: participantNames.length });
  return { ok: true, id, participantCount: participantNames.length };
}

export async function requestCertificate(input: Record<string, unknown>) {
  const fullName = clean(input.fullName, 180);
  const requesterEmail = email(input.email);
  const mobilePhone = phone(input.mobilePhone);
  const groupName = clean(input.groupName, 180);
  const diplomaVersion = version(input.diplomaVersion);
  const paymentStatus = clean(input.paymentStatus, 20);
  const tasksStatus = clean(input.tasksStatus, 20);
  const requestType = clean(input.requestType, 20);
  const requestNotes = clean(input.requestNotes, 2000);
  if (!fullName) throw new PortalError("Escribe el nombre completo.");
  if (!groupName) throw new PortalError("Escribe el grupo o centro.");
  if (!PAYMENT_STATUSES.has(paymentStatus)) throw new PortalError("Indica el estado del pago del diplomado.");
  if (!TASK_STATUSES.has(tasksStatus)) throw new PortalError("Indica el avance de tus tareas.");
  if (!REQUEST_TYPES.has(requestType)) throw new PortalError("Selecciona impresión o reimpresión.");
  const id = `UNI-REC-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db().prepare(`INSERT INTO university_certificate_requests
    (id, full_name, email, mobile_phone, group_name, diploma_version, payment_status, tasks_status, request_type, request_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, fullName, requesterEmail, mobilePhone, groupName, diplomaVersion, paymentStatus, tasksStatus, requestType, requestNotes).run();
  await audit("public-certificate-form", "university_certificate_requested", id, { diplomaVersion, paymentStatus, tasksStatus, requestType });
  return { ok: true, id };
}

export async function listUniversityContent(adminView = false, profile?: PortalProfile) {
  await ensureUniversityContent();
  await ensureDpl2026Content();
  await ensureOfficialTaskForm();
  if (adminView) {
    if (!profile) throw new PortalError("Inicia sesión para continuar.", 401);
    requireAdmin(profile);
  }
  const where = adminView ? "" : "WHERE status = 'published'";
  const [programs, modules, materials, settings] = await Promise.all([
    db().prepare(`SELECT * FROM university_programs ${where} ORDER BY sort_order, created_at`).all<Record<string, unknown>>(),
    db().prepare(`SELECT * FROM university_modules ${where} ORDER BY program_id, sort_order, created_at`).all<Record<string, unknown>>(),
    db().prepare(`SELECT * FROM university_materials ${where} ORDER BY program_id, sort_order, created_at`).all<Record<string, unknown>>(),
    db().prepare("SELECT key, value FROM content_settings WHERE key LIKE 'university.%' AND key <> 'university.recognitionCost'").all<Record<string, unknown>>(),
  ]);
  const values: Record<string, string> = {};
  for (const row of settings.results ?? []) values[String(row.key).replace("university.", "")] = String(row.value ?? "");
  return { programs: programs.results ?? [], modules: modules.results ?? [], materials: materials.results ?? [], settings: values };
}

export async function saveUniversityContent(profile: PortalProfile, input: Record<string, unknown>) {
  requireAdmin(profile);
  await ensureUniversityContent();
  const kind = clean(input.kind, 30);
  if (kind === "settings") {
    const statements = SETTING_KEYS.map((key) => db().prepare(
      "INSERT INTO content_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
    ).bind(`university.${key}`, clean(input[key], key === "taskUrl" ? 1000 : 240)));
    await db().batch(statements);
    await audit(profile.email, "university_settings_updated", "settings", { keys: SETTING_KEYS });
    return { ok: true, kind };
  }
  const status = clean(input.status, 20) || "published";
  if (!CONTENT_STATUSES.has(status)) throw new PortalError("Selecciona un estado válido.");
  const sortOrder = Math.max(0, Math.min(9999, Number(input.sortOrder) || 0));
  if (kind === "program") {
    const id = clean(input.id, 80) || `UNI-PROG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const title = clean(input.title, 180); const generation = clean(input.generation, 40); const description = clean(input.description, 2000);
    if (!title) throw new PortalError("Escribe el título del diplomado.");
    await db().prepare(`INSERT INTO university_programs (id, title, generation, description, status, sort_order, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, generation = excluded.generation,
      description = excluded.description, status = excluded.status, sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP`)
      .bind(id, title, generation, description, status, sortOrder, profile.email).run();
    await audit(profile.email, "university_program_saved", id, { title, generation, status });
    return { ok: true, kind, id };
  }
  if (kind === "module") {
    const id = clean(input.id, 100) || `UNI-MOD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const programId = clean(input.programId, 80); const title = clean(input.title, 180); const videoUrl = safeUrl(input.videoUrl);
    if (!programId || !title) throw new PortalError("Selecciona el diplomado y escribe el título del video.");
    await db().prepare(`INSERT INTO university_modules (id, program_id, title, video_url, status, sort_order, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET program_id = excluded.program_id, title = excluded.title,
      video_url = excluded.video_url, status = excluded.status, sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP`)
      .bind(id, programId, title, videoUrl, status, sortOrder, profile.email).run();
    await audit(profile.email, "university_module_saved", id, { programId, title, status });
    return { ok: true, kind, id };
  }
  if (kind === "material") {
    const id = clean(input.id, 100) || `UNI-MAT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const programId = clean(input.programId, 80) || null; const title = clean(input.title, 180); const description = clean(input.description, 2000); const resourceUrl = safeUrl(input.resourceUrl); const resourceType = clean(input.resourceType, 40) || "material";
    if (!title) throw new PortalError("Escribe el título del material.");
    await db().prepare(`INSERT INTO university_materials (id, program_id, title, description, resource_url, resource_type, status, sort_order, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET program_id = excluded.program_id, title = excluded.title,
      description = excluded.description, resource_url = excluded.resource_url, resource_type = excluded.resource_type,
      status = excluded.status, sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP`)
      .bind(id, programId, title, description, resourceUrl, resourceType, status, sortOrder, profile.email).run();
    await audit(profile.email, "university_material_saved", id, { programId, title, status });
    return { ok: true, kind, id };
  }
  throw new PortalError("Selecciona un tipo de contenido válido.");
}

export async function listUniversityAdmin(profile: PortalProfile) {
  requireAdmin(profile);
  const [users, centerBatches, certificateRequests, content] = await Promise.all([
    db().prepare("SELECT * FROM university_users ORDER BY created_at DESC LIMIT 500").all<Record<string, unknown>>(),
    db().prepare("SELECT * FROM university_center_batches ORDER BY created_at DESC LIMIT 250").all<Record<string, unknown>>(),
    db().prepare("SELECT * FROM university_certificate_requests ORDER BY created_at DESC LIMIT 250").all<Record<string, unknown>>(),
    listUniversityContent(true, profile),
  ]);
  return { users: users.results ?? [], centerBatches: centerBatches.results ?? [], certificateRequests: certificateRequests.results ?? [], content };
}

export async function addUniversityUser(profile: PortalProfile, input: Record<string, unknown>) {
  requireAdmin(profile);
  return registerUniversityUser(input, profile.email, "admin_manual");
}

export async function updateUniversityRecord(profile: PortalProfile, input: Record<string, unknown>) {
  requireAdmin(profile);
  const kind = clean(input.kind, 30);
  const id = clean(String(input.id ?? ""), 80);
  const status = clean(input.status, 30);
  const adminNotes = clean(input.adminNotes, 3000);
  const designCompleted = input.designCompleted === true || input.designCompleted === "true" ? 1 : 0;
  const sentToContact = input.sentToContact === true || input.sentToContact === "true" ? 1 : 0;
  if (!id) throw new PortalError("Selecciona un registro válido.");
  let table: string;
  let allowed: Set<string>;
  if (kind === "user") { table = "university_users"; allowed = USER_STATUSES; }
  else if (kind === "center") { table = "university_center_batches"; allowed = REQUEST_STATUSES; }
  else if (kind === "certificate") { table = "university_certificate_requests"; allowed = CERTIFICATE_STATUSES; }
  else throw new PortalError("El tipo de registro no es válido.");
  if (!allowed.has(status)) throw new PortalError("Selecciona un estado válido.");
  const idColumn = kind === "user" ? "id" : "id";
  const sql = kind === "certificate"
    ? `UPDATE ${table} SET status = ?, admin_notes = ?, design_completed = ?, sent_to_contact = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE ${idColumn} = ?`
    : `UPDATE ${table} SET status = ?, design_completed = ?, sent_to_contact = ?, updated_at = CURRENT_TIMESTAMP WHERE ${idColumn} = ?`;
  const result = kind === "certificate"
    ? await db().prepare(sql).bind(status, adminNotes, designCompleted, sentToContact, profile.email, id).run()
    : await db().prepare(sql).bind(status, designCompleted, sentToContact, id).run();
  if (!result.meta.changes) throw new PortalError("El registro no existe.", 404);
  await audit(profile.email, "university_record_updated", id, { kind, status, designCompleted: Boolean(designCompleted), sentToContact: Boolean(sentToContact), notesChanged: Boolean(adminNotes) });
  return { ok: true, kind, id, status, designCompleted: Boolean(designCompleted), sentToContact: Boolean(sentToContact) };
}
