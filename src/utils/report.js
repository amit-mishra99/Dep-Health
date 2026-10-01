export function decodeSharedReport() {
  const encoded = window.location.hash.match(/report=([^&]+)/)?.[1];
  if (!encoded) return null;

  try {
    const bytes = Uint8Array.from(atob(encoded), (character) =>
      character.charCodeAt(0),
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function shortVersion(value) {
  return value ? `v${value}` : "Unknown";
}

export function createShareUrl(report) {
  const bytes = new TextEncoder().encode(JSON.stringify(report));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const encoded = btoa(binary);
  if (encoded.length > 24000) return null;

  return `${window.location.origin}${window.location.pathname}#report=${encoded}`;
}
