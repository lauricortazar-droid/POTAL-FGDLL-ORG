import {apiError,requireApiProfile} from '../../lib/portal-api';
import {PortalError} from '../../lib/directory-store';
import {exportCatalog,exportColumns,exportDataset,exportRows,prepareExports} from '../../lib/export-store';
import {csvBytes,iteratorStream,zipCsv} from '../../lib/csv-export';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const iterators:AsyncGenerator<Uint8Array>[]=[];
 try{
 const {profile}=await requireApiProfile(),url=new URL(request.url),scope=url.searchParams.get('scope')||'leader';
 const catalog=exportCatalog(profile,scope);
 if(url.searchParams.get('catalog')==='1')return Response.json({sections:catalog,scope},{headers:{'cache-control':'private, no-store'}});
 const format=url.searchParams.get('format')||'csv';if(!['csv','zip'].includes(format))throw new PortalError('Formato de descarga inválido.');
 const ids=Array.from(new Set(url.searchParams.getAll('section')));if(!ids.length||ids.length>50||format==='csv'&&ids.length!==1)throw new PortalError('Selecciona las secciones que deseas descargar.');
 const datasets=ids.map(id=>exportDataset(profile,scope,id));await prepareExports(ids);
 const date=new Date().toISOString().slice(0,10);
 const files=[];
 for(const ds of datasets){
  const iterator=csvBytes(exportColumns(ds,scope),exportRows(profile,scope,ds.id,url.origin));iterators.push(iterator);
  const first=await iterator.next();
  files.push({name:`${ds.id}-${date}.csv`,bytes:(async function*(){try{if(!first.done)yield first.value;yield* iterator;}finally{await iterator.return(undefined);}})()});
 }
 const filename=format==='zip'?`fgdll-${scope==='admin'?'administracion':'mi-servicio'}-${date}.zip`:files[0].name;
 const body=format==='zip'?zipCsv(files):files[0].bytes;
 // Close prefetched queries if a visitor cancels the download.
 const managed=(async function*(){try{yield* body;}finally{for(const iterator of iterators)await iterator.return(undefined);}})();
 return new Response(iteratorStream(managed),{headers:{'content-type':format==='zip'?'application/zip':'text/csv; charset=utf-8','content-disposition':`attachment; filename="${filename}"`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
 }catch(error){for(const iterator of iterators)await iterator.return(undefined);return apiError(error);}
}
