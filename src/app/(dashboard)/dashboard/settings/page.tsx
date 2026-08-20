"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { MODELS, DEFAULT_MODEL_ID, getModelDisplayLabel } from "@/lib/models";
import { UserPreferences } from "@/app/api/v1/user/preferences/route";

type SettingsTab = "profile" | "engine" | "api-keys" | "preferences" | "notifications";

type ProviderInfo = { id: "openai" | "anthropic" | "google" | "openrouter" | "nvidia"; name: string; placeholder: string; url: string };
const providers: ProviderInfo[] = [
  { id: "openai", name: "OpenAI", placeholder: "sk-...", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", url: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google AI", placeholder: "AIza...", url: "https://makersuite.google.com/app/apikey" },
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

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
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
      setMessage({ text: "Password updated successfully", err: false });
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
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
      />
      <input
        type="password"
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
  const [avatar, setAvatar] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pp_user_avatar") || "";
    }
    return "";
  });
  const [developerRole, setDeveloperRole] = useState("Prompt Architect");

  // API Keys state
  const [apiKeysInput, setApiKeysInput] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSavingKey, setIsSavingKey] = useState<Record<string, boolean>>({});
  const [isTestingKey, setIsTestingKey] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

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
    }
    loadUserPrefs();
    return () => {
      active = false;
    };
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
        if (res.ok && isMounted) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            json.data.forEach((k: { provider: string; isActive: boolean }) => {
              keyMap[k.provider] = k.isActive;
            });
          }
        }
        if (isMounted) setSavedKeys(keyMap);
      } catch {
        // ignore
      }
    }
    fetchKeys();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTestApiKey = async (provider: string) => {
    const rawKey = apiKeysInput[provider];
    if (!rawKey?.trim()) return;

    setIsTestingKey((prev) => ({ ...prev, [provider]: true }));
    setTestResults((prev) => ({ ...prev, [provider]: { ok: false, msg: "" } }));
    try {
      const res = await fetch("/api/v1/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: rawKey }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { ok: true, msg: "✓ Key syntax verified & connected" },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { ok: false, msg: json.error || "Invalid key format" },
        }));
      }
    } finally {
      setIsTestingKey((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSaveApiKey = async (provider: string) => {
    const rawKey = apiKeysInput[provider];
    if (!rawKey?.trim()) return;

    setIsSavingKey((prev) => ({ ...prev, [provider]: true }));
    try {
      await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: rawKey }),
      });

      setSavedKeys((prev) => ({ ...prev, [provider]: true }));
      setApiKeysInput((prev) => ({ ...prev, [provider]: "" }));
      setTestResults((prev) => ({ ...prev, [provider]: { ok: true, msg: "Saved!" } }));
      toast(`API key saved for ${provider.toUpperCase()}!`, "success");
    } finally {
      setIsSavingKey((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    try {
      await fetch(`/api/v1/api-keys?provider=${provider}`, { method: "DELETE" });
      setSavedKeys((prev) => ({ ...prev, [provider]: false }));
      setApiKeysInput((prev) => ({ ...prev, [provider]: "" }));
      setTestResults((prev) => ({ ...prev, [provider]: { ok: false, msg: "" } }));
      toast(`API key removed for ${provider.toUpperCase()}`, "info");
    } catch {
      // ignore
    }
  };

  const handleSelectAvatar = (url: string) => {
    setAvatar(url);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_user_avatar", url);
      window.dispatchEvent(new Event("promptplus:avatar_updated"));
    }
  };

  const handleSaveAll = async () => {
    // 1. Save Profile & Avatar
    await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar }),
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("pp_user_avatar", avatar);
      window.dispatchEvent(new Event("promptplus:avatar_updated"));
    }

    // 2. Save Preferences
    await fetch("/api/v1/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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

    // 3. Save any pending API keys
    const pendingKeys = Object.entries(apiKeysInput).filter(([, v]) => v?.trim());
    if (pendingKeys.length > 0) {
      for (const [prov, val] of pendingKeys) {
        try {
          await fetch("/api/v1/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: prov, apiKey: val.trim() }),
          });
          setSavedKeys((prev) => ({ ...prev, [prov]: true }));
        } catch {
          // ignore
        }
      }
      setApiKeysInput({});
    }

    setSaved(true);
    toast("Settings, preferences, and API keys saved successfully!", "success");
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => setShowKeys((p) => ({ ...p, [key]: !p[key] }));

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "engine", label: "AI Engine", icon: Cpu },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
      {/* Top Header & Save Button */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Settings & Engine Control</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your developer profile, engine defaults, and notification channels</p>
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
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
                {/* Profile Image & Avatar Presets */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block">Profile Avatar</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Active Avatar Preview */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl border-2 border-primary overflow-hidden bg-muted flex items-center justify-center shadow-sm shrink-0">
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt="Profile avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="flex-1 space-y-2">
                      <span className="text-[11px] text-muted-foreground font-medium block">Choose an AI Developer Avatar preset:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: "Cyber Architect", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Architect&backgroundColor=6366f1" },
                          { name: "Quantum Neural", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Quantum&backgroundColor=10b981" },
                          { name: "Deep Tech Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=DeepTech&backgroundColor=3b82f6" },
                          { name: "Matrix Hacker", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&backgroundColor=f59e0b" },
                          { name: "Neon Synth", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Synth&backgroundColor=ec4899" },
                          { name: "Pixel Dev", url: "https://api.dicebear.com/7.x/bottts/svg?seed=PixelDev&backgroundColor=8b5cf6" },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleSelectAvatar(preset.url)}
                            className={`w-9 h-9 rounded-xl border-2 overflow-hidden transition-all relative ${
                              avatar === preset.url
                                ? "border-primary scale-105 shadow-xs"
                                : "border-border hover:border-primary/50 opacity-80 hover:opacity-100"
                            }`}
                            title={preset.name}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* Custom Avatar URL input */}
                      <div className="pt-1">
                        <input
                          type="text"
                          value={avatar}
                          onChange={(e) => handleSelectAvatar(e.target.value)}
                          placeholder="Or paste custom image/avatar URL (https://...)"
                          className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-ring font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border/50" />

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <input
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
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Developer Persona / Primary Role</label>
                  <select
                    value={developerRole}
                    onChange={(e) => setDeveloperRole(e.target.value)}
                    className="h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring font-medium"
                  >
                    {developerRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Used to automatically calibrate domain assumptions in PromptIR synthesis.
                  </p>
                </div>
              </div>

              {/* Cross-AI Extension Handoff Card */}
              <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-2.5 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-500 flex items-center gap-1.5">
                    <Zap className="h-4 w-4" /> Cross-AI Context Bridge Active
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                    Extension v1.3.2
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Carry active chat memory between ChatGPT, Claude 3.5 Sonnet, Gemini 2.0, and DeepSeek seamlessly. Use the <strong>📦 Capture Memory</strong> floating bar in the Chrome extension.
                </p>
              </div>

              <hr className="border-border/60" />

              <div>
                <h4 className="font-semibold text-sm mb-3">Change Password</h4>
                <ChangePasswordForm />
              </div>

              <hr className="border-border/60" />

              <div>
                <h4 className="font-semibold text-sm mb-3 text-red-600">Danger Zone</h4>
                <DeleteAccountSection />
              </div>
            </div>
          )}

          {/* 2. AI ENGINE POWER TAB */}
          {activeTab === "engine" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Prompt+ AI Engine Defaults</h3>
                <p className="text-xs text-muted-foreground">Configure the compiler strategy, Loop Engineering cycles, and auto-cleaners</p>
              </div>

              <div className="space-y-4">
                {/* Engine Mode Selection */}
                <div className="p-4 rounded-2xl border bg-card/60 space-y-2.5 shadow-xs">
                  <label className="text-xs font-semibold text-foreground block">Default Enhancement Engine Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: "api", name: "☁️ API Based", desc: "Cloud AI with Auto-Fallback" },
                      { id: "algorithmic", name: "⚙️ No-API Engine", desc: "100% Offline Rule Compiler" },
                      { id: "device", name: "⚡ On-Device", desc: "Chrome Gemini Nano AI" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
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
                    <label className="text-xs font-semibold text-foreground block">Default Prompt Strategy</label>
                    <select
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
                    <label className="text-xs font-semibold text-foreground block">Preferred Output Contract Format</label>
                    <select
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
                      <p className="text-[11px] text-muted-foreground">Automatically fixes 150+ developer terms (e.g. imrpove → improve, scrpaer → scraper)</p>
                    </div>
                    <ToggleSwitch checked={autoCorrectEnabled} onChange={() => setAutoCorrectEnabled(!autoCorrectEnabled)} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Zero-Fluff Meta Sanitizer</p>
                      <p className="text-[11px] text-muted-foreground">Eliminates Prompt IDs, dates, and introductory conversational filler</p>
                    </div>
                    <ToggleSwitch checked={zeroFluffEnabled} onChange={() => setZeroFluffEnabled(!zeroFluffEnabled)} />
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Compilation Sound Effects</p>
                      <p className="text-[11px] text-muted-foreground">Play subtle tactile audio tick upon Loop Engineering convergence</p>
                    </div>
                    <ToggleSwitch checked={soundEffectsEnabled} onChange={() => setSoundEffectsEnabled(!soundEffectsEnabled)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. API KEYS TAB */}
          {activeTab === "api-keys" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>🟢 Free Out-Of-The-Box Mode Active</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Prompt+ works 100% free with server-managed AI models. Custom API keys are strictly optional for paid overrides.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Cross-Device Cloud Sync Guarantee</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  All saved API keys are encrypted with AES-256 on your account. When you log in on any new device or computer, Prompt+ automatically loads and uses your connected keys in the background without exposing raw secret tokens on screen.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Custom API Credentials</h3>
                <p className="text-xs text-muted-foreground">Optional: Connect your personal API keys for dedicated rate limits</p>
              </div>

              <div className="space-y-4">
                {providers.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border bg-card/60 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {savedKeys[p.id] && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Connected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeys[p.id] ? "text" : "password"}
                          value={apiKeysInput[p.id] || ""}
                          onChange={(e) => setApiKeysInput({ ...apiKeysInput, [p.id]: e.target.value })}
                          placeholder={savedKeys[p.id] ? "•••••••••••••••• (Encrypted & Active)" : p.placeholder}
                          className="h-9 w-full rounded-xl border bg-background px-3 pr-9 text-xs outline-none focus:border-ring font-mono"
                        />
                        <button
                          type="button"
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
                        disabled={!apiKeysInput[p.id]?.trim() || isTestingKey[p.id]}
                        className="h-9 px-3 rounded-xl border bg-card text-xs font-semibold hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-1"
                        title="Test API Key"
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

          {/* 4. PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm">Theme & Interface Preferences</h3>
                <p className="text-xs text-muted-foreground">Customize your visual studio theme and models</p>
              </div>

              <div className="p-4 rounded-2xl border bg-card/60 space-y-4 shadow-xs">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Default Target Model</label>
                  <select
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
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Default Prompt Tone</label>
                  <select
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

                <div className="flex items-center justify-between p-3.5 rounded-xl border bg-background">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Dark Theme Mode</p>
                    <p className="text-[11px] text-muted-foreground">Toggle light/dark appearance</p>
                  </div>
                  <ToggleSwitch
                    checked={resolvedTheme === "dark"}
                    onChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  />
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
                  <ToggleSwitch checked={notifEmail} onChange={() => setNotifEmail(!notifEmail)} />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Optimization & Quota Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Get notified when reaching monthly free quota milestones</p>
                  </div>
                  <ToggleSwitch checked={notifUsage} onChange={() => setNotifUsage(!notifUsage)} />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Weekly Intelligence Digest</p>
                    <p className="text-[11px] text-muted-foreground">Receive a weekly summary of your prompt velocity and model efficiency</p>
                  </div>
                  <ToggleSwitch checked={notifDigest} onChange={() => setNotifDigest(!notifDigest)} />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Product & Extension Updates</p>
                    <p className="text-[11px] text-muted-foreground">Receive announcements when new AI models or extension versions are released</p>
                  </div>
                  <ToggleSwitch checked={notifUpdates} onChange={() => setNotifUpdates(!notifUpdates)} />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Security & Login Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Get alerted upon new device logins and password updates</p>
                  </div>
                  <ToggleSwitch checked={notifSecurity} onChange={() => setNotifSecurity(!notifSecurity)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
