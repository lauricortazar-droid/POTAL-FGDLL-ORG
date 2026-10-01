export const ACK_STATEMENT = "Confirmo haber recibido y revisado los acuerdos e indicaciones contenidos en este documento. Entiendo cuáles disposiciones se encuentran vigentes y cuáles permanecen pendientes de confirmación. Me comprometo a comunicar responsablemente la información que corresponda a mi servicio y a consultar con el responsable del área cuando exista alguna duda.";
export const ACK_NOTE = "Esta confirmación acredita que recibí y conocí la información; no implica renunciar a expresar dudas, observaciones o desacuerdos por los canales correspondientes.";
export const ACK_ROLES = ["Líder", "Sublíder", "Oficina de Servicios Generales", "Delegado", "Coordinador", "Servidor", "Otro"];
export const ACK_ZONES = ["Jaguar", "Tiburón", "Delfín", "Colibrí", "Águila"];
export const ACK_CATEGORIES = ["Junta", "Manual", "Reglamento", "Procedimiento", "Comunicado", "Código de ética", "Otro"];
// Only inert editorial markup survives. No attributes, URLs, scripts or embedded media.
export function sanitizeEditorial(value: string) {
  const allowed = new Set(['p','br','h2','h3','h4','strong','b','em','i','u','ul','ol','li','hr','blockquote','table','thead','tbody','tr','th','td','aside','div']);
  return value.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|iframe|object|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<[^>]*>/g, tag=>{
    const m=tag.match(/^<\s*(\/?)\s*([a-z0-9]+)/i); if(!m || !allowed.has(m[2].toLowerCase())) return '';
    return `<${m[1]}${m[2].toLowerCase()}>`;
  });
}
export type Stroke = {x:number;y:number}[];
export function validStrokes(strokes: unknown): strokes is Stroke[] {
  if(!Array.isArray(strokes)||strokes.length>100) return false;
  let length=0, count=0;
  for(const stroke of strokes){ if(!Array.isArray(stroke)||stroke.length>5000) return false;
    for(let i=0;i<stroke.length;i++){ const p=stroke[i]; if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>800||p.y<0||p.y>240)return false; count++; if(i)length+=Math.hypot(p.x-stroke[i-1].x,p.y-stroke[i-1].y); }
  } return count>=8 && count<=15000 && length>=35;
}
export function ackStatus(row: Record<string, any>) { return row.folio || row.carried_from ? 'ENTERADO' : row.due_at && row.due_at < new Date().toISOString().slice(0,10) ? 'VENCIDO' : row.opened_at ? 'LEYENDO' : 'PENDIENTE'; }
export function ackDate(date:string) { return date ? new Intl.DateTimeFormat('es-MX',{dateStyle:'long',timeStyle:'short',timeZone:'America/Cancun'}).format(new Date(date)) : '—'; }
