// services/amazonService.js
import aws4 from 'aws4';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const REGION_GROUP = process.env.SPAPI_REGION_GROUP || 'na';
const AWS_REGION = process.env.SPAPI_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const USE_SANDBOX_ENV = String(process.env.USE_SANDBOX || 'false') === 'true';

const HOSTS = { na: 'sellingpartnerapi-na.amazon.com', eu: 'sellingpartnerapi-eu.amazon.com', fe: 'sellingpartnerapi-fe.amazon.com' };

function hostBySandbox(useSandbox) {
  const base = HOSTS[REGION_GROUP] || HOSTS.na;
  const effectiveSandbox = typeof useSandbox === 'boolean' ? useSandbox : USE_SANDBOX_ENV;
  return effectiveSandbox ? `sandbox.${base}` : base;
}

export async function getGrantlessAccessToken(scopes=['sellingpartnerapi::notifications']) {
  const params = new URLSearchParams();
  params.append('grant_type','client_credentials');
  params.append('client_id',process.env.LWA_CLIENT_ID);
  params.append('client_secret',process.env.LWA_CLIENT_SECRET);
  params.append('scope',scopes.join(' '));
  const res = await fetch('https://api.amazon.com/auth/o2/token',{ method: 'POST', body: params });
  const data = await res.json();
  if (!res.ok) throw new Error(`LWA client_credentials falhou: ${res.status} ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function getAccessTokenWithRefresh() {
  const params = new URLSearchParams();
  params.append('grant_type','refresh_token');
  params.append('refresh_token',process.env.LWA_REFRESH_TOKEN);
  params.append('client_id',process.env.LWA_CLIENT_ID);
  params.append('client_secret',process.env.LWA_CLIENT_SECRET);
  const res = await fetch('https://api.amazon.com/auth/o2/token',{ method: 'POST', body: params });
  const data = await res.json();
  if (!res.ok) throw new Error(`LWA refresh_token falhou: ${res.status} ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function spApiFetch({ path, method='GET', query='', body=null, accessToken, useSandbox }) {
  const host = hostBySandbox(useSandbox);
  const urlPath = query ? `${path}?${query}` : path;
  const request = {
    host,
    path: urlPath,
    method,
    service: 'execute-api',
    region: AWS_REGION,
    headers: { host, 'content-type':'application/json', 'x-amz-access-token': accessToken },
    body: body ? JSON.stringify(body) : undefined
  };
  aws4.sign(request, { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, sessionToken: process.env.AWS_SESSION_TOKEN });
  const url = `https://${host}${urlPath}`;
  const resp = await fetch(url, { method, headers: request.headers, body: request.body });
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
