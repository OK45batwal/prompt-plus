"use client";

import { useState, useEffect, useRef } from "react";
import { EXTENSION_STORE_URL } from "@/lib/version";
import {
  User,
  Key,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Trash2,
  Loader2,
  AlertTriangle,
  Cpu,
  Zap,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  Camera,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { MODELS, DEFAULT_MODEL_ID, getModelDisplayLabel } from "@/lib/models";
import { UserPreferences } from "@/app/api/v1/user/preferences/route";

type SettingsTab = "profile" | "engine" | "api-keys" | "preferences" | "privacy" | "extension" | "notifications";

type ProviderInfo = { id: "openai" | "anthropic" | "google" | "openrouter" | "nvidia"; name: string; placeholder: string; url: string };
const providers: ProviderInfo[] = [
  { id: "openai", name: "OpenAI", placeholder: "sk-...", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", url: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google Gemini (direct)", placeholder: "AIza...", url: "https://aistudio.google.com/apikey" },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-v1-...", url: "https://openrouter.ai/keys" },
  { id: "nvidia", name: "NVIDIA", placeholder: "nvapi-...", url: "https://build.nvidia.com" },
];

const developerRoles = [
  "Prompt Architect",
  "Full-Stack Engineer",
  "AI / ML Researcher",
  "Product Manager",
  "Content Strategist",
  "Security Specialist",
];

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-background transition-transform shadow-xs ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; err: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage({ text: "Password must be at least 8 characters", err: true });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ text: data.message || "Password updated", err: false });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to update password", err: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        aria-label="Current password"
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
      />
      <input
        type="password"
        aria-label="New password (8 or more characters)"
        placeholder="New password (8+ characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
      />
      {message && (
        <p className={`text-xs font-medium ${message.err ? "text-red-500" : "text-emerald-500"}`}>{message.text}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="h-8 px-4 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update Password"}
      </button>
    </form>
  );
}

function SignOutEverywhere() {
  const [message, setMessage] = useState<{ text: string; err: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/sign-out-everywhere", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to sign out everywhere", err: true });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        A session lasts 30 days. Signing out of this browser clears it here; signing out everywhere also revokes every
        other browser and device immediately.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="h-8 px-4 rounded-lg border text-xs font-semibold hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sign out everywhere"}
      </button>
      {message && (
        <p className={`text-xs font-medium ${message.err ? "text-red-500" : "text-emerald-500"}`}>{message.text}</p>
      )}
    </div>
  );
}

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; err: boolean } | null>(null);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to delete account", err: true });
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-500/5 space-y-3">
      <p className="text-xs text-muted-foreground">
        Permanently delete your account and all prompt data. This action cannot be undone.
      </p>
      <input
        type="text"
        aria-label="Type DELETE to confirm account deletion"
        placeholder='Type "DELETE" to confirm'
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />
      {message && (
        <p className={`text-xs ${message.err ? "text-red-500" : "text-emerald-500"}`}>{message.text}</p>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={confirmText !== "DELETE" || loading}
        className="h-8 px-4 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        Delete Account
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const { setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  // Starts empty so the server and first client render agree; the stored avatar is
  // read after mount.
  const [avatar, setAvatar] = useState<string>("");
  const [developerRole, setDeveloperRole] = useState("Prompt Architect");

  // API Keys state
  const [apiKeysInput, setApiKeysInput] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [savedKeyHints, setSavedKeyHints] = useState<Record<string, string>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, { status: string | null; at: string | null }>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSavingKey, setIsSavingKey] = useState<Record<string, boolean>>({});
  const [isTestingKey, setIsTestingKey] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences State
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL_ID);
  const [defaultTone, setDefaultTone] = useState("");

  // AI Engine Preferences
  const [engineMode, setEngineMode] = useState<"api" | "algorithmic" | "device">("api");
  const [defaultStrategy, setDefaultStrategy] = useState<"structured" | "concise" | "model_tuned" | "detailed">("structured");
  const [defaultFormat, setDefaultFormat] = useState<"markdown" | "xml" | "json">("markdown");
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState(true);
  const [zeroFluffEnabled, setZeroFluffEnabled] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(false);

  // Notification Toggles
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifUsage, setNotifUsage] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [notifUpdates, setNotifUpdates] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // Fetch persisted preferences
  useEffect(() => {
    let active = true;
    async function loadUserPrefs() {
      try {
        const res = await fetch("/api/v1/user/preferences");
        if (res.ok && active) {
          const json = await res.json();
          if (json.data) {
            const p: UserPreferences = json.data;
            if (p.developerRole) setDeveloperRole(p.developerRole);
            if (p.defaultEngineMode) setEngineMode(p.defaultEngineMode);
            if (p.defaultStrategy) setDefaultStrategy(p.defaultStrategy);
            if (p.defaultOutputFormat) setDefaultFormat(p.defaultOutputFormat);
            if (p.enableAutoCorrect !== undefined) setAutoCorrectEnabled(p.enableAutoCorrect);
            if (p.enableZeroFluff !== undefined) setZeroFluffEnabled(p.enableZeroFluff);
            if (p.enableSoundEffects !== undefined) setSoundEffectsEnabled(p.enableSoundEffects);

            if (p.emailNotifications !== undefined) setNotifEmail(p.emailNotifications);
            if (p.usageAlerts !== undefined) setNotifUsage(p.usageAlerts);
            if (p.weeklyDigest !== undefined) setNotifDigest(p.weeklyDigest);
            if (p.productUpdates !== undefined) setNotifUpdates(p.productUpdates);
            if (p.securityAlerts !== undefined) setNotifSecurity(p.securityAlerts);
          }
        }
      } catch {
        // ignore
      }

      // Default model/tone are client-only Studio preferences: the Studio reads the same
      // "pp_prefs" key. Before this, nothing ever wrote it and the setting did nothing.
      try {
        const raw = localStorage.getItem("pp_prefs");
        if (!raw || !active) return;
        const prefs = JSON.parse(raw) as { defaultModel?: string; defaultTone?: string };
        if (prefs.defaultModel) setDefaultModel(prefs.defaultModel);
        if (prefs.defaultTone) setDefaultTone(prefs.defaultTone);
      } catch {
        // ignore malformed prefs
      }
    }
    loadUserPrefs();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem("pp_user_avatar");
        if (stored) setAvatar(stored);
      } catch {
        // A blocked storage read just leaves the avatar empty.
      }
    });
  }, []);

  useEffect(() => {
    if (session?.user?.name || session?.user?.email || session?.user?.image) {
      queueMicrotask(() => {
        if (session?.user?.name) setName(session.user.name);
        if (session?.user?.email) setEmail(session.user.email);
        if (session?.user?.image && !localStorage.getItem("pp_user_avatar")) {
          setAvatar(session.user.image);
        }
      });
    }
  }, [session?.user?.name, session?.user?.email, session?.user?.image]);

  useEffect(() => {
    let isMounted = true;
    async function fetchKeys() {
      try {
        const res = await fetch("/api/v1/api-keys");
        const keyMap: Record<string, boolean> = {};
        const hintMap: Record<string, string> = {};
        const statusMap: Record<string, { status: string | null; at: string | null }> = {};
        if (res.ok && isMounted) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            json.data.forEach((k: { provider: string; isActive: boolean; keyHint?: string; lastValidationStatus?: string | null; lastValidatedAt?: string | null }) => {
              keyMap[k.provider] = k.isActive;
              if (k.keyHint) hintMap[k.provider] = k.keyHint;
              statusMap[k.provider] = { status: k.lastValidationStatus ?? null, at: k.lastValidatedAt ?? null };
            });
          }
        }
        if (isMounted) {
          setSavedKeys(keyMap);
          setSavedKeyHints(hintMap);
          setKeyStatus(statusMap);
        }

        // One-time migration: older builds kept plaintext keys in this browser.
        // Upload any that the account does not already have, then delete them.
        try {
          const raw = localStorage.getItem("promptplus_user_apikeys");
          if (raw) {
            const legacy = JSON.parse(raw) as Record<string, string>;
            const remaining: Record<string, string> = {};
            let moved = 0;
            let failed = 0;
            for (const [provider, apiKey] of Object.entries(legacy)) {
              if (!apiKey?.trim() || keyMap[provider]) continue;
              const saved = await fetch("/api/v1/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
                body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
              });
              if (saved.ok) moved++;
              else {
                remaining[provider] = apiKey;
                failed++;
              }
            }
            // Only a confirmed save removes the plaintext copy.
            if (Object.keys(remaining).length > 0) localStorage.setItem("promptplus_user_apikeys", JSON.stringify(remaining));
            else localStorage.removeItem("promptplus_user_apikeys");
            if (isMounted && moved > 0) toast("Moved browser-only API keys into your encrypted account vault.", "success");
            if (isMounted && failed > 0) toast(`${failed} browser-only key${failed === 1 ? "" : "s"} could not be moved and stayed in this browser.`, "error");
          }
        } catch {
          // Leave the value in place: a parse failure must not delete the only copy.
        }
      } catch {
        // ignore
      }
    }
    fetchKeys();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleTestApiKey = async (provider: string) => {
    const rawKey = apiKeysInput[provider];
    if (!rawKey?.trim()) return;

    setIsTestingKey((prev) => ({ ...prev, [provider]: true }));
    setTestResults((prev) => ({ ...prev, [provider]: { ok: false, msg: "" } }));
    try {
      const res = await fetch("/api/v1/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawKey?.trim() ? { provider, apiKey: rawKey } : { provider }),
      });
      const json = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]:
          res.ok && json.success
            ? { ok: true, msg: json.data?.message || "Key accepted by the provider." }
            : { ok: false, msg: json.error || "Could not verify this key." },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { ok: false, msg: "Could not reach the server." },
      }));
    } finally {
      setIsTestingKey((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSaveApiKey = async (provider: string) => {
    const rawKey = apiKeysInput[provider];
    if (!rawKey?.trim()) return;

    setIsSavingKey((prev) => ({ ...prev, [provider]: true }));
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: rawKey.trim() }),
      });

      const json = await res.json();
      if (res.ok) {
        setSavedKeys((prev) => ({ ...prev, [provider]: true }));
        if (json.data?.keyHint) {
          setSavedKeyHints((prev) => ({ ...prev, [provider]: json.data.keyHint }));
        }
        setApiKeysInput((prev) => ({ ...prev, [provider]: "" }));
        setKeyStatus((prev) => ({ ...prev, [provider]: { status: null, at: null } }));
        setTestResults((prev) => ({ ...prev, [provider]: { ok: true, msg: "Saved. Test it to confirm the provider accepts it." } }));
        toast(`API key saved for ${provider.toUpperCase()}!`, "success");
      } else {
        toast(json.error || "Failed to save API key", "error");
      }
    } catch {
      toast("Failed to save API key", "error");
    } finally {
      setIsSavingKey((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    try {
      const res = await fetch(`/api/v1/api-keys?provider=${provider}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast(json.error || "The key could not be deleted. It is still saved.", "error");
        return;
      }
      setSavedKeys((prev) => ({ ...prev, [provider]: false }));
      setSavedKeyHints((prev) => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
      setKeyStatus((prev) => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
      setApiKeysInput((prev) => ({ ...prev, [provider]: "" }));
      setTestResults((prev) => ({ ...prev, [provider]: { ok: false, msg: "" } }));
      toast(`API key removed for ${provider.toUpperCase()}`, "info");
    } catch {
      toast("Could not reach the server. The key is still saved.", "error");
    }
  };

  const handleSelectAvatar = (url: string) => {
    setAvatar(url);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_user_avatar", url);
      window.dispatchEvent(new Event("promptplus:avatar_updated"));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select a valid image file (PNG, JPG, WEBP, SVG).", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("Image size is too large. Please choose an image under 2MB.", "error");
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatar(result);
        if (typeof window !== "undefined") {
          localStorage.setItem("pp_user_avatar", result);
          window.dispatchEvent(new Event("promptplus:avatar_updated"));
        }
        toast("Custom avatar image uploaded successfully!", "success");
      }
      setIsUploadingAvatar(false);
    };
    reader.onerror = () => {
      toast("Failed to process image file.", "error");
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    const defaultSeed = name ? encodeURIComponent(name) : "Architect";
    const defaultUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${defaultSeed}&backgroundColor=06b6d4`;
    setAvatar(defaultUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_user_avatar", defaultUrl);
      window.dispatchEvent(new Event("promptplus:avatar_updated"));
    }
    toast("Avatar reset to default preset.", "info");
  };

  const handleSaveAll = async () => {
    // 1. Save Profile & Avatar to both v1/user/profile and auth/profile
    let profileSaved = true;
    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ name, avatar }),
      });
      profileSaved = res.ok;
    } catch {
      profileSaved = false;
    }

    await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar }),
    }).catch(() => {});

    if (typeof window !== "undefined") {
      localStorage.setItem("pp_user_avatar", avatar);
      window.dispatchEvent(new Event("promptplus:avatar_updated"));
    }

    // 2. Save Preferences
    let preferencesSaved = true;
    try {
      const res = await fetch("/api/v1/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          developerRole,
          defaultEngineMode: engineMode,
          defaultStrategy,
          defaultOutputFormat: defaultFormat,
          enableAutoCorrect: autoCorrectEnabled,
          enableZeroFluff: zeroFluffEnabled,
          enableSoundEffects: soundEffectsEnabled,
          emailNotifications: notifEmail,
          usageAlerts: notifUsage,
          weeklyDigest: notifDigest,
          productUpdates: notifUpdates,
          securityAlerts: notifSecurity,
        }),
      });
      preferencesSaved = res.ok;
    } catch {
      preferencesSaved = false;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("pp_prefs", JSON.stringify({ defaultModel, defaultTone }));
    }

    // 3. Save any pending API keys
    const pendingKeys = Object.entries(apiKeysInput).filter(([, v]) => v?.trim());
    let keysSaved = 0;
    const failedKeys: Record<string, string> = {};
    for (const [prov, val] of pendingKeys) {
      try {
        const res = await fetch("/api/v1/api-keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ provider: prov, apiKey: val.trim() }),
        });
        if (res.ok) {
          keysSaved++;
          setSavedKeys((prev) => ({ ...prev, [prov]: true }));
        } else {
          failedKeys[prov] = val;
        }
      } catch {
        failedKeys[prov] = val;
      }
    }
    // Anything the server did not confirm stays in the field so nothing is lost.
    setApiKeysInput(failedKeys);
    if (Object.keys(failedKeys).length > 0) {
      toast(`${Object.keys(failedKeys).length} API key${Object.keys(failedKeys).length === 1 ? "" : "s"} could not be saved; the text is still in the field.`, "error");
    } else if (keysSaved > 0) {
      toast(`${keysSaved} API key${keysSaved === 1 ? "" : "s"} saved.`, "success");
    }

    setSaved(true);
    if (profileSaved && preferencesSaved) {
      toast("Settings, preferences, and custom avatar saved.", "success");
    } else {
      const failed = [!profileSaved && "profile/avatar", !preferencesSaved && "preferences"].filter(Boolean).join(" and ");
      toast(`Your ${failed} could not be saved.`, "error");
    }
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => setShowKeys((p) => ({ ...p, [key]: !p[key] }));

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "engine", label: "Processing", icon: Cpu },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "preferences", label: "Theme", icon: Palette },
    { id: "privacy", label: "Privacy", icon: ShieldCheck },
    { id: "extension", label: "Extension", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
      {/* Top Header & Save Button */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Settings & Engine Control</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Profile, processing preferences, API keys, theme, privacy, and extension connection</p>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          className="h-9 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs active:scale-95"
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" /> Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3">
          {/* 1. PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Developer Profile</h3>
                <p className="text-xs text-muted-foreground">Manage your identity and persona configuration</p>
              </div>

              <div className="p-4 rounded-2xl border bg-card/60 space-y-4 shadow-xs">
                {/* Profile Image & Avatar Customization */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground block">Profile Avatar & Custom Photo</p>
                    <span className="text-[11px] text-muted-foreground">Upload your own photo or choose a preset</span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-xl bg-accent/30 border border-border/60">
                    {/* Active Avatar with Camera Overlay */}
                    <div className="relative group shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 rounded-2xl border-2 border-primary overflow-hidden bg-muted flex items-center justify-center shadow-md relative transition-transform group-hover:scale-105"
                        title="Click to upload custom photo"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        ) : avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt="Profile avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}

                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                          <Camera className="h-5 w-5" />
                          <span className="text-[9px] font-bold mt-0.5">Upload</span>
                        </div>
                      </button>
                    </div>

                    {/* Upload Actions & Presets */}
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <UploadCloud className="h-3.5 w-3.5" /> Upload Custom Photo
                        </button>
                        {avatar && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="h-8 px-2.5 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive text-xs font-medium transition-colors flex items-center gap-1 text-muted-foreground"
                          >
                            <X className="h-3 w-3" /> Reset
                          </button>
                        )}
                        <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP, SVG up to 2MB</span>
                      </div>

                      {/* Presets Grid */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Or select an AI Developer Preset:</span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: "Cyber Architect", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Architect&backgroundColor=06b6d4" },
                            { name: "Quantum Neural", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Quantum&backgroundColor=10b981" },
                            { name: "Deep Tech Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=DeepTech&backgroundColor=3b82f6" },
                            { name: "Matrix Hacker", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&backgroundColor=f59e0b" },
                            { name: "Neon Synth", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Synth&backgroundColor=ec4899" },
                            { name: "Pixel Dev", url: "https://api.dicebear.com/7.x/bottts/svg?seed=PixelDev&backgroundColor=8b5cf6" },
                            { name: "Neural AI", url: "https://api.dicebear.com/7.x/bottts/svg?seed=NeuralPulse&backgroundColor=06b6d4" },
                            { name: "Apex Lead", url: "https://api.dicebear.com/7.x/bottts/svg?seed=ApexLead&backgroundColor=f43f5e" },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handleSelectAvatar(preset.url)}
                              className={`w-9 h-9 rounded-xl border-2 overflow-hidden transition-all relative ${
                                avatar === preset.url
                                  ? "border-primary scale-105 shadow-sm ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/50 opacity-80 hover:opacity-100"
                              }`}
                              title={preset.name}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Avatar URL input */}
                      <div>
                        <input
                          type="text"
                          aria-label="External image URL"
                          value={avatar}
                          onChange={(e) => handleSelectAvatar(e.target.value)}
                          placeholder="Or paste external image URL (https://...)"
                          className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-ring font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border/50" />

                <div>
                  <label htmlFor="settings-full-name" className="text-xs font-semibold text-foreground mb-1.5 block">Full Name</label>
                  <input
                    id="settings-full-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring"
                  />
                </div>

                <div>
                  <label htmlFor="settings-email" className="text-xs font-semibold text-foreground mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <input
                      id="settings-email"
                      type="email"
                      value={email}
                      disabled
                      className="h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none opacity-60 cursor-not-allowed pr-24"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="settings-developer-role" className="text-xs font-semibold text-foreground mb-1.5 block">Developer Persona / Primary Role</label>
                  <select
                    id="settings-developer-role"
                    value={developerRole}
                    onChange={(e) => setDeveloperRole(e.target.value)}
                    className="h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring font-medium"
                  >
                    {developerRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Used to calibrate the assumptions in the prompts you generate.
                  </p>
                </div>
              </div>

              <hr className="border-border/60" />

              <div>
                <h4 className="font-semibold text-sm mb-3">Change Password</h4>
                <ChangePasswordForm />
              </div>

              <hr className="border-border/60" />

              <div>
                <h4 className="font-semibold text-sm mb-3">Sessions</h4>
                <SignOutEverywhere />
              </div>
            </div>
          )}

          {/* 1b. PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Privacy and data</h3>
                <p className="text-xs text-muted-foreground">What Prompt+ stores, and where</p>
              </div>

              <div className="p-4 rounded-2xl border bg-card/60 shadow-xs">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your API keys are encrypted with AES-256-GCM on the server and loaded on any device you sign in to. Your account, saved prompts, and usage history live in your Prompt+ account. The browser extension keeps its sign-in state in your browser, so you can sign out of it independently.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3 text-red-600">Danger Zone</h4>
                <DeleteAccountSection />
              </div>
            </div>
          )}

          {/* 1c. EXTENSION CONNECTION TAB */}
          {activeTab === "extension" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Extension connection</h3>
                <p className="text-xs text-muted-foreground">Install the browser extension and keep it connected to this account</p>
              </div>

              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 text-xs shadow-xs">
                <p className="text-muted-foreground leading-relaxed">
                  The extension works alongside ChatGPT, Claude, Gemini, and DeepSeek: compile a prompt there and insert it into the open chat. A compiled prompt is added to your Cloud Library when you click <span className="font-semibold text-foreground">Save to library</span>. Signing in to Prompt+ connects the extension to your account, quota, and library.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={EXTENSION_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Install from the Chrome Web Store
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("promptplus:request_sync"));
                        toast("Asked the extension to sync.", "success");
                      }
                    }}
                    className="h-8 px-3 rounded-lg border border-primary/30 hover:bg-primary/10 text-primary font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" /> Sync extension now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROCESSING TAB */}
          {activeTab === "engine" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Processing preferences</h3>
                <p className="text-xs text-muted-foreground">Choose the default engine, prompt strategy, output format, and cleanup rules Prompt+ applies</p>
              </div>

              <div className="space-y-4">
                {/* Engine Mode Selection */}
                <div className="p-4 rounded-2xl border bg-card/60 space-y-2.5 shadow-xs">
                  <p className="text-xs font-semibold text-foreground">Default Enhancement Engine Mode</p>
                  <div role="group" aria-label="Default enhancement engine mode" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: "api", name: "☁️ API Based", desc: "Cloud AI with Auto-Fallback" },
                      { id: "algorithmic", name: "⚙️ No-API Engine", desc: "100% Offline Rule Compiler" },
                      { id: "device", name: "⚡ On-Device", desc: "Chrome Gemini Nano AI" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={engineMode === m.id}
                        onClick={() => setEngineMode(m.id as "api" | "algorithmic" | "device")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          engineMode === m.id
                            ? "bg-primary/10 border-primary shadow-xs font-semibold text-foreground"
                            : "bg-background border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <span className="text-xs block font-bold text-foreground">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Strategy & Output Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border bg-card/60 space-y-2 shadow-xs">
                    <label htmlFor="settings-default-strategy" className="text-xs font-semibold text-foreground block">Default Prompt Strategy</label>
                    <select
                      id="settings-default-strategy"
                      value={defaultStrategy}
                      onChange={(e) => setDefaultStrategy(e.target.value as "structured" | "concise" | "model_tuned" | "detailed")}
                      className="h-9 w-full rounded-xl border bg-background px-3 text-xs outline-none focus:border-ring font-medium"
                    >
                      <option value="structured">Structured (Recommended)</option>
                      <option value="concise">Concise (High Token Efficiency)</option>
                      <option value="model_tuned">Model-Tuned (Claude XML / OpenAI)</option>
                      <option value="detailed">Detailed (Exhaustive Specification)</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border bg-card/60 space-y-2 shadow-xs">
                    <label htmlFor="settings-default-format" className="text-xs font-semibold text-foreground block">Preferred Output Contract Format</label>
                    <select
                      id="settings-default-format"
                      value={defaultFormat}
                      onChange={(e) => setDefaultFormat(e.target.value as "markdown" | "xml" | "json")}
                      className="h-9 w-full rounded-xl border bg-background px-3 text-xs outline-none focus:border-ring font-medium"
                    >
                      <option value="markdown">Markdown Headings & Fences</option>
                      <option value="xml">Anthropic Semantic XML Tags</option>
                      <option value="json">Structured JSON Schema</option>
                    </select>
                  </div>
                </div>

                {/* Power Toggles */}
                <div className="p-4 rounded-2xl border bg-card/60 space-y-4 shadow-xs">
                  <h4 className="text-xs font-semibold text-foreground">Loop Intelligence & Hygiene Toggles</h4>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs font-semibold text-foreground">AutoCorrect Developer Typos</p>
                      <p className="text-[11px] text-muted-foreground">Automatically fixes common developer typos (for example imrpove → improve, scrpaer → scraper)</p>
                    </div>
                    <ToggleSwitch checked={autoCorrectEnabled} onChange={() => setAutoCorrectEnabled(!autoCorrectEnabled)} label="AutoCorrect developer typos" />
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Zero-Fluff Meta Sanitizer</p>
                      <p className="text-[11px] text-muted-foreground">Eliminates Prompt IDs, dates, and introductory conversational filler</p>
                    </div>
                    <ToggleSwitch checked={zeroFluffEnabled} onChange={() => setZeroFluffEnabled(!zeroFluffEnabled)} label="Zero-Fluff Meta Sanitizer" />
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Compilation Sound Effects</p>
                      <p className="text-[11px] text-muted-foreground">Play subtle tactile audio tick upon Loop Engineering convergence</p>
                    </div>
                    <ToggleSwitch checked={soundEffectsEnabled} onChange={() => setSoundEffectsEnabled(!soundEffectsEnabled)} label="Compilation sound effects" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. API KEYS TAB */}
          {activeTab === "api-keys" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">API keys</h3>
                <p className="text-xs text-muted-foreground">Connect at least one provider key (OpenAI, Anthropic, Google Gemini, OpenRouter, or NVIDIA) to run cloud models. Keys are encrypted with AES-256-GCM on the server and load on any device you sign in to. Without a matching key the deterministic engine runs instead; keys are never swapped between providers.</p>
              </div>

              <div className="space-y-4">
                {providers.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border bg-card/60 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Get a ${p.name} API key`} className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {savedKeys[p.id] && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                            {savedKeyHints[p.id] || "••••••••"}
                          </span>
                          {keyStatus[p.id]?.status === "accepted" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Provider accepted
                            </span>
                          ) : keyStatus[p.id]?.status === "rejected" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500">
                              Provider rejected
                            </span>
                          ) : keyStatus[p.id]?.status === "unreachable" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                              Not reachable when tested
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
                              Saved · not tested
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeys[p.id] ? "text" : "password"}
                          aria-label={`${p.name} API key`}
                          value={apiKeysInput[p.id] || ""}
                          onChange={(e) => setApiKeysInput({ ...apiKeysInput, [p.id]: e.target.value })}
                          placeholder={savedKeys[p.id] ? `Enter new key to replace (${savedKeyHints[p.id] || "Encrypted & Active"})` : p.placeholder}
                          className="h-9 w-full rounded-xl border bg-background px-3 pr-9 text-xs outline-none focus:border-ring font-mono"
                        />
                        <button
                          type="button"
                          aria-label={showKeys[p.id] ? `Hide ${p.name} API key` : `Show ${p.name} API key`}
                          onClick={() => toggleKeyVisibility(p.id)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKeys[p.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Test Connection Button */}
                      <button
                        type="button"
                        onClick={() => handleTestApiKey(p.id)}
                        disabled={(!apiKeysInput[p.id]?.trim() && !savedKeys[p.id]) || isTestingKey[p.id]}
                        className="h-9 px-3 rounded-xl border bg-card text-xs font-semibold hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-1"
                        title={apiKeysInput[p.id]?.trim() ? "Test the key in the field" : "Test the saved key"}
                      >
                        {isTestingKey[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3 w-3 text-amber-500" />}
                        <span>Test</span>
                      </button>

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveApiKey(p.id)}
                        disabled={!apiKeysInput[p.id]?.trim() || isSavingKey[p.id]}
                        className="h-9 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
                      >
                        {isSavingKey[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                      </button>

                      {/* Delete Button */}
                      {savedKeys[p.id] && (
                        <button
                          type="button"
                          onClick={() => handleDeleteApiKey(p.id)}
                          aria-label={`Remove ${p.name} API key`}
                          className="h-9 px-2.5 rounded-xl border hover:bg-accent text-red-500 transition-colors"
                          title="Remove key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Test Result Message */}
                    {testResults[p.id] && (
                      <p className={`text-[11px] font-medium ${testResults[p.id].ok ? "text-emerald-500" : "text-red-500"}`}>
                        {testResults[p.id].msg}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. THEME TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Theme</h3>
                <p className="text-xs text-muted-foreground">Dark mode, plus the model and tone new prompts start with</p>
              </div>

              <div className="p-4 rounded-2xl border bg-card/60 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Dark Theme Mode</p>
                    <p className="text-[11px] text-muted-foreground">Toggle light/dark appearance</p>
                  </div>
                  <ToggleSwitch
                    checked={resolvedTheme === "dark"}
                    onChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    label="Dark theme mode"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3">Prompt defaults</h4>
                <div className="p-4 rounded-2xl border bg-card/60 space-y-4 shadow-xs">
                  <div>
                    <label htmlFor="settings-default-model" className="text-xs font-semibold text-foreground mb-1.5 block">Default Target Model</label>
                    <select
                      id="settings-default-model"
                      value={defaultModel}
                      onChange={(e) => setDefaultModel(e.target.value)}
                      className="h-9 w-full rounded-xl border bg-background px-3 text-xs outline-none focus:border-ring font-medium"
                    >
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{getModelDisplayLabel(m)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settings-default-tone" className="text-xs font-semibold text-foreground mb-1.5 block">Default Prompt Tone</label>
                    <select
                      id="settings-default-tone"
                      value={defaultTone}
                      onChange={(e) => setDefaultTone(e.target.value)}
                      className="h-9 w-full rounded-xl border bg-background px-3 text-xs outline-none focus:border-ring font-medium"
                    >
                      <option value="">Auto (Default)</option>
                      {["Professional", "Casual", "Friendly", "Formal", "Technical", "Creative"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Notification Channels</h3>
                <p className="text-xs text-muted-foreground">Manage your in-app and email alert preferences</p>
              </div>

              <div className="p-4 rounded-2xl border bg-card/60 space-y-4 shadow-xs">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Email Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Receive critical email notifications regarding your account</p>
                  </div>
                  <ToggleSwitch checked={notifEmail} onChange={() => setNotifEmail(!notifEmail)} label="Email notifications" />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Optimization & Quota Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Get notified when reaching monthly free quota milestones</p>
                  </div>
                  <ToggleSwitch checked={notifUsage} onChange={() => setNotifUsage(!notifUsage)} label="Optimization and quota alerts" />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Weekly Intelligence Digest</p>
                    <p className="text-[11px] text-muted-foreground">Receive a weekly summary of your prompt velocity and model efficiency</p>
                  </div>
                  <ToggleSwitch checked={notifDigest} onChange={() => setNotifDigest(!notifDigest)} label="Weekly intelligence digest" />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Product & Extension Updates</p>
                    <p className="text-[11px] text-muted-foreground">Receive announcements when new AI models or extension versions are released</p>
                  </div>
                  <ToggleSwitch checked={notifUpdates} onChange={() => setNotifUpdates(!notifUpdates)} label="Product and extension updates" />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Security & Login Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Get alerted upon new device logins and password updates</p>
                  </div>
                  <ToggleSwitch checked={notifSecurity} onChange={() => setNotifSecurity(!notifSecurity)} label="Security and login alerts" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
