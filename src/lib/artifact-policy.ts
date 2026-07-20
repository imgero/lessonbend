const forbiddenPatterns = [
  /\bfetch\s*\(/i,
  /\bXMLHttpRequest\b/i,
  /\bWebSocket\b/i,
  /\b(?:local|session)Storage\b/i,
  /\bindexedDB\b/i,
  /\bwindow\.open\b/i,
  /\b(?:top|parent)\.(?:location|document)/i,
  /<script[^>]+\bsrc\s*=/i,
  /```/,
];

export function lintArtifactSource(source: string): string[] {
  const failures = forbiddenPatterns.filter((pattern) => pattern.test(source)).map((pattern) => `Forbidden capability: ${pattern}`);
  if (!/^\s*<!doctype html>/i.test(source)) failures.push("Artifact must be raw HTML beginning with <!doctype html>.");
  if (!/<head[\s>][\s\S]*?<meta[^>]+http-equiv=["']Content-Security-Policy["'][\s\S]*?<\/head>/i.test(source)) failures.push("CSP meta tag must be inside <head>.");
  return failures;
}

export const artifactCsp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
