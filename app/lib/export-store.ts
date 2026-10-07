import 'server-only';
import catalog from './export-catalog.json';
import {getRuntimeEnv} from './runtime-env';
import {PortalError,type PortalProfile,ensureDirectorySeeded} from './directory-store';
import {ensureContentSeeded} from './content-store';
import {ensureExperiencesSeeded} from './experience-store';
import {listUniversityContent} from './university-store';
import {listPublicCenters} from './center-store';
import calendar from '../calendar-data.json';
import type {ExportColumn} from './csv-export';
type Row=Record<string,unknown>;
type Dataset={id:string;title:string;category:string;table:string;columns:string[]};
const contactColumns=['owner_email','id','firstName','lastName','phone','countryCode','organization','group','zone','tags','notes','status','archived','createdAt','updatedAt','lastMessageAt'];
const extras:Dataset[]=[
 {id:'contactos',title:'Contactos de mensajería',category:'Contactos y mensajería',table:'@contacts',columns:contactColumns},
 {id:'listas-contactos',title:'Listas de contactos',category:'Contactos y mensajería',table:'@lists',columns:['owner_email','id','name','contactIds','createdAt','updatedAt']},
 {id:'plantillas-mensajes',title:'Plantillas de mensajes',category:'Contactos y mensajería',table:'@templates',columns:['owner_email','id','title','body','category','createdAt','updatedAt']},
 {id:'campanas',title:'Campañas y destinatarios',category:'Contactos y mensajería',table:'@campaigns',columns:['owner_email','campaign_id','title','message','place','createdAt','updatedAt','completedAt','id','contactId','firstName','lastName','phone','countryCode','organization','group','zone','status']},
 {id:'agenda',title:'Agenda institucional',category:'Agenda',table:'@calendar',columns:['id','title','start','end','location','url']},
 {id:'contactos-directorio',title:'Contactos de grupos, centros y usuarios',category:'Contactos y mensajería',table:'@directory-contacts',columns:['source','id','name','organization','zone','phone','whatsapp','email','city']},
];
const datasets:Dataset[]=[...catalog,...extras];
const leaderIds=new Set(['grupos','centros','contactos','listas-contactos','plantillas-mensajes','campanas','avisos','lecturas-avisos','materiales-lider','reportes-lider','testimonios','acuses','asignaciones-acuses','documentos-acuses','versiones-acuses','experiencias','agenda','programas','modulos','materiales-universidad','solicitudes-reconocimiento','solicitudes-acceso','cambios-grupos','altas-grupos','solicitudes-centros']);
const labels:Record<string,string>={id:'ID',name:'Nombre',full_name:'Nombre completo',firstName:'Nombre',lastName:'Apellidos',email:'Correo electrónico',phone:'Teléfono',mobile_phone:'Celular',countryCode:'Código de país',owner_email:'Responsable de los contactos',group:'Grupo',group_name:'Grupo / Centro',group_id:'ID de grupo',center_id:'ID de centro',role:'Rol',role_label:'Servicio',service_role:'Servicio',zone:'Zona',city:'Ciudad',state:'Estado / entidad',status:'Estado del registro',title:'Título',body:'Contenido',content:'Contenido de la versión',summary:'Resumen',description:'Descripción',folio:'Folio',public_folio:'Folio de seguimiento',document_id:'ID de documento',assignment_id:'ID de asignación',version_id:'ID de versión',version:'Versión',confirmed_at:'Confirmado (fecha y hora)',confirmed_version:'Versión confirmada',published_at:'Publicado (fecha y hora)',meeting_date:'Fecha de junta',due_at:'Fecha límite',opened_at:'Abierto (fecha y hora)',progress:'Lectura (%)',follow_up:'Seguimiento',user_email:'Correo del participante',user_id:'ID de usuario',created_at:'Creado (fecha y hora)',updated_at:'Actualizado (fecha y hora)',createdAt:'Creado (fecha y hora)',updatedAt:'Actualizado (fecha y hora)',assigned_at:'Asignado (fecha y hora)',created_by:'Creado por',updated_by:'Actualizado por',notes:'Notas',admin_notes:'Notas administrativas',category:'Categoría',audience:'Destinatarios',read_at:'Leído (fecha y hora)',revision:'Revisión',statement:'Texto del acuse',signature_url:'Enlace privado a firma',receipt_url:'Enlace al módulo de acuses',has_signature:'Firma registrada',ack_status:'Estado del acuse',address:'Dirección',maps_url:'Enlace a Google Maps',schedules:'Horarios',session_types:'Tipos de juntas',leader_name:'Líder',subleader_name:'Sublíder',whatsapp:'WhatsApp',facebook:'Facebook',network:'Red',responsible_name:'Responsable',services:'Servicios',website:'Sitio web',active:'Activo',requester_name:'Solicitante',requester_email:'Correo del solicitante',requester_phone:'Teléfono del solicitante',reporter_name:'Persona que reporta',reporter_email:'Correo de quien reporta',request_type:'Tipo de solicitud',payment_status:'Estado del pago del diplomado',tasks_status:'Avance de tareas',diploma_version:'Generación del diplomado',program:'Programa',year:'Año',sent_at:'Fecha de envío',printed_at:'Fecha de impresión',delivered_at:'Fecha de entrega',resource_url:'Enlace al recurso',video_url:'Enlace al video',organization:'Organización',tags:'Etiquetas',source:'Origen',url:'Enlace',start:'Inicio',end:'Fin',location:'Ubicación',month:'Mes',start_date:'Fecha de inicio',end_date:'Fecha de fin',carried_from:'ID de acuse conservado',participant_names_json:'Participantes',participant_count:'Cantidad de participantes',file_name:'Nombre de archivo',file_type:'Tipo de archivo',file_size:'Tamaño del archivo',static_url:'Enlace del recurso',preview_url:'Vista previa',payload_json:'Contenido estructurado',snapshot_json:'Registro histórico',details_json:'Detalles',proposed_json:'Cambios propuestos',original_json:'Datos originales',narrative:'Descripción de los hechos',safe_contact:'Contacto autorizado',contactIds:'IDs de contactos',campaign_id:'ID de campaña',contactId:'ID de contacto',message:'Mensaje',place:'Lugar',completedAt:'Completado',lastMessageAt:'Último mensaje',archived:'Archivado',archived_at:'Fecha de archivo'};
export function exportDataset(profile:PortalProfile,scope:string,id:string){
 if(!profile.active)throw new PortalError('Tu perfil no tiene acceso activo.',403);
 if(scope!=='admin'&&scope!=='leader')throw new PortalError('Ámbito de descarga inválido.');
 if(scope==='admin'&&profile.role!=='admin')throw new PortalError('Solo Administración puede descargar todos los datos.',403);
 const ds=datasets.find(d=>d.id===id);if(!ds||scope==='leader'&&!leaderIds.has(id))throw new PortalError('Esta sección no está disponible para tu perfil.',403);return ds;
}
export function exportCatalog(profile:PortalProfile,scope:string){
 exportDataset(profile,scope,'grupos');return datasets.filter(d=>scope==='admin'||leaderIds.has(d.id)).map(({id,title,category})=>({id,title,category}));
}
export function exportColumns(ds:Dataset,scope:string):ExportColumn[]{
 let keys=[...ds.columns];
 if(ds.id==='usuarios')keys.push('group_name','center_name');
 if(ds.id==='acuses')keys.push('user_email','document_id','title','version','published_at','confirmed_version','signature_url','receipt_url','has_signature');
 if(ds.id==='asignaciones-acuses')keys.push('title','version','folio','confirmed_at','confirmed_version','ack_status');
 if(scope==='leader')keys=keys.filter(k=>!['admin_notes','reviewer_email','review_note','created_by','updated_by'].includes(k));
 return keys.map(key=>({key,label:labels[key]||key.replaceAll('_',' ')}));
}
async function* sqlRows(sql:string,params:unknown[]=[]):AsyncGenerator<Row>{
 for(let offset=0;;offset+=500){const result=await getRuntimeEnv().DB.prepare(`${sql} LIMIT ? OFFSET ?`).bind(...params,500,offset).all<Row>();const rows=result.results??[];yield* rows;if(rows.length<500)break;}
}
export async function prepareExports(ids:string[]){
 if(ids.some(id=>['grupos','contactos-directorio'].includes(id)))await ensureDirectorySeeded();
 if(ids.some(id=>['centros','contactos-directorio'].includes(id)))await listPublicCenters();
 if(ids.some(id=>['materiales-lider','testimonios','avisos'].includes(id)))await ensureContentSeeded();
 if(ids.some(id=>['programas','modulos','materiales-universidad'].includes(id)))await listUniversityContent();
 if(ids.includes('experiencias'))await ensureExperiencesSeeded();
}
export async function* exportRows(profile:PortalProfile,scope:string,id:string,origin:string):AsyncGenerator<Row>{
 const ds=exportDataset(profile,scope,id),isAdmin=scope==='admin';
 if(ds.table==='@calendar'){yield* calendar;return;}
 if(ds.table==='@directory-contacts'){
  yield* sqlRows(`SELECT 'Grupo' source,id,leader_name name,name organization,zone,'' phone,whatsapp,email,city FROM directory_groups ORDER BY id`);
  yield* sqlRows(`SELECT 'Centro' source,id,responsible_name name,name organization,'' zone,phone,whatsapp,email,city FROM rehabilitation_centers ORDER BY id`);
  yield* sqlRows(`SELECT 'Usuario' source,id,name,'' organization,zone,phone,'' whatsapp,email,'' city FROM portal_users ORDER BY id`);return;
 }
 if(ds.table.startsWith('@')){
  const key=ds.table.slice(1);
  for await(const workspace of sqlRows(`SELECT owner_email,payload_json FROM distribution_workspaces ${isAdmin?'':'WHERE owner_email=?'} ORDER BY owner_email`,isAdmin?[]:[profile.email])){
   let state:Record<string,unknown>;try{state=JSON.parse(String(workspace.payload_json));}catch{throw new PortalError('No se pudo leer una sección de contactos. Descarga las otras secciones e intenta de nuevo.',503);}
   const values=state[key];if(!Array.isArray(values))continue;
   for(const value of values){if(!value||typeof value!=='object')continue;
    if(key==='campaigns'){const {recipients,...campaign}=value;const people=Array.isArray(recipients)&&recipients.length?recipients:[{}];for(const person of people)yield {...campaign,...person,campaign_id:campaign.id,owner_email:workspace.owner_email};}
    else yield {...value,owner_email:workspace.owner_email};
   }
  }return;
 }
 let from=`"${ds.table}" t`,where='',params:unknown[]=[],extra='';
 if(id==='usuarios'){from+=' LEFT JOIN directory_groups g ON g.id=t.group_id LEFT JOIN rehabilitation_centers c ON c.id=t.center_id';extra=',g.name group_name,c.name center_name';}
 if(id==='acuses'){from+=' JOIN ack_assignments a ON a.id=t.assignment_id JOIN ack_versions v ON v.id=a.version_id';extra=',a.user_email,v.document_id,v.title,v.version,v.version confirmed_version,v.published_at';if(!isAdmin){where='WHERE a.user_email=?';params=[profile.email];}}
 if(id==='asignaciones-acuses'){from+=' JOIN ack_versions v ON v.id=t.version_id LEFT JOIN acknowledgements r ON r.assignment_id=COALESCE(t.carried_from,t.id) LEFT JOIN ack_assignments ra ON ra.id=r.assignment_id LEFT JOIN ack_versions rv ON rv.id=ra.version_id';extra=`,v.title,v.version,r.folio,r.confirmed_at,rv.version confirmed_version,CASE WHEN r.id IS NOT NULL THEN 'ENTERADO' WHEN v.due_at IS NOT NULL AND v.due_at < date('now') THEN 'VENCIDO' WHEN t.opened_at IS NOT NULL THEN 'LEYENDO' ELSE 'PENDIENTE' END ack_status`;if(!isAdmin){where="WHERE t.user_email=? AND v.status='published'";params=[profile.email];}}
 if(!isAdmin){
  if(id==='grupos'){where='WHERE t.id=?';params=[profile.groupId??-1];}
  else if(id==='centros'){where='WHERE t.id=? OR EXISTS (SELECT 1 FROM center_directors cd WHERE cd.center_id=t.id AND cd.email=? AND cd.active=1)';params=[profile.centerId??-1,profile.email];}
  else if(id==='avisos'){where="WHERE t.status='published' AND (t.audience='all' OR t.audience=?)";params=[profile.role];}
  else if(id==='lecturas-avisos'){where="WHERE t.user_email=? AND EXISTS (SELECT 1 FROM announcements av WHERE av.id=t.announcement_id AND av.status='published' AND (av.audience='all' OR av.audience=?))";params=[profile.email,profile.role];}
  else if(['materiales-lider','testimonios','experiencias','programas','modulos','materiales-universidad'].includes(id)){where="WHERE t.status='published'";}
  else if(id==='documentos-acuses'){where="WHERE EXISTS (SELECT 1 FROM ack_versions av JOIN ack_assignments aa ON aa.version_id=av.id WHERE av.id=t.latest_version_id AND av.document_id=t.id AND av.status='published' AND aa.user_email=?)";params=[profile.email];}
  else if(id==='versiones-acuses'){where="WHERE t.status='published' AND EXISTS (SELECT 1 FROM ack_assignments aa WHERE aa.version_id=t.id AND aa.user_email=?)";params=[profile.email];}
  else if(id==='reportes-lider'){where='WHERE t.reporter_email=?';params=[profile.email];}
  else if(id==='solicitudes-reconocimiento'){where='WHERE t.email=?';params=[profile.email];}
  else if(['solicitudes-acceso','cambios-grupos','altas-grupos','solicitudes-centros'].includes(id)){where='WHERE t.requester_email=?';params=[profile.email];}
 }
 const columns=ds.columns.filter(k=>isAdmin||!['admin_notes','reviewer_email','review_note','created_by','updated_by'].includes(k)).map(k=>`t."${k}"`).join(',');
 for await(const row of sqlRows(`SELECT ${columns}${extra} FROM ${from} ${where} ORDER BY t.rowid`,params)){
  if(id==='acuses'){row.signature_url=`${origin}/api/acuses/signature?id=${encodeURIComponent(String(row.id))}`;row.receipt_url=`${origin}/lider/acuses`;row.has_signature='Sí';}
  yield row;
 }
}
