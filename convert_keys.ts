import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const publicKeyBase64 = "BOzm_7bkKsXs-s7nvH2YArjW8uQ_Sd0J4dludLNkAX91MGa6DRf7UKrQwY9bzuOQos7HmBKVg9GDlYQzmotvL50".replace(/-/g, '+').replace(/_/g, '/');
const privateKeyBase64 = "fOi9MXFA2UUNQS60eI18QxZdDq772heriq979GUglhc".replace(/-/g, '+').replace(/_/g, '/');

const pubBytes = decodeBase64(publicKeyBase64);
const privBytes = decodeBase64(privateKeyBase64);

// VAPID uses P-256 (32 bytes per coordinate)
// Public key is 0x04 (1 byte) + X (32 bytes) + Y (32 bytes)
const xB64URL = btoa(String.fromCharCode(...pubBytes.slice(1, 33))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const yB64URL = btoa(String.fromCharCode(...pubBytes.slice(33, 65))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const dB64URL = btoa(String.fromCharCode(...privBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const publicJWK = {
    kty: "EC",
    crv: "P-256",
    x: xB64URL,
    y: yB64URL
};

const privateJWK = {
    kty: "EC",
    crv: "P-256",
    x: xB64URL,
    y: yB64URL,
    d: dB64URL
};

console.log("PUBLIC_JWK:", JSON.stringify(publicJWK));
console.log("PRIVATE_JWK:", JSON.stringify(privateJWK));
