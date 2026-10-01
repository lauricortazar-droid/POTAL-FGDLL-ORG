import 'server-only';
import {getRuntimeEnv} from './runtime-env';
import {PortalError, type PortalProfile, configuredAdminEmails} from './directory-store';
import {ACK_STATEMENT, ACK_NOTE, ACK_ROLES, ACK_ZONES, ACK_CATEGORIES, sanitizeEditorial, validStrokes} from './ack-shared';
const db=()=>getRuntimeEnv().DB;
const now=()=>new Date().toISOString();
const text=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
const admin=(p:PortalProfile)=>{if(p.role!=='admin')throw new PortalError('Solo Administración puede gestionar los acuses.',403);};
const rows=async(sql:string,...args:unknown[])=>(await db().prepare(sql).bind(...args).all<Record<string,any>>()).results??[];
const one=async(sql:string,...args:unknown[])=>db().prepare(sql).bind(...args).first<Record<string,any>>();
export async function seedAckDraft(p:PortalProfile){
 admin(p);
 await db().batch([
  db().prepare("INSERT OR IGNORE INTO ack_documents (id,title,zone,category,meeting_date,status,created_at,created_by) VALUES ('junta-tiburon-20260927',?,'Tiburón','Junta','2026-09-27','draft',?,'system')").bind('Junta de Líderes — Zona Tiburón',now()),
  db().prepare("INSERT OR IGNORE INTO ack_versions (id,document_id,version,title,zone,category,meeting_date,content,status,requires_new,created_by) VALUES ('junta-tiburon-20260927-v1','junta-tiburon-20260927','1.0',?,'Tiburón','Junta','2026-09-27','','draft',1,'system')").bind('Junta de Líderes — Zona Tiburón')
 ]);
}
export async function ackCandidates(p:PortalProfile){
 admin(p);
 const users=await rows(`SELECT CAST(u.id AS TEXT) user_id,u.email,u.name,CASE WHEN u.role_label<>'' THEN u.role_label ELSE u.role END service_role,u.role,u.zone,u.group_id,COALESCE(g.name,c.name,'') group_name FROM portal_users u LEFT JOIN directory_groups g ON g.id=u.group_id LEFT JOIN rehabilitation_centers c ON c.id=u.center_id WHERE u.active=1`);
 for(const email of configuredAdminEmails()) if(!users.some(u=>u.email===email))users.push({user_id:email,email,name:email,service_role:'Administrador',role:'admin',zone:'',group_name:'',group_id:null});
 return users;
}
const assignmentSelect=`SELECT a.*,v.document_id,v.title,v.version,v.category,v.meeting_date,v.published_at,v.due_at,v.status version_status,d.status document_status,d.latest_version_id,r.folio,r.confirmed_at,r.id receipt_id,rv.version confirmed_version FROM ack_assignments a JOIN ack_versions v ON v.id=a.version_id JOIN ack_documents d ON d.id=v.document_id LEFT JOIN acknowledgements r ON r.assignment_id=COALESCE(a.carried_from,a.id) LEFT JOIN ack_assignments ra ON ra.id=r.assignment_id LEFT JOIN ack_versions rv ON rv.id=ra.version_id`;
export async function ackList(p:PortalProfile,isAdmin=false){
 if(isAdmin){admin(p);await seedAckDraft(p);return {documents:await rows('SELECT * FROM ack_documents ORDER BY created_at DESC'),versions:await rows('SELECT * FROM ack_versions ORDER BY published_at DESC,version DESC'),assignments:await rows(assignmentSelect+' ORDER BY a.assigned_at DESC'),users:await ackCandidates(p)};}
 const assignments=await rows(assignmentSelect+" WHERE a.user_email=? AND v.status='published' AND (d.latest_version_id=v.id OR r.id IS NOT NULL) ORDER BY a.assigned_at DESC",p.email);
 const group=p.groupId?await one('SELECT name FROM directory_groups WHERE id=?',p.groupId):p.centerId?await one('SELECT name FROM rehabilitation_centers WHERE id=?',p.centerId):null;
 return {assignments,profile:{...p,groupName:group?.name??''}};
}
async function assignment(p:PortalProfile,id:string){
 const row=await one(assignmentSelect+' WHERE a.id=?',id);
 if(!row||(p.role!=='admin'&&row.user_email!==p.email)||row.version_status!=='published')throw new PortalError('Documento no disponible para tu perfil.',404);
 return row;
}
export async function ackDocument(p:PortalProfile,id:string){
 const row=await assignment(p,id);
 const version=await one('SELECT * FROM ack_versions WHERE id=?',row.version_id);
 return {...row,content:version!.content};
}
export async function ackReceipt(p:PortalProfile,id:string){
 const r=await one(`SELECT r.*,a.user_email,v.title,v.version,v.document_id,v.published_at,v.meeting_date,v.category,v.content FROM acknowledgements r JOIN ack_assignments a ON a.id=r.assignment_id JOIN ack_versions v ON v.id=a.version_id WHERE r.id=?`,id);
 if(!r||(p.role!=='admin'&&r.user_email!==p.email))throw new PortalError('Acuse no disponible.',404);
 const {signature_key,...safe}=r; return {record:safe,key:signature_key};
}
export async function ackProgress(p:PortalProfile,input:Record<string,unknown>){
 const a=await assignment(p,text(input.id)); if(a.user_email!==p.email)throw new PortalError('Solo puedes registrar tu propia lectura.',403);
 const progress=Number(input.progress);if(!Number.isInteger(progress)||progress<0||progress>100)throw new PortalError('Progreso inválido.');
 await db().prepare('UPDATE ack_assignments SET opened_at=COALESCE(opened_at,?),progress=MAX(progress,?) WHERE id=? AND user_email=?').bind(now(),progress,a.id,p.email).run();return {ok:true};
}
export async function confirmAck(p:PortalProfile,input:Record<string,unknown>){
 const a=await assignment(p,text(input.id));if(a.user_email!==p.email)throw new PortalError('Solo puedes confirmar tu propio acuse.',403);
 if(a.receipt_id)return {id:a.receipt_id};
 if(a.progress!==100||!a.opened_at)throw new PortalError('Recorre el documento hasta el final antes de confirmar.');
 if(a.document_status!=='published'||a.latest_version_id!==a.version_id)throw new PortalError('Este documento fue archivado o tiene una versión nueva. Vuelve a tus pendientes.',409);
 if(input.read!==true||input.communicate!==true)throw new PortalError('Marca las dos confirmaciones obligatorias.');
 const fullName=text(input.fullName),groupName=text(input.groupName),serviceRole=text(input.serviceRole),zone=text(input.zone);
 if(fullName.length<3||!groupName||!ACK_ROLES.includes(serviceRole)||!ACK_ZONES.includes(zone))throw new PortalError('Completa nombre, grupo, servicio y zona.');
 if(!validStrokes(input.strokes))throw new PortalError('La firma está vacía o incompleta. Vuelve a firmar.');
 // Construct the private image from validated numeric strokes, never arbitrary uploaded markup.
 const paths=input.strokes.filter(s=>s.length>1).map(s=>`<path d="${s.map((pt,i)=>`${i?'L':'M'}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(' ')}"/>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240" viewBox="0 0 800 240"><rect width="800" height="240" fill="white"/><g fill="none" stroke="#142b45" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
 const key=`private/ack-signatures/${crypto.randomUUID()}.svg`;
 await getRuntimeEnv().BUCKET.put(key,new TextEncoder().encode(svg),{httpMetadata:{contentType:'image/svg+xml'}});
 const time=now(); const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Cancun',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');
 const prefix=({Jaguar:'ZJ','Tiburón':'ZT','Delfín':'ZD','Colibrí':'ZC','Águila':'ZA'} as Record<string,string>)[a.zone]??'FG';
 try{
 await db().prepare(`INSERT OR IGNORE INTO acknowledgements (assignment_id,folio,user_id,full_name,group_name,service_role,zone,signature_key,confirmed_at,statement) SELECT ?,? || printf('%04d',(SELECT COALESCE(MAX(id),0)+1 FROM acknowledgements)),?,?,?,?,?,?,?,? FROM ack_assignments a JOIN ack_versions v ON v.id=a.version_id JOIN ack_documents d ON d.id=v.document_id WHERE a.id=? AND a.user_email=? AND a.progress=100 AND a.carried_from IS NULL AND v.status='published' AND d.status='published' AND d.latest_version_id=v.id`).bind(a.id,`${prefix}-${a.category==='Junta'?'JL':'DOC'}-${localDate}-`,a.user_id,fullName,groupName,serviceRole,zone,key,time,ACK_STATEMENT+'\n\n'+ACK_NOTE,a.id,p.email).run();
 const saved=await one('SELECT id,signature_key FROM acknowledgements WHERE assignment_id=?',a.id);
 if(!saved)throw new PortalError('El documento cambió mientras confirmabas. Actualiza tus pendientes.',409);
 if(saved.signature_key!==key)await getRuntimeEnv().BUCKET.delete(key);
 return {id:saved.id};
 }catch(error){await getRuntimeEnv().BUCKET.delete(key);throw error;}
}
export async function saveAckAdmin(p:PortalProfile,input:Record<string,unknown>){
 admin(p); const action=text(input.action),id=text(input.id);
 if(action==='follow'){await db().prepare('UPDATE ack_assignments SET follow_up=? WHERE id=?').bind(text(input.note,2000),id).run();return {ok:true};}
 if(action==='archive'){await db().prepare("UPDATE ack_documents SET status='archived' WHERE id=?").bind(id).run();return {ok:true};}
 if(action==='draft'){
 const title=text(input.title),zone=text(input.zone),category=text(input.category),date=text(input.meetingDate),version=text(input.version,30),content=sanitizeEditorial(text(input.content,250000));
 if(!title||!ACK_ZONES.includes(zone)||!ACK_CATEGORIES.includes(category)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d+\.\d+(\.\d+)?$/.test(version))throw new PortalError('Revisa título, zona, categoría, fecha y versión (por ejemplo 1.0).');
 const due=text(input.dueAt);if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw new PortalError('Fecha límite inválida.');
 if(id){const old=await one('SELECT * FROM ack_versions WHERE id=?',id);if(!old||old.status!=='draft')throw new PortalError('Una versión publicada es inmutable. Crea una nueva versión.',409);
 await db().prepare("UPDATE ack_versions SET title=?,zone=?,category=?,meeting_date=?,version=?,content=?,due_at=?,requires_new=? WHERE id=? AND status='draft'").bind(title,zone,category,date,version,content,due||null,input.requiresNew===false?0:1,id).run();return {id};}
 const documentId=text(input.documentId)||crypto.randomUUID(),versionId=crypto.randomUUID();
 if(input.documentId&&!await one('SELECT id FROM ack_documents WHERE id=?',documentId))throw new PortalError('Documento no encontrado.',404);
 await db().batch([db().prepare("INSERT OR IGNORE INTO ack_documents (id,title,zone,category,meeting_date,status,created_at,created_by) VALUES (?,?,?,?,?,'draft',?,?)").bind(documentId,title,zone,category,date,now(),p.email),db().prepare("INSERT INTO ack_versions (id,document_id,version,title,zone,category,meeting_date,content,status,due_at,requires_new,created_by) VALUES (?,?,?,?,?,?,?,?,'draft',?,?,?)").bind(versionId,documentId,version,title,zone,category,date,content,due||null,input.requiresNew===false?0:1,p.email)]);return {id:versionId};
 }
 if(action==='assign'||action==='publish'){
 const v=await one('SELECT * FROM ack_versions WHERE id=?',id);if(!v)throw new PortalError('Documento no encontrado.',404);
 if(action==='publish'&&v.status!=='draft')throw new PortalError('La versión ya fue publicada.',409);
 if(action==='publish'&&v.content.replace(/<[^>]*>/g,'').trim().length<30)throw new PortalError('Carga el contenido completo antes de publicar.');
 const users=await ackCandidates(p);const requested=Array.isArray(input.emails)?input.emails.map(String):[];const selected=users.filter(u=>requested.includes(u.email));
 if(!selected.length)throw new PortalError('Selecciona al menos un participante activo.');
 const document=await one('SELECT * FROM ack_documents WHERE id=?',v.document_id);
 const time=now();const statements=[];
 if(action==='publish'){
 statements.push(db().prepare("UPDATE ack_versions SET status='published',published_at=? WHERE id=? AND status='draft'").bind(time,id));
 statements.push(db().prepare("UPDATE ack_documents SET title=?,zone=?,category=?,meeting_date=?,status='published',latest_version_id=? WHERE id=?").bind(v.title,v.zone,v.category,v.meeting_date,id,v.document_id));
 }
 for(const u of selected){
 // A minor revision can carry a receipt forward, but its original signed version stays intact.
 const prior=!v.requires_new&&document?.latest_version_id&&document.latest_version_id!==id?await one(`SELECT r.assignment_id FROM ack_assignments a JOIN acknowledgements r ON r.assignment_id=COALESCE(a.carried_from,a.id) WHERE a.version_id=? AND a.user_email=?`,document.latest_version_id,u.email):null;
 statements.push(db().prepare('INSERT OR IGNORE INTO ack_assignments (id,version_id,user_email,user_id,full_name,group_name,service_role,zone,assigned_at,carried_from) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,u.email,u.user_id,u.name,u.group_name,u.service_role,u.zone||v.zone,time,prior?.assignment_id??null));
 }
 // One atomic batch: participants never see a partial publication.
 await db().batch(statements);return {ok:true};
 }
 throw new PortalError('Operación no reconocida.');
}
