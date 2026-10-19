import manifest from "../../extension/manifest.json";

/**
 * The extension's real version, read from the manifest that actually ships.
 * Never hardcode an extension version in the UI — it silently drifts (it had
 * already drifted to four different values across the app).
 */
export const EXTENSION_VERSION: string = manifest.version;

/** The one place to install the extension from. Nothing offers a build download. */
export const EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/gdfaohfmmjjmpiggdcankjjihpljoccn";
