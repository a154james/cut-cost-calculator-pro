import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";

export interface ShareState {
  v: 1;
  machining?: Record<string, unknown>;
  material?: Record<string, unknown>;
  scheduler?: Record<string, unknown>;
}

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (str: string): Uint8Array => {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const encodeState = (state: ShareState): string => {
  try {
    return toBase64Url(deflateSync(strToU8(JSON.stringify(state)), { level: 9 }));
  } catch {
    return "";
  }
};

export const decodeState = (encoded: string): ShareState | null => {
  try {
    const parsed = JSON.parse(strFromU8(inflateSync(fromBase64Url(encoded))));
    if (!parsed || typeof parsed !== "object" || parsed.v !== 1) return null;
    return parsed as ShareState;
  } catch {
    return null;
  }
};

/** Reads the `#s=...` fragment payload from the current URL. */
export const readStateFromUrl = (): ShareState | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const payload = params.get("s");
  return payload ? decodeState(payload) : null;
};

/** Writes the state into the URL fragment without reloading, returns the full link. */
export const writeStateToUrl = (state: ShareState): string => {
  const encoded = encodeState(state);
  const url = `${window.location.origin}${window.location.pathname}${window.location.search}#s=${encoded}`;
  window.history.replaceState(null, "", url);
  return url;
};

export const clearStateFromUrl = (): void => {
  window.history.replaceState(
    null,
    "",
    `${window.location.origin}${window.location.pathname}${window.location.search}`
  );
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
};
