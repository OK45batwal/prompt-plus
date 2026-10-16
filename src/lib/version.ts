import manifest from "../../extension/manifest.json";

/**
 * The extension's real version, read from the manifest that actually ships.
 * Never hardcode an extension version in the UI — it silently drifts (it had
 * already drifted to four different values across the app).
 */
export const EXTENSION_VERSION: string = manifest.version;
