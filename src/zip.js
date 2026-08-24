// Gerador de ZIP mínimo (método STORE, sem compressão) — sem dependências externas.
// Suficiente para agrupar PDFs (que já são comprimidos) num único arquivo.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Nomes duplicados ganham sufixo (1), (2)…
function nomesUnicos(files) {
  const vistos = new Map();
  return files.map(f => {
    let nome = (f.name || 'arquivo').replace(/[\\/]+/g, '_');
    if (vistos.has(nome)) {
      const n = vistos.get(nome) + 1; vistos.set(nome, n);
      const dot = nome.lastIndexOf('.');
      nome = dot > 0 ? `${nome.slice(0, dot)} (${n})${nome.slice(dot)}` : `${nome} (${n})`;
    } else vistos.set(nome, 0);
    return { name: nome, data: f.data };
  });
}

// files: [{ name: string, data: Buffer }]  ->  Buffer (.zip)
export function createZip(files) {
  const entries = nomesUnicos(files);
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of entries) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // assinatura local
    local.writeUInt16LE(20, 4);         // versão necessária
    local.writeUInt16LE(0x0800, 6);     // flags (bit 11 = UTF-8)
    local.writeUInt16LE(0, 8);          // compressão: 0 = store
    local.writeUInt16LE(0, 10);         // mod time
    local.writeUInt16LE(0, 12);         // mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);      // tamanho comprimido
    local.writeUInt32LE(size, 22);      // tamanho descomprimido
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);         // extra length

    chunks.push(local, nameBuf, data);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);           // versão criada por
    cen.writeUInt16LE(20, 6);           // versão necessária
    cen.writeUInt16LE(0x0800, 8);       // flags
    cen.writeUInt16LE(0, 10);           // compressão
    cen.writeUInt16LE(0, 12);           // mod time
    cen.writeUInt16LE(0, 14);           // mod date
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(size, 20);
    cen.writeUInt32LE(size, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt16LE(0, 30);           // extra
    cen.writeUInt16LE(0, 32);           // comentário
    cen.writeUInt16LE(0, 34);           // disco
    cen.writeUInt16LE(0, 36);           // attrs internos
    cen.writeUInt32LE(0, 38);           // attrs externos
    cen.writeUInt32LE(offset, 42);      // offset do header local
    central.push(Buffer.concat([cen, nameBuf]));

    offset += local.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuf, eocd]);
}
