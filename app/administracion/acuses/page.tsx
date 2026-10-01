import {ProtectedAccess} from '../../protected-access';
import AckAdmin from './admin-client';
export const dynamic='force-dynamic';
export default function Page(){return <ProtectedAccess returnTo="/administracion/acuses" allowedRoles={['admin']}><AckAdmin/></ProtectedAccess>;}
