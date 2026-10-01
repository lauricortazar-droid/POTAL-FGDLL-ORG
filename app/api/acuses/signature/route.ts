import {apiError,requireApiProfile} from '../../../lib/portal-api';
import {ackReceipt} from '../../../lib/ack-store';
import {getRuntimeEnv} from '../../../lib/runtime-env';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const {profile}=await requireApiProfile();const {key}=await ackReceipt(profile,new URL(request.url).searchParams.get('id')||'');const file=await getRuntimeEnv().BUCKET.get(key);if(!file)return new Response('Firma no disponible',{status:404});return new Response(file.body,{headers:{'content-type':'image/svg+xml','cache-control':'private, no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; style-src 'none'; sandbox"}});}catch(e){return apiError(e);}}
