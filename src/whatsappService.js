// Integração com a Evolution API (WhatsApp) — Evolution API v2.
// Configuração via .env: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME
const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME } = process.env;

export const WHATSAPP_ON = Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE_NAME);

const base = () => (EVOLUTION_API_URL || '').replace(/\/+$/, ''); // remove barra final

// POST tipado para a Evolution API com o header apikey.
async function evoPost(path, body) {
  const r = await fetch(base() + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
  return data;
}

// tipo de mídia a partir da extensão do arquivo
function tipoMidia(fileName = '') {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  if (['mp4', 'mov', '3gp'].includes(ext)) return 'video';
  if (['mp3', 'ogg', 'oga', 'm4a'].includes(ext)) return 'audio';
  return 'document';
}

// Envia mensagem de texto. number: telefone (55DDD9...) ou grupo (...@g.us)
export async function sendTextMessage(number, text) {
  if (!WHATSAPP_ON) return { success: false, error: 'Evolution API não configurada (defina EVOLUTION_* no .env)' };
  try {
    const data = await evoPost(`/message/sendText/${EVOLUTION_INSTANCE_NAME}`, { number, text });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Envia mídia (PDF/imagem) por URL pública. mediaUrl: link acessível; fileName; caption opcional.
export async function sendMediaMessage(number, mediaUrl, fileName, caption) {
  if (!WHATSAPP_ON) return { success: false, error: 'Evolution API não configurada (defina EVOLUTION_* no .env)' };
  try {
    const data = await evoPost(`/message/sendMedia/${EVOLUTION_INSTANCE_NAME}`, {
      number,
      mediatype: tipoMidia(fileName),
      media: mediaUrl,          // Evolution v2 aceita URL pública ou base64 neste campo
      fileName,
      caption: caption || undefined,
    });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
