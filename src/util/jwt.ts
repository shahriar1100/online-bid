// src/util/jwt.ts
export interface JWTPayload {
  iat: number;
  exp: number;
  [key: string]: unknown; 
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Base64URL encode */
function b64urlEncode(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Base64URL decode to ArrayBuffer */
function b64urlDecodeToUint8Array(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const base64 = str + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer; // ✅ return ArrayBuffer, not Uint8Array
}

/** Import a secret as a CryptoKey */
async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign a JWT
 */
export async function signJWT(
  payload: Omit<Partial<JWTPayload>, "iat" | "exp">,
  secret: string,
  expiresInSec = 3600 // default 1 hour
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" } as const;
  const now = Math.floor(Date.now() / 1000);
  const body: JWTPayload = { iat: now, exp: now + expiresInSec, ...payload };

  const headerB64 = b64urlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(encoder.encode(JSON.stringify(body)));
  const data = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    { name: "HMAC" },
    key,
    encoder.encode(data)
  );

  const signatureB64 = b64urlEncode(signatureBuffer);

  return `${data}.${signatureB64}`;
}

/**
 * Verify a JWT
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  const key = await importKey(secret);
  const signatureBytes = b64urlDecodeToUint8Array(signatureB64);
  const dataBytes = encoder.encode(`${headerB64}.${payloadB64}`);

  const valid = await crypto.subtle.verify(
    { name: "HMAC" },
    key,
    signatureBytes,
    dataBytes
  );
  if (!valid) return null;

  const payloadJson = decoder.decode(b64urlDecodeToUint8Array(payloadB64));
  const payload = JSON.parse(payloadJson) as JWTPayload;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && now > payload.exp) return null;

  return payload;
}



// ---------- Password helpers (PBKDF2) ----------

const ITERATIONS = 100_000;

function abToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToAb(hex: string): ArrayBuffer {
  const ab = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return ab;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Derive bits using PBKDF2(SHA-256), taking salt as ArrayBuffer
async function deriveHashBuffer(
  password: string,
  saltAb: ArrayBuffer,
  iterations = ITERATIONS
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltAb, iterations },
    key,
    256 // 256 bits = 32 bytes
  );
}

/**
 * Store as: pbkdf2$<iterations>$<saltHex>$<hashHex>
 */
export async function hashPasswordForStore(password: string): Promise<string> {
  // Create salt as a real ArrayBuffer (not Uint8Array) to satisfy TS BufferSource
  const saltAb = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(saltAb));

  const hashAb = await deriveHashBuffer(password, saltAb, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${abToHex(saltAb)}$${abToHex(hashAb)}`;
}

export async function verifyStoredPassword(plain: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterStr || !saltHex || !hashHex) return false;

  const iterations = Number(iterStr) || ITERATIONS;
  const saltAb = hexToAb(saltHex);
  const hashAb = await deriveHashBuffer(plain, saltAb, iterations);
  const recalculatedHex = abToHex(hashAb);

  return constantTimeEqual(recalculatedHex, hashHex);
}