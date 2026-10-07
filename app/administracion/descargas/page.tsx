import {ProtectedAccess} from '../../protected-access';
import ExportCenter from '../../descargas/export-center';
export const dynamic='force-dynamic';
export default function Page(){return <ProtectedAccess returnTo="/administracion/descargas" allowedRoles={['admin']}><ExportCenter scope="admin"/></ProtectedAccess>;}
