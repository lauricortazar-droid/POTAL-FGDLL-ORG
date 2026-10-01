"use client";

import { FormEvent, useEffect, useState } from "react";

export type ContentRow = Record<string, string | number>;
export type ContentData = { programs: ContentRow[]; modules: ContentRow[]; materials: ContentRow[]; settings: Record<string, string> };
type Kind = "program" | "module" | "material" | "settings";

async function parse(response: Response) { const data = await response.json(); if (!response.ok) throw new Error(data.error || "No fue posible guardar el contenido."); return data; }

export function UniversityContentManager({ content, reload }: { content: ContentData; reload: () => Promise<void> }) {
  const [kind, setKind] = useState<Kind>("program");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Record<string, string>>(content.settings || {});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => setSettings(content.settings || {}), [content.settings]);

  function start(type: Kind, item?: ContentRow) {
    setKind(type); setMessage("");
    if (!item) { setDraft({}); return; }
    const normalized = Object.fromEntries(Object.entries(item).map(([key, value]) => [key, String(value ?? "")]));
    setDraft({
      ...normalized,
      programId: String(item.program_id ?? ""),
      videoUrl: String(item.video_url ?? ""),
      resourceUrl: String(item.resource_url ?? ""),
      resourceType: String(item.resource_type ?? "material"),
      sortOrder: String(item.sort_order ?? 10),
    });
  }
  function update(field: string, value: string) {
    const legacy = { programId: "program_id", videoUrl: "video_url", resourceUrl: "resource_url", resourceType: "resource_type", sortOrder: "sort_order" }[field];
    setDraft((current) => ({ ...current, ...(legacy ? { [legacy]: "" } : {}), [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const body = kind === "settings" ? { kind, ...settings } : { kind, ...draft };
    try { await fetch("/api/admin/university", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(parse); setMessage("Contenido guardado y listo para publicarse en Formación."); if (kind !== "settings") setDraft({}); await reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible guardar el contenido."); }
    finally { setBusy(false); }
  }

  return <div className="uni-content-manager"><div className="uni-content-menu"><button className={kind === "program" ? "active" : ""} onClick={() => start("program")}>Diplomados</button><button className={kind === "module" ? "active" : ""} onClick={() => start("module")}>Videos</button><button className={kind === "material" ? "active" : ""} onClick={() => start("material")}>Materiales</button><button className={kind === "settings" ? "active" : ""} onClick={() => start("settings")}>Datos generales</button></div>{message && <div className="admin-message">{message}</div>}
    <div className="uni-content-layout"><section><div className="panel-section-head"><div><span>CONTENIDO ACTUAL</span><h2>{kind === "program" ? "Diplomados" : kind === "module" ? "Videos y módulos" : kind === "material" ? "Materiales y enlaces" : "Información operativa"}</h2></div></div>{kind === "program" && <div className="uni-content-list">{content.programs.map((item) => <article key={item.id}><div><small>{item.generation} · {item.status}</small><h3>{item.title}</h3><p>{item.description}</p></div><button onClick={() => start("program", item)}>Editar</button></article>)}</div>}{kind === "module" && <div className="uni-content-list">{content.modules.map((item) => <article key={item.id}><div><small>{item.program_id} · orden {item.sort_order} · {item.status}</small><h3>{item.title}</h3><a href={String(item.video_url)} target="_blank" rel="noreferrer">Abrir video ↗</a></div><button onClick={() => start("module", item)}>Editar</button></article>)}</div>}{kind === "material" && <div className="uni-content-list">{content.materials.map((item) => <article key={item.id}><div><small>{item.program_id || "General"} · {item.resource_type} · {item.status}</small><h3>{item.title}</h3><a href={String(item.resource_url)} target="_blank" rel="noreferrer">Abrir recurso ↗</a></div><button onClick={() => start("material", item)}>Editar</button></article>)}</div>}{kind === "settings" && <div className="uni-settings-summary"><p>Estos datos alimentan el contacto, los reconocimientos, las transferencias y la entrega de tareas.</p></div>}</section>
      <aside><form className="report-form" onSubmit={save}>{kind === "program" && <><h3>{draft.id ? "Editar diplomado" : "Nuevo diplomado"}</h3><label>Título<input value={draft.title || ""} onChange={(event) => update("title", event.target.value)} required /></label><label>Generación<input value={draft.generation || ""} onChange={(event) => update("generation", event.target.value)} placeholder="Ej. 2026" /></label><label>Descripción<textarea value={draft.description || ""} onChange={(event) => update("description", event.target.value)} rows={5} /></label><ContentControls draft={draft} update={update} /></>}{kind === "module" && <><h3>{draft.id ? "Editar video" : "Nuevo video"}</h3><label>Diplomado<select value={draft.program_id || draft.programId || ""} onChange={(event) => update("programId", event.target.value)} required><option value="">Selecciona</option>{content.programs.filter((item) => item.status !== "archived").map((item) => <option key={item.id} value={item.id}>{item.title} · {item.generation}</option>)}</select></label><label>Título del módulo o video<input value={draft.title || ""} onChange={(event) => update("title", event.target.value)} required /></label><label>Enlace del video<input type="url" value={draft.video_url || draft.videoUrl || ""} onChange={(event) => update("videoUrl", event.target.value)} required placeholder="https://youtube.com/…" /></label><ContentControls draft={draft} update={update} /></>}{kind === "material" && <><h3>{draft.id ? "Editar material" : "Nuevo material"}</h3><label>Diplomado<select value={draft.program_id || draft.programId || ""} onChange={(event) => update("programId", event.target.value)}><option value="">Material general</option>{content.programs.filter((item) => item.status !== "archived").map((item) => <option key={item.id} value={item.id}>{item.title} · {item.generation}</option>)}</select></label><label>Título<input value={draft.title || ""} onChange={(event) => update("title", event.target.value)} required /></label><label>Descripción<textarea value={draft.description || ""} onChange={(event) => update("description", event.target.value)} rows={4} /></label><label>Enlace del recurso (.html, PDF o web)<input type="url" value={draft.resource_url || draft.resourceUrl || ""} onChange={(event) => update("resourceUrl", event.target.value)} required placeholder="https://…/cuadernillo.html o https://…/archivo.pdf" /></label><label>Tipo de recurso<select value={draft.resource_type || draft.resourceType || "material"} onChange={(event) => update("resourceType", event.target.value)}><option value="digital_workbook">Cuadernillo digital (.html)</option><option value="workbook_pdf">Cuadernillo en PDF</option><option value="anthology_pdf">Antología en PDF</option><option value="material">Otro material</option><option value="guide">Guía</option><option value="assignment">Entrega de tareas</option><option value="form">Formulario</option><option value="document">Documento</option></select></label><ContentControls draft={draft} update={update} /></>}{kind === "settings" && <><h3>Datos generales</h3><label>Teléfono Formación<input value={settings.phone || ""} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} /></label><label>Enlace para entregar tareas<input value={settings.taskUrl || ""} onChange={(event) => setSettings((current) => ({ ...current, taskUrl: event.target.value }))} /></label><label>Titular SPIN<input value={settings.spinHolder || ""} onChange={(event) => setSettings((current) => ({ ...current, spinHolder: event.target.value }))} /></label><label>CLABE SPIN<input value={settings.spinClabe || ""} onChange={(event) => setSettings((current) => ({ ...current, spinClabe: event.target.value }))} /></label><label>Código de depósito<input value={settings.spinDepositCode || ""} onChange={(event) => setSettings((current) => ({ ...current, spinDepositCode: event.target.value }))} /></label></>}<button className="button button-gold" disabled={busy}>{busy ? "Guardando…" : draft.id ? "Guardar cambios" : kind === "settings" ? "Guardar datos" : "Agregar y publicar"}</button>{draft.id && <button type="button" className="button button-outline" onClick={() => setDraft({})}>Cancelar edición</button>}</form></aside></div>
  </div>;
}

function ContentControls({ draft, update }: { draft: Record<string, string>; update: (field: string, value: string) => void }) {
  return <div className="content-controls"><label>Orden<input type="number" min="0" value={draft.sort_order || draft.sortOrder || "10"} onChange={(event) => update("sortOrder", event.target.value)} /></label><label>Estado<select value={draft.status || "published"} onChange={(event) => update("status", event.target.value)}><option value="published">Publicado</option><option value="draft">Borrador</option><option value="archived">Archivado</option></select></label></div>;
}
