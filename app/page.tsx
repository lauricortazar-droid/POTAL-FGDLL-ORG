"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import calendarData from "./calendar-data.json";
import { ExperienceCalendar } from "./experiencias/experience-calendar";
import publicData from "./public-directory-data.json";
import {
  groupHref,
  locationParts,
  type PublicGroup,
  verificationLabel,
  whatsappHref,
  zoneHref,
  zoneMeta,
} from "./public-directory";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  url: string | null;
};
const initialGroups = publicData.grupos as PublicGroup[];
const agendaEvents = calendarData as CalendarEvent[];
const zoneNames = Object.keys(zoneMeta);

function dateFromYmd(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function previousDay(value: string) {
  const date = dateFromYmd(value);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shortMonth(value: string) {
  return new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" })
    .format(dateFromYmd(value))
    .replace(".", "");
}

function eventDate(event: CalendarEvent) {
  const allDay = !/(Z|[+-]\d{2}:\d{2})$/.test(event.start);
  const start = event.start.slice(0, 10);
  const end = allDay ? previousDay(event.end) : event.end.slice(0, 10);
  const startDay = Number(start.slice(8, 10));
  const endDay = Number(end.slice(8, 10));
  if (start === end) return `${startDay} de ${shortMonth(start)}`;
  if (start.slice(0, 7) === end.slice(0, 7))
    return `${startDay}–${endDay} de ${shortMonth(start)}`;
  return `${startDay} de ${shortMonth(start)} – ${endDay} de ${shortMonth(end)}`;
}

function eventTime(event: CalendarEvent) {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(event.start)) return "Todo el día";
  const startTime = event.start.slice(11, 16);
  const endTime = event.end.slice(11, 16);
  if (event.start.slice(0, 10) === event.end.slice(0, 10))
    return `${startTime}–${endTime} h`;
  return `Inicia ${startTime} · termina ${endTime} h`;
}

function Logo() {
  return (
    <span className="brand-shield" aria-hidden="true">
      <img src="/logo-gdll.png" alt="" />
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="shell nav-shell">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <Logo />
          <span>
            <strong>FGDLL</strong>
            <small>Guerreros de la Luz</small>
          </span>
        </Link>
        <button
          className="menu-button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          className={open ? "main-nav open" : "main-nav"}
          aria-label="Navegación principal"
        >
          <Link
            className="nav-help"
            href="/ayuda-adicciones-merida"
            onClick={() => setOpen(false)}
          >
            Necesito ayuda
          </Link>
          <Link href="/mapa" onClick={() => setOpen(false)}>
            Encuentra un grupo
          </Link>
          <Link href="/centros" onClick={() => setOpen(false)}>
            Centros aliados
          </Link>
          <Link href="/experiencias" onClick={() => setOpen(false)}>
            Experiencias
          </Link>
          <a href="#agenda" onClick={() => setOpen(false)}>
            Agenda
          </a>
          <Link href="/formacion" onClick={() => setOpen(false)}>
            Formación
          </Link>
          <Link href="/etica" onClick={() => setOpen(false)}>
            Ética
          </Link>
          <Link href="/lider" onClick={() => setOpen(false)}>
            Portal del líder
          </Link>
          <Link
            className="button button-small nav-report-link"
            href="/etica#reporte"
            onClick={() => setOpen(false)}
          >
            Quiero levantar un reporte
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Finder({ groups }: { groups: PublicGroup[] }) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("Todas");
  const [state, setState] = useState("Todos");
  const [city, setCity] = useState("Todas");
  const [limit, setLimit] = useState(12);
  const [geoMessage, setGeoMessage] = useState("");

  const states = useMemo(
    () =>
      Array.from(
        new Set(groups.map((group) => locationParts(group.city).state)),
      )
        .filter((item) => item !== "Sin especificar")
        .sort((a, b) => a.localeCompare(b, "es")),
    [groups],
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          groups
            .filter(
              (group) =>
                state === "Todos" || locationParts(group.city).state === state,
            )
            .map((group) => locationParts(group.city).city),
        ),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [groups, state],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return groups.filter((group) => {
      const location = locationParts(group.city);
      const haystack =
        `${group.name} ${group.city} ${group.address} ${group.zone}`.toLocaleLowerCase(
          "es",
        );
      return (
        (zone === "Todas" || group.zone === zone) &&
        (state === "Todos" || location.state === state) &&
        (city === "Todas" || location.city === city) &&
        (!term || haystack.includes(term))
      );
    });
  }, [groups, query, zone, state, city]);

  function nearMe() {
    setGeoMessage("Buscando tu ubicación…");
    if (!navigator.geolocation) {
      setGeoMessage("Tu navegador no permite usar la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const url = `https://www.google.com/maps/search/Guerreros+de+la+Luz/@${coords.latitude},${coords.longitude},11z`;
        window.open(url, "_blank", "noopener,noreferrer");
        setGeoMessage("Abrimos un mapa alrededor de tu ubicación.");
      },
      () =>
        setGeoMessage(
          "No pudimos obtener tu ubicación. Usa los filtros de ciudad o estado.",
        ),
      { timeout: 8000 },
    );
  }

  return (
    <section className="section directory-section finder" id="directorio">
      <div className="shell">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Directorio público</span>
            <h2>Encuentra un grupo cerca de ti.</h2>
            <Link className="button button-gold" href="/mapa">Abrir mapa de grupos</Link>
          </div>
          <p>
            Consulta únicamente información autorizada para atención pública.
            Los datos personales de líderes y responsables permanecen
            protegidos.
          </p>
        </div>
        <div className="finder-panel">
          <label className="finder-search">
            <span>Buscar</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(12);
              }}
              placeholder="Nombre del grupo, ciudad o colonia"
            />
          </label>
          <label>
            <span>Estado</span>
            <select
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setCity("Todas");
                setLimit(12);
              }}
            >
              <option>Todos</option>
              {states.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Ciudad</span>
            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setLimit(12);
              }}
            >
              <option>Todas</option>
              {cities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Zona</span>
            <select
              value={zone}
              onChange={(event) => {
                setZone(event.target.value);
                setLimit(12);
              }}
            >
              <option>Todas</option>
              {zoneNames.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="near-button" type="button" onClick={nearMe}>
            <span aria-hidden="true">⌖</span> Cerca de mí
          </button>
        </div>
        {geoMessage && (
          <p className="geo-message" role="status">
            {geoMessage}
          </p>
        )}
        <div className="result-line">
          <span>
            <strong>{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "grupo encontrado" : "grupos encontrados"}
          </span>
          {(query ||
            zone !== "Todas" ||
            state !== "Todos" ||
            city !== "Todas") && (
            <button
              onClick={() => {
                setQuery("");
                setZone("Todas");
                setState("Todos");
                setCity("Todas");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="directory-grid">
          {filtered.slice(0, limit).map((group) => (
            <article className="group-card public-group-card" key={group.id}>
              <div className="group-top">
                <span className="zone-dot">
                  {zoneMeta[group.zone]?.icon ?? group.zone.charAt(0)}
                </span>
                <span>Zona {group.zone}</span>
                <small>{group.publicCode}</small>
              </div>
              <h3>{group.name}</h3>
              <p className="location">
                {group.city || "Ubicación por confirmar"}
              </p>
              <dl>
                {group.schedules && (
                  <div>
                    <dt>Juntas</dt>
                    <dd>{group.schedules}</dd>
                  </div>
                )}
                {group.address && (
                  <div>
                    <dt>Dirección</dt>
                    <dd>{group.address}</dd>
                  </div>
                )}
              </dl>
              <div
                className={`verification ${group.verifiedAt ? "verified" : "pending"}`}
              >
                <i />
                {verificationLabel(group.verifiedAt)}
              </div>
              <div className="card-actions primary-actions">
                {group.whatsapp && (
                  <a
                    href={whatsappHref(group.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
                {group.mapsUrl && (
                  <a href={group.mapsUrl} target="_blank" rel="noreferrer">
                    Cómo llegar
                  </a>
                )}
                <Link href={groupHref(group)}>Ver grupo</Link>
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <strong>No encontramos coincidencias.</strong>
            <span>
              Prueba con otra ciudad, estado o zona. Si necesitas orientación,
              podemos ayudarte a encontrar el camino más cercano.
            </span>
            <Link
              className="button button-gold"
              href="/ayuda-adicciones-merida#orientacion"
            >
              Pedir orientación
            </Link>
          </div>
        )}
        {limit < filtered.length && (
          <div className="center-action">
            <button
              className="button button-outline"
              onClick={() => setLimit(limit + 12)}
            >
              Mostrar más grupos
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CalendarAgenda() {
  const months = useMemo(
    () =>
      Array.from(new Set(agendaEvents.map((event) => event.start.slice(0, 7)))),
    [],
  );
  const [activeMonth, setActiveMonth] = useState(months[0] ?? "");
  const events = agendaEvents.filter((event) =>
    event.start.startsWith(activeMonth),
  );
  return (
    <section className="section calendar-section" id="agenda">
      <div className="shell">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Agenda FGDLL</span>
            <h2>Una sola agenda para toda la red.</h2>
          </div>
          <p>
            Eventos vigentes y próximos. La misma información alimenta la
            portada, las zonas y el portal de liderazgo.
          </p>
        </div>
        <div
          className="month-tabs"
          role="tablist"
          aria-label="Meses de la agenda"
        >
          {months.map((month) => (
            <button
              key={month}
              type="button"
              role="tab"
              aria-selected={activeMonth === month}
              className={activeMonth === month ? "active" : ""}
              onClick={() => setActiveMonth(month)}
            >
              {monthLabel(month)}
            </button>
          ))}
        </div>
        <div className="month-panel" role="tabpanel">
          <div className="month-heading">
            <h3>{monthLabel(activeMonth)}</h3>
            <span>
              {events.length} {events.length === 1 ? "evento" : "eventos"}
            </span>
          </div>
          <div className="event-list">
            {events.map((event, index) => (
              <article className="event-row" key={event.id}>
                <span className="event-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="event-when">
                  <time>{eventDate(event)}</time>
                  <span>{eventTime(event)}</span>
                </div>
                <div className="event-main">
                  <h3>{event.title}</h3>
                  {event.location && (
                    <p className="event-location">⌖ {event.location}</p>
                  )}
                </div>
                {event.url ? (
                  <a
                    className="event-link"
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir ${event.title} en Google Calendar`}
                  >
                    ↗
                  </a>
                ) : (
                  <span />
                )}
              </article>
            ))}
          </div>
        </div>
        <p className="calendar-source">
          Fuente única: AGENDA FGDLL · Actualización institucional.
        </p>
      </div>
    </section>
  );
}

const publicResources = [
  ["IPE", "Instituto Punto Evolutivo: preparatoria, universidad y formación aliada.", "/ipe"],
  ["Consejería", "Acompañamiento y orientación en adicciones para familias y grupos.", "/consejero"],
  ["Psicología TRASCENDE", "Atención psicológica integral como recurso aliado.", "/psic"],
  ["Ética", "Canal institucional para conocer principios y levantar reportes.", "/etica"],
  ["Portal del líder", "Acceso a servicio, formación, documentos y acuses de junta.", "/lider"],
  ["Edúcate", "Información básica para comprender la adicción y pedir ayuda.", "/ayuda-adicciones-merida#faq"],
  ["Modelos de intervención", "Rutas de apoyo sin prometer soluciones mágicas.", "/ayuda-adicciones-merida#modelos"],
];

function PublicResources() {
  return (
    <section className="section public-resource-section" id="recursos-publicos">
      <div className="shell">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Recursos públicos</span>
            <h2>Orientación, educación y canales institucionales.</h2>
          </div>
          <p>
            La parte pública se concentra en ayuda rápida, directorios y recursos
            aliados para decidir el siguiente paso.
          </p>
        </div>
        <div className="public-resource-grid">
          {publicResources.map(([title, text, href]) => (
            <Link href={href} key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <b>Abrir →</b>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Logo />
          <div>
            <strong>Fraternidad Guerreros de la Luz A.C.</strong>
            <span>Que nadie sufra solo.</span>
          </div>
        </div>
        <div className="footer-links">
          <Link href="/ayuda-adicciones-merida">Necesito ayuda</Link>
          <Link href="/mapa">Mapa y directorio</Link>
          <Link href="/centros">Centros aliados</Link>
          <Link href="/etica">Ética</Link>
          <Link href="/lider">Portal del líder</Link>
          <Link href="/ipe">IPE</Link>
        </div>
        <p>
          © 2026 FGDLL
          <br />
          Información institucional.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  const [groups, setGroups] = useState(initialGroups);
  useEffect(() => {
    let active = true;
    fetch("/api/directory", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((result) => {
        if (active && Array.isArray(result.groups) && result.groups.length)
          setGroups(result.groups);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const counts = groups.reduce<Record<string, number>>((acc, group) => {
    acc[group.zone] = (acc[group.zone] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Header />
      <main>
        <section className="public-hero family-entry-hero" id="inicio">
          <div className="hero-orb hero-orb-one" />
          <div className="shell public-hero-grid">
            <div className="public-hero-copy">
              <span className="eyebrow light">
                Orientación para familias · Mérida y Yucatán
              </span>
              <h1>¿Buscas ayuda para un familiar con adicciones en Mérida?</h1>
              <p>
                No tienes que resolverlo todo hoy ni hacerlo solo. En Guerreros
                de la Luz podemos escucharte, ayudarte a entender la situación y
                orientarte hacia una alternativa adecuada.
              </p>
              <div className="hero-actions">
                <Link
                  className="button button-gold"
                  href="/ayuda-adicciones-merida#orientacion"
                >
                  Hablar con un orientador
                </Link>
                <Link
                  className="button button-ghost"
                  href="/ayuda-adicciones-merida#centros-relacion"
                >
                  Conocer los centros
                </Link>
                <Link
                  className="hero-emergency-button"
                  href="/ayuda-adicciones-merida#emergencia"
                >
                  ¿Es una emergencia?
                </Link>
              </div>
              <div className="hero-direct-contact" aria-label="Contacto directo con FGDLL">
                <span>También puedes comunicarte directamente:</span>
                <a href="https://wa.me/529995481194?text=Hola%2C%20necesito%20orientaci%C3%B3n%20de%20Guerreros%20de%20la%20Luz" target="_blank" rel="noopener noreferrer">WhatsApp · 999 548 1194</a>
                <a href="tel:+529995481194">Llamar · 999 548 1194</a>
              </div>
              <p className="hero-boundary">
                FGDLL no es un centro residencial. Somos una fraternidad de
                ayuda y orientación que trabaja en coordinación con distintos
                centros.
              </p>
              <div className="public-trust">
                <span>
                  <b>{groups.length}</b> grupos en el directorio
                </span>
                <span>
                  <b>5</b> zonas
                </span>
                <span>
                  <b>18</b> años de historia
                </span>
              </div>
            </div>
            <aside className="first-time-card emergency-first-card">
              <span>PRIMERO: SEGURIDAD</span>
              <h2>¿Existe un peligro inmediato?</h2>
              <p>
                Si la persona no responde, tiene dificultad para respirar,
                convulsiones, posible sobredosis, violencia activa o alguien
                está en peligro, llama al 911.
              </p>
              <a href="tel:911">
                Llamar al 911 <b>→</b>
              </a>
              <Link href="/ayuda-adicciones-merida#emergencia">
                Revisar otras señales de urgencia <b>→</b>
              </Link>
            </aside>
          </div>
        </section>

        <section className="help-paths">
          <div className="shell">
            <div>
              <span>NECESITO APOYO</span>
              <h2>Da el primer paso que sí puedes dar hoy.</h2>
            </div>
            <div className="help-path-grid">
              <Link href="/necesito-orientacion#para-mi">
                <b>01</b>
                <strong>Busco ayuda para mí</strong>
                <span>Hablar y encontrar un grupo →</span>
              </Link>
              <Link href="/ayuda-adicciones-merida">
                <b>02</b>
                <strong>Busco ayuda para alguien que quiero</strong>
                <span>Orientación segura para la familia →</span>
              </Link>
              <Link href="/ayuda-adicciones-merida#orientacion">
                <b>03</b>
                <strong>No sé qué tipo de ayuda necesita</strong>
                <span>Solicitar orientación →</span>
              </Link>
            </div>
          </div>
        </section>

        <Finder groups={groups} />
        <PublicResources />

        <section className="section network-map" id="mapa">
          <div className="shell">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow light">Mapa nacional</span>
                <h2>Cinco zonas. Una sola fraternidad.</h2>
              </div>
              <p>
                Explora cada zona, consulta sus grupos y abre la ubicación
                registrada para llegar sin perderte.
              </p>
            </div>
            <div className="national-map-board">
              <div className="map-core">
                <Logo />
                <strong>FGDLL</strong>
                <span>Red nacional</span>
              </div>
              {zoneNames.map((zone, index) => (
                <Link
                  key={zone}
                  href={zoneHref(zone)}
                  className={`map-zone map-zone-${index + 1}`}
                >
                  <span>{zoneMeta[zone].icon}</span>
                  <div>
                    <small>ZONA</small>
                    <strong>{zone}</strong>
                    <em>{counts[zone] ?? 0} grupos</em>
                  </div>
                  <b>→</b>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ExperienceCalendar />
        <CalendarAgenda />

        <section className="section history-section" id="conocenos">
          <div className="shell history-grid">
            <div>
              <span className="history-number">18</span>
              <small>AÑOS CAMINANDO JUNTOS</small>
            </div>
            <div>
              <span className="eyebrow">Conócenos</span>
              <h2>
                Una historia hecha de personas que decidieron volver por alguien
                más.
              </h2>
              <p>
                Guerreros de la Luz nació en 2008 con una convicción sencilla:
                el dolor no debe vivirse en soledad. Hoy seguimos abriendo
                espacios de recuperación, servicio, formación y comunidad.
              </p>
              <Link className="button button-outline" href="/etica">
                Conocer nuestros principios
              </Link>
            </div>
          </div>
        </section>

        <section className="closing public-closing">
          <div className="shell">
            <span className="eyebrow light">Aquí comienza el camino</span>
            <h2>No tienes que resolver toda tu vida hoy.</h2>
            <p>Solo necesitas dar un primer paso acompañado.</p>
            <div className="hero-actions">
              <a className="button button-gold" href="#directorio">
                Encontrar un grupo
              </a>
                <Link className="button button-ghost" href="/ayuda-adicciones-merida#orientacion">
                Contáctenme
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
