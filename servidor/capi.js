// API de Conversões do Meta. Usa o token do .env; o navegador nunca o vê.
// event_id igual ao do Pixel no navegador -> o Meta deduplica os dois.
import crypto from 'node:crypto';
import config from './config.js';

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const hash = (v) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s ? sha256(s) : undefined;
};
const digitos = (v) => String(v ?? '').replace(/\D/g, '');

function hashTelefone(tel) {
  let d = digitos(tel);
  if (d && !d.startsWith('55')) d = '55' + d;
  return d ? sha256(d) : undefined;
}

// Dados da pessoa: PII vai com hash; IP, navegador e cookies vão sem (regra da API).
function userData({ cliente = {}, ip, ua, fbp, fbc }) {
  const partes = String(cliente.nome || '').trim().split(/\s+/);
  const dados = {
    em: hash(cliente.email),
    ph: hashTelefone(cliente.telefone),
    fn: hash(partes[0]),
    ln: hash(partes.length > 1 ? partes[partes.length - 1] : ''),
    external_id: hash(digitos(cliente.cpf)),
    ct: hash(cliente.cidade),
    st: hash(cliente.uf),
    zp: hash(digitos(cliente.cep)),
    country: cliente.email ? hash('br') : undefined,
    client_ip_address: ip || undefined,
    client_user_agent: ua || undefined,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };
  Object.keys(dados).forEach((k) => dados[k] === undefined && delete dados[k]);
  return dados;
}

// Nunca lança: Meta fora do ar não pode derrubar a página nem o checkout.
export async function enviarEvento({ nome, eventId, url, customData, tempo, ...pessoa }) {
  const { pixelId, token, testEventCode, apiVersion } = config.meta;
  if (!pixelId || !token) return { pulado: 'sem META_PIXEL_ID/META_CAPI_ACCESS_TOKEN' };

  const payload = {
    data: [{
      event_name: nome,
      event_time: Math.floor((tempo || Date.now()) / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: url || undefined,
      user_data: userData(pessoa),
      custom_data: customData || undefined,
    }],
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  try {
    const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error(`[capi] ${nome}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[capi] ${nome} falhou:`, e.message);
    return { ok: false };
  }
}
