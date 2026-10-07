const encoder=new TextEncoder();
export type ExportColumn={key:string;label:string};
export function csvCell(value:unknown){
 let text=value==null?'':typeof value==='object'?JSON.stringify(value):String(value);
 // Spreadsheet applications must treat user-authored values as text, never formulas.
 if(/^[\s\uFEFF]*[=+@\-]/u.test(text)||/^[\t\r\n]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
export function csvRow(values:unknown[]){return values.map(csvCell).join(',')+'\r\n';}
export async function* csvBytes(columns:ExportColumn[],rows:AsyncIterable<Record<string,unknown>>){
 const iterator=rows[Symbol.asyncIterator]();
 try{
 let current=await iterator.next(); // surface initial database failures before sending headers
 yield encoder.encode('\uFEFF'+csvRow(columns.map(c=>c.label)));
 let batch='';let count=0;
 while(!current.done){batch+=csvRow(columns.map(c=>current.value[c.key]));if(++count===250){yield encoder.encode(batch);batch='';count=0;}current=await iterator.next();}
 if(batch)yield encoder.encode(batch);
 }finally{await iterator.return?.();}
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crcUpdate(crc:number,bytes:Uint8Array){for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return crc>>>0;}
function header(size:number){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};}
export async function* zipCsv(files:{name:string;bytes:AsyncIterable<Uint8Array>}[]){
 let offset=0;const central:{name:Uint8Array;offset:number;size:number;crc:number}[]=[];
 for(const file of files){
 const name=encoder.encode(file.name),start=offset;const h=header(30);h.view.setUint32(0,0x04034b50,true);h.view.setUint16(4,20,true);h.view.setUint16(6,0x808,true);h.view.setUint16(12,33,true);h.view.setUint16(26,name.length,true);
 yield h.bytes;yield name;offset+=30+name.length;let crc=0xffffffff,size=0;
 for await(const chunk of file.bytes){crc=crcUpdate(crc,chunk);size+=chunk.length;offset+=chunk.length;if(offset>0xffffffff)throw new Error('La descarga supera el tamaño permitido. Descarga las secciones por separado.');yield chunk;}
 crc=(crc^0xffffffff)>>>0;const d=header(16);d.view.setUint32(0,0x08074b50,true);d.view.setUint32(4,crc,true);d.view.setUint32(8,size,true);d.view.setUint32(12,size,true);yield d.bytes;offset+=16;central.push({name,offset:start,size,crc});
 }
 const start=offset;
 for(const f of central){const h=header(46);h.view.setUint32(0,0x02014b50,true);h.view.setUint16(4,20,true);h.view.setUint16(6,20,true);h.view.setUint16(8,0x808,true);h.view.setUint16(14,33,true);h.view.setUint32(16,f.crc,true);h.view.setUint32(20,f.size,true);h.view.setUint32(24,f.size,true);h.view.setUint16(28,f.name.length,true);h.view.setUint32(42,f.offset,true);yield h.bytes;yield f.name;offset+=46+f.name.length;}
 const end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,central.length,true);end.view.setUint16(10,central.length,true);end.view.setUint32(12,offset-start,true);end.view.setUint32(16,start,true);yield end.bytes;
}
export function iteratorStream(iterator:AsyncIterator<Uint8Array>){return new ReadableStream<Uint8Array>({async pull(controller){try{const next=await iterator.next();if(next.done)controller.close();else controller.enqueue(next.value);}catch(e){controller.error(e);}},async cancel(){await iterator.return?.();}});}
