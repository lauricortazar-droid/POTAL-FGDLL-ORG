"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SubFooter, SubHeader } from "../section-shell";

type Profile = { name: string; email: string; role: string; roleLabel: string; zone: string | null; groupId: number | null } | null;

const options = [
  { title: "Acuses de Junta", text: "Leer documentos, firmar de enterado y consultar tus comprobantes.", href: "/lider/acuses" },
  { title: "Mi Servicio", text: "Avisos, acuerdos, datos y transparencia.", href: "/lider#mi-servicio" },
  { title: "Centro de Operaciones", text: "Formatos, protocolos y solicitudes.", href: "/lider#operaciones" },
  { title: "Formación", text: "Diplomados, aula y reconocimientos.", href: "/formacion" },
  { title: "Biblioteca de la Luz", text: "Materiales para coordinar, formar y cuidar.", href: "/lider#biblioteca" },
  { title: "Herramientas FGDLL", text: "Marca, testimonios y propuestas de edición.", href: "/herramientas" },
  { title: "Direcciones FGDLL", text: "Afiliación, recursos humanos, normatividad y hacienda.", href: "/lider#direcciones" },
  { title: "Testimonios", text: "Consultar la lista de testimonios.", href: "/testimonios" },
  { title: "Reportes", text: "Levantar un reporte identificado.", href: "/lider#reportes" },
  { title: "Solicitud de lonas", text: "Pedir lonas para tu grupo o zona.", href: "/lider#lonas" },
  { title: "Actualizar datos", text: "Enviar propuestas de grupo, centro, agenda o experiencia.", href: "/lider#propuestas" },
  { title: "Mi grupo", text: "Revisar ficha pública y datos de contacto.", href: "/directorio/gestion" },
  { title: "Padrinos y coordinadores", text: "Registrar el equipo operativo de mi grupo.", href: "/lider#equipo" },
  { title: "Admin", text: "Editar, eliminar y agregar contenido de todo el portal.", href: "/administracion" },
];

const proposalAreas = [
  ["Datos de grupo", "/directorio/gestion"],
  ["Datos de centro", "/centros/acceso"],
  ["Datos de agenda", "/lider#reportes"],
  ["Datos de experiencia", "/lider#reportes"],
  ["Propuesta de temas", "/lider#reportes"],
  ["Materiales", "/lider#reportes"],
];

const directionBlocks = [
  ["Afiliación", "Registrarme por primera vez o actualizar mis datos como grupo oficial.", "/lider#afiliacion"],
  ["Recursos Humanos", "Registrar padrinos y coordinadores del grupo.", "/lider#equipo"],
  ["Normatividad", "Reglamentos, autonomías, manuales y formatos.", "/lider#normatividad"],
  ["Hacienda", "Escrituras, seguimientos y sugerencias.", "/lider#hacienda"],
];

async function jsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No fue posible completar la operación.");
  return data;
}

function fields(event: FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(event.currentTarget).entries());
}

export default function LiderPage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/portal/me", { cache: "no-store" })
      .then(jsonResponse)
      .then((data) => { if (active) setProfile(data.profile ?? null); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>, kind: string, build: (data: Record<string, FormDataEntryValue>) => Record<string, unknown>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = build(fields(event));
    setBusy(kind);
    setMessage("");
    setError("");
    try {
      const result = await fetch("/api/leader/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).then(jsonResponse);
      form.reset();
      setMessage(`Registro enviado con folio ${result.id}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible enviar el registro.");
    } finally {
      setBusy("");
    }
  }

  return <>
    <SubHeader label="Líderes" />
    <main className="leader-page">
      <section className="leader-hero">
        <div className="shell leader-hero-grid">
          <div><span className="eyebrow light">Portal del líder</span><h1>Opciones para cuidar, actualizar y coordinar.</h1><p>Todo vive aquí: servicio, operaciones, formación, herramientas, direcciones y propuestas que Administración revisa antes de publicar.</p></div>
          <aside><span>PERFIL</span><strong>{profile?.roleLabel || "Usuario activo"}</strong><small>{profile?.name || profile?.email || "Portal FGDLL"}</small>{profile?.zone && <p>Zona {profile.zone}</p>}</aside>
        </div>
      </section>

      <section className="section leader-options"><div className="shell">
        <div className="section-heading split-heading"><div><span className="eyebrow">Accesos</span><h2>Lo que puede mirar un líder.</h2></div><p>Todo queda concentrado sin meter trámites donde solo necesitas consultar.</p></div>
        <div className="leader-option-grid">{options.map((item, index) => <Link key={item.title} href={item.href}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title === "Acuses de Junta" && <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H5v20h14V7Z M14 2v5h5 M8 14l3 3 6-6" /></svg>}{item.title}</h3><p>{item.text}</p><b>Abrir →</b></Link>)}</div>
      </div></section>

      <section className="section leader-service" id="mi-servicio"><div className="shell leader-section-grid">
        <div><span className="eyebrow">Mi Servicio</span><h2>Avisos, acuerdos y transparencia proactiva.</h2><p>Los líderes consultan y proponen; Administración conserva la última palabra antes de publicar cambios sensibles.</p></div>
        <div className="leader-mini-grid"><article id="avisos"><h3>Avisos</h3><p>Comunicados vigentes y pendientes por atender.</p></article><article id="acuerdos"><h3>Acuerdos</h3><p>Compromisos de servicio, responsables y seguimiento.</p></article><article><h3>Datos de mi grupo o centro</h3><p>Correcciones enviadas como propuesta para aprobación.</p></article><article><h3>Transparencia Proactiva</h3><p>Información operativa visible, trazable y actualizada.</p></article></div>
      </div></section>

      <section className="section leader-service alt" id="operaciones"><div className="shell leader-section-grid">
        <span id="propuestas" className="leader-anchor" aria-hidden="true" />
        <div><span className="eyebrow">Centro de Operaciones</span><h2>Formatos y solicitudes.</h2><p>Desde aquí se preparan reportes, lonas, agenda, experiencias y materiales para revisión administrativa.</p></div>
        <div className="leader-mini-grid">{proposalAreas.map(([title, href]) => <Link key={title} href={href}><h3>{title}</h3><p>Enviar propuesta para revisión.</p><b>Proponer →</b></Link>)}</div>
      </div></section>

      <section className="section leader-service" id="biblioteca"><div className="shell leader-section-grid">
        <div><span className="eyebrow">Biblioteca de la Luz</span><h2>Material para coordinar, formar y cuidar.</h2><p>Biblioteca por intención de uso: sesiones, formación, cuidado, testimonios y protocolos.</p></div>
        <div className="leader-mini-grid"><Link href="/testimonios"><h3>Testimonios FGDLL</h3><p>Base completa de temas y preguntas guía.</p><b>Abrir →</b></Link><Link href="/herramientas"><h3>Herramientas</h3><p>Marca de imágenes y propuestas de edición.</p><b>Abrir →</b></Link><Link href="/formacion"><h3>Formación</h3><p>Aula, diplomados y solicitudes.</p><b>Abrir →</b></Link><Link href="/recono"><h3>Reconocimientos</h3><p>Solicitud pública de reconocimientos.</p><b>Abrir →</b></Link></div>
      </div></section>

      <section className="section leader-service alt" id="direcciones"><div className="shell leader-section-grid">
        <div><span className="eyebrow">Direcciones FGDLL</span><h2>Afiliación, recursos humanos, normatividad y hacienda.</h2><p>La operación institucional queda ordenada por responsabilidad, con propuestas trazables y edición final desde Admin.</p></div>
        <div className="leader-mini-grid">{directionBlocks.map(([title, text, href]) => <Link key={title} href={href}><h3>{title}</h3><p>{text}</p><b>Abrir →</b></Link>)}</div>
      </div></section>

      <section className="section leader-forms" id="reportes"><div className="shell leader-form-grid">
        <div><span className="eyebrow">Reportes</span><h2>Reporte identificado.</h2><p>Este formulario no es anónimo. Tu cuenta queda ligada al folio para que administración pueda dar seguimiento.</p>{message && <div className="form-message ok">{message}</div>}{error && <div className="form-message error">{error}</div>}</div>
        <form className="report-form" onSubmit={(event) => submit(event, "report", (data) => ({ ...data, category: data.category || "operacion" }))}>
          <label>Categoría<select name="category" defaultValue="operacion"><option value="operacion">Operación</option><option value="integridad">Integridad</option><option value="finanzas">Finanzas</option><option value="seguridad">Seguridad</option><option value="acompanamiento">Acompañamiento</option></select></label>
          <div className="report-form-row"><label>Zona o grupo<input name="groupZone" maxLength={180} /></label><label>Fecha aproximada<input name="approximateDate" type="date" /></label></div>
          <label>Relato<textarea name="narrative" required minLength={30} maxLength={10000} rows={6} /></label>
          <label>Personas involucradas o testigos<textarea name="peopleOrWitnesses" maxLength={3000} rows={3} /></label>
          <label>Seguimiento<select name="supportNeeded" defaultValue="Seguimiento operativo"><option>Orientación</option><option>Protección inmediata</option><option>Revisión institucional</option><option>Seguimiento operativo</option></select></label>
          <label>Teléfono / WhatsApp<input name="phone" type="tel" inputMode="tel" /></label>
          <button className="button button-gold" disabled={busy === "report"}>{busy === "report" ? "Enviando…" : "Enviar reporte"}</button>
        </form>
      </div></section>

      <section className="section leader-requests"><div className="shell leader-request-grid">
        <form id="lonas" className="report-form" onSubmit={(event) => submit(event, "lona", (data) => ({ category: "operacion", supportNeeded: "Seguimiento operativo", phone: data.phone, groupZone: data.groupZone, narrative: `Solicitud de lonas. Medida/cantidad: ${data.size}. Uso: ${data.use}. Dirección o entrega: ${data.delivery}`, peopleOrWitnesses: "" }))}>
          <h3>Solicitud de lonas</h3><label>Grupo o zona<input name="groupZone" required /></label><label>Medida y cantidad<input name="size" required placeholder="Ej. 2 lonas de 2 x 1 m" /></label><label>Uso<textarea name="use" required rows={3} /></label><label>Entrega o dirección<textarea name="delivery" rows={3} /></label><label>Teléfono / WhatsApp<input name="phone" type="tel" inputMode="tel" /></label><button className="button button-gold" disabled={busy === "lona"}>{busy === "lona" ? "Enviando…" : "Solicitar lona"}</button>
        </form>
        <form id="equipo" className="report-form" onSubmit={(event) => submit(event, "equipo", (data) => ({ category: "acompanamiento", supportNeeded: "Seguimiento operativo", phone: data.phone, groupZone: data.groupZone, narrative: `Registro de padrinos y coordinadores. Padrinos: ${data.sponsors}. Coordinadores: ${data.coordinators}. Notas: ${data.notes}`, peopleOrWitnesses: `${data.sponsors}\n${data.coordinators}` }))}>
          <h3>Padrinos y coordinadores</h3><label>Grupo<input name="groupZone" required /></label><label>Padrinos<textarea name="sponsors" rows={4} placeholder="Un nombre por línea" /></label><label>Coordinadores<textarea name="coordinators" rows={4} placeholder="Un nombre por línea" /></label><label>Notas<textarea name="notes" rows={3} /></label><label>Teléfono / WhatsApp<input name="phone" type="tel" inputMode="tel" /></label><button className="button button-gold" disabled={busy === "equipo"}>{busy === "equipo" ? "Enviando…" : "Registrar equipo"}</button>
        </form>
      </div></section>

      <section className="leader-affiliation" id="afiliacion"><div className="shell"><span>AFILIACIÓN</span><h2>Grupo oficial de Guerreros de la Luz.</h2><p>Este espacio queda reservado para el registro formal de datos y dirección de afiliación.</p></div></section>
      <section className="leader-affiliation" id="normatividad"><div className="shell"><span>NORMATIVIDAD</span><h2>Reglamentos, autonomías, manuales y formatos.</h2><p>Los documentos se consultan en Biblioteca y Centro de Operaciones; las actualizaciones se envían como propuesta.</p></div></section>
      <section className="leader-affiliation" id="hacienda"><div className="shell"><span>HACIENDA</span><h2>Escrituras, seguimientos y sugerencias.</h2><p>Usa reportes identificados para dejar constancia de acuerdos, sugerencias y seguimiento operativo.</p></div></section>
    </main>
    <SubFooter />
  </>;
}
