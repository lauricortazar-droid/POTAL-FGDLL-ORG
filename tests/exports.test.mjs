import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const transpile=p=>ts.transpileModule(readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const csv=await import(uri(transpile('app/lib/csv-export.ts')));
const stub=uri(`export class PortalError extends Error{constructor(message,status=400){super(message);this.status=status}} export const getRuntimeEnv=()=>globalThis.__exportEnv; export const ensureDirectorySeeded=async()=>{}; export const ensureContentSeeded=async()=>{}; export const ensureExperiencesSeeded=async()=>{}; export const listUniversityContent=async()=>{}; export const listPublicCenters=async()=>{};`);
let source=transpile('app/lib/export-store.ts').replace("import 'server-only';",'').replace(/from ['"]\.\/[^'"]+['"]/g,match=>match.includes('export-catalog.json')?'from '+JSON.stringify(uri('export default '+readFileSync('app/lib/export-catalog.json','utf8'))):'from '+JSON.stringify(stub)).replace("from '../calendar-data.json'",'from '+JSON.stringify(uri('export default '+readFileSync('app/calendar-data.json','utf8'))));
const store=await import(uri(source));
const admin={email:'admin@test.local',role:'admin',active:true},leader={email:'one@test.local',role:'leader',active:true,groupId:1,centerId:null};
async function all(it){const rows=[];for await(const row of it)rows.push(row);return rows;}
function fixture(){const db=new DatabaseSync(':memory:');const snapshot=JSON.parse(readFileSync('drizzle/meta/0021_snapshot.json','utf8'));for(const [name,t] of Object.entries(snapshot.tables))db.exec(`CREATE TABLE "${name}" (${Object.values(t.columns).map(c=>`"${c.name}" ${c.type}`).join(',')})`);
 globalThis.__exportEnv={DB:{prepare(sql){let values=[];return {bind(...args){values=args;return this;},async all(){return {results:db.prepare(sql).all(...values)};}}}}};return db;}
test('all admin exports execute; large datasets are complete; CSV secrets are excluded',async()=>{const db=fixture();const insert=db.prepare('INSERT INTO directory_groups (id,name) VALUES (?,?)');for(let i=1;i<=1007;i++)insert.run(i,'Grupo '+i);const catalog=store.exportCatalog(admin,'admin');assert.ok(catalog.length>=35);
 for(const section of catalog){const ds=store.exportDataset(admin,'admin',section.id);assert.ok(store.exportColumns(ds,'admin').every(c=>!['signature_key','tracking_secret_hash','file_key'].includes(c.key)));await all(store.exportRows(admin,'admin',section.id,'https://portal.test'));}
 assert.equal((await all(store.exportRows(admin,'admin','grupos','https://portal.test'))).length,1007);db.close();});
test('leaders cannot escalate scope or download private sections and only receive their own data',async()=>{const db=fixture();db.exec(`INSERT INTO directory_groups(id,name) VALUES(1,'Propio'),(2,'Ajeno');INSERT INTO leader_reports(id,reporter_email,narrative,admin_notes) VALUES('1','one@test.local','Propio','Nota privada'),('2','two@test.local','Ajeno','Secreto');INSERT INTO announcements(id,title,status,audience) VALUES('1','Para todos','published','all'),('2','Borrador','draft','all'),('3','Consejo','published','council');INSERT INTO distribution_workspaces(owner_email,payload_json) VALUES('one@test.local','{"contacts":[{"id":"1","firstName":"Propio"}]}'),('two@test.local','{"contacts":[{"id":"2","firstName":"Ajeno"}]}');`);
 assert.throws(()=>store.exportCatalog(leader,'admin'),e=>e.status===403);for(const id of ['usuarios','etica-reportes','auditoria','contactos-directorio','sqlite_master'])assert.throws(()=>store.exportDataset(leader,'leader',id),e=>e.status===403);
 assert.throws(()=>store.exportCatalog({...leader,active:false},'leader'),e=>e.status===403);
 const groups=await all(store.exportRows(leader,'leader','grupos','https://portal.test'));assert.deepEqual(groups.map(r=>r.name),['Propio']);
 const reports=await all(store.exportRows(leader,'leader','reportes-lider','https://portal.test'));assert.equal(reports.length,1);assert.equal(reports[0].admin_notes,undefined);
 assert.deepEqual((await all(store.exportRows(leader,'leader','avisos','https://portal.test'))).map(r=>r.title),['Para todos']);
 assert.deepEqual((await all(store.exportRows(leader,'leader','contactos','https://portal.test'))).map(r=>r.firstName),['Propio']);
 db.exec(`INSERT INTO ack_documents(id,title,latest_version_id) VALUES('d','Documento','v');INSERT INTO ack_versions(id,document_id,title,version,status) VALUES('v','d','Documento','1.0','published');INSERT INTO ack_assignments(id,version_id,user_email) VALUES('a1','v','one@test.local'),('a2','v','two@test.local');INSERT INTO acknowledgements(id,assignment_id,folio,signature_key) VALUES(1,'a1','F1','private/one'),(2,'a2','F2','private/two');`);
 const receipts=await all(store.exportRows(leader,'leader','acuses','https://portal.test'));assert.equal(receipts.length,1);assert.equal(receipts[0].folio,'F1');assert.equal(receipts[0].signature_key,undefined);assert.equal(receipts[0].version,'1.0');assert.match(receipts[0].signature_url,/id=1$/);
 db.close();});
test('UTF-8, multiline text, spreadsheet formulas, empty sections and ZIP integrity',async()=>{assert.equal(csv.csvCell('  =SUM(1,2)'),`"'  =SUM(1,2)"`);assert.equal(csv.csvCell('+529999999999'),`"'+529999999999"`);assert.equal(csv.csvCell('Pepe, "Luz"\nTiburón'),'"Pepe, ""Luz""\nTiburón"');
 const columns=[{key:'name',label:'Nombre'}];async function* rows(){yield {name:'Tiburón, "Luz"\nÁguila'};}async function* empty(){}
 const files=[{name:'datos.csv',bytes:csv.csvBytes(columns,rows())},{name:'vacio.csv',bytes:csv.csvBytes(columns,empty())}];const bytes=Buffer.concat((await all(csv.zipCsv(files))).map(b=>Buffer.from(b)));
 const python=spawnSync('python3',['-c',`import io,sys,zipfile,csv\nz=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))\nassert z.testzip() is None\nassert len(z.namelist())==2\nassert list(csv.reader(io.StringIO(z.read('datos.csv').decode('utf-8-sig'))))[1][0]=='Tiburón, "Luz"\\nÁguila'\nassert z.read('vacio.csv').decode('utf-8-sig')=='"Nombre"\\r\\n'\nprint('ZIP válido')`],{input:bytes});assert.equal(python.status,0,python.stderr.toString());
 async function* bad(){throw new Error('DB no disponible');}const iter=csv.csvBytes(columns,bad());await assert.rejects(()=>iter.next(),/DB no disponible/);
});
