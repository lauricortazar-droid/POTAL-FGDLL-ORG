"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import publicData from "../public-directory-data.json";
import { groupHref, locationParts, type PublicGroup, whatsappHref } from "../public-directory";
import "./style.css";

const zones = ["Jaguar", "Tiburón", "Delfín", "Colibrí", "Águila"];
const initialGroups = publicData.grupos as PublicGroup[];

function mapsDestination(group: PublicGroup) {
  return [group.address, group.city].filter(Boolean).join(", ");
}

export default function MapaPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("");
  const [state, setState] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"mapa" | "lista">("lista");
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    let alive = true;
    fetch("/api/directory", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (alive && Array.isArray(data.groups)) setGroups(data.groups); })
      .catch(() => { if (alive) setMessage("Mostramos la última copia disponible del directorio. Confirma los datos antes de acudir."); });
    return () => { alive = false; };
  }, []);

  const states = useMemo(() => [...new Set(groups.map((group) => locationParts(group.city).state))]
    .filter((value) => value !== "Sin especificar").sort((a, b) => a.localeCompare(b, "es")), [groups]);
  const results = useMemo(() => groups.filter((group) => {
    const haystack = `${group.name} ${group.zone} ${group.city} ${group.address}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const needle = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return (!needle || haystack.includes(needle)) && (!zone || group.zone === zone)
      && (!state || locationParts(group.city).state === state);
  }), [groups, query, zone, state]);
  const selected = results.find((group) => group.id === selectedId) ?? null;
  const destination = selected ? mapsDestination(selected) : "";

  function useLocation() {
    if (!navigator.geolocation) { setMessage("Tu navegador no permite obtener la ubicación. Busca por ciudad o estado."); return; }
    setMessage("Solicitando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMessage("Google Maps mostrará grupos cerca de ti. Comprueba que aparezcan en este directorio oficial antes de acudir.");
        window.open(`https://www.google.com/maps/search/Fraternidad+Guerreros+de+la+Luz/@${coords.latitude},${coords.longitude},12z`, "_blank", "noopener,noreferrer");
      },
      () => setMessage("No fue posible obtener tu ubicación. Puedes buscar por ciudad o estado."),
      { timeout: 10000 },
    );
  }

  return <div className="mapa-page">
    <header className="mapa-header"><Link href="/" className="mapa-brand"><img src="/logo-gdll.png" alt="Escudo de Guerreros de la Luz" /><span><b>FGDLL</b><small>Fraternidad Guerreros de la Luz</small></span></Link><Link href="/" className="mapa-home">Portal FGDLL</Link></header>
    <main className="mapa-main">
      <div className="mapa-intro"><span>Directorio oficial</span><h1>Encuentra un grupo</h1><p>Que nadie sufra solo. Busca un Grupo de Guerreros de la Luz y confirma los datos antes de tu visita.</p></div>
      <div className="mapa-controls">
        <label className="mapa-search">Buscar por nombre, colonia, ciudad o municipio<input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(20); setSelectedId(null); }} placeholder="Escribe el lugar o grupo" type="search" /></label>
        <label>Zona<select value={zone} onChange={(event) => { setZone(event.target.value); setSelectedId(null); }}><option value="">Todas las zonas</option>{zones.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Estado<select value={state} onChange={(event) => { setState(event.target.value); setSelectedId(null); }}><option value="">Todos los estados</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button className="mapa-location" type="button" onClick={useLocation}>⌖ Usar mi ubicación</button>
      </div>
      {message && <p role="status" className="mapa-message">{message}</p>}
      <div className="mapa-toolbar"><strong>{results.length} {results.length === 1 ? "grupo" : "grupos"}</strong><div className="mapa-toggle"><button aria-pressed={view === "lista"} onClick={() => setView("lista")}>Lista</button><button aria-pressed={view === "mapa"} onClick={() => setView("mapa")}>Mapa</button></div>{(query || zone || state) && <button className="mapa-clear" onClick={() => { setQuery(""); setZone(""); setState(""); setSelectedId(null); }}>Limpiar filtros</button>}</div>
      <div className={`mapa-workspace ${view === "mapa" ? "show-map" : "show-list"}`}>
        <div className="mapa-results" aria-label="Grupos encontrados">
          {results.length === 0 && <div className="mapa-empty"><h2>No encontramos grupos con estos filtros.</h2><button onClick={() => { setQuery(""); setZone(""); setState(""); }}>Limpiar filtros</button></div>}
          {results.slice(0, limit).map((group) => <article className={selected?.id === group.id ? "mapa-card active" : "mapa-card"} key={group.id}>
            <span>Zona {group.zone} · {locationParts(group.city).state}</span><h2>{group.name}</h2><p>{group.city || "Ciudad por confirmar"}</p><p className="mapa-hours"><b>Juntas:</b> {group.schedules || "Horario por confirmar"}</p><p className="mapa-address">{group.address || "Dirección por confirmar"}</p><small>{group.verifiedAt ? "Información verificada" : "Información pendiente de verificación"}</small>
            <div className="mapa-actions"><button type="button" onClick={() => { setSelectedId(group.id); setView("mapa"); }}>Ver en mapa</button><Link href={groupHref(group)}>Ver grupo</Link>{(group.mapsUrl || mapsDestination(group)) && <a target="_blank" rel="noreferrer" href={group.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsDestination(group))}`}>Cómo llegar</a>}</div>
          </article>)}
          {results.length > limit && <button className="mapa-more" onClick={() => setLimit(limit + 20)}>Mostrar más grupos</button>}
        </div>
        <section className="mapa-map" aria-label="Mapa de Google Maps">
          {selected && destination ? <><iframe title={`Mapa de ${selected.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`} /><div className="mapa-map-caption"><b>{selected.name}</b><span>{destination}</span>{selected.whatsapp && <a href={whatsappHref(selected.whatsapp)} target="_blank" rel="noreferrer">Confirmar por WhatsApp</a>}</div></> : <div className="mapa-map-empty"><img src="/logo-gdll.png" alt="" /><h2>{selected ? "Ubicación por confirmar" : "Elige un grupo para verlo en Google Maps"}</h2><p>{selected ? "Este grupo aún no tiene una dirección pública suficiente para ubicarlo. Consulta su ficha o contacta al responsable." : "Los grupos sin ubicación confirmada siguen disponibles en la lista."}</p></div>}
        </section>
      </div>
    </main>
    <nav className="mapa-bottom" aria-label="Navegación del mapa"><button onClick={() => setView("mapa")} aria-current={view === "mapa" ? "page" : undefined}>Mapa</button><button onClick={() => setView("lista")} aria-current={view === "lista" ? "page" : undefined}>Grupos</button><button onClick={useLocation}>Cerca de mí</button><Link href="/#directorio">Información</Link></nav>
  </div>;
}
