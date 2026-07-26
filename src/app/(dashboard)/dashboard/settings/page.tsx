"use client";

import { useState, useEffect } from "react";
import { User, Key, Bell, Palette, Save, Eye, EyeOff, Check, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";

type SettingsTab = "profile" | "api-keys" | "preferences" | "notifications";

type ProviderInfo = { id: "openai" | "anthropic" | "google" | "openrouter"; name: string; placeholder: string; url: string };
const providers: ProviderInfo[] = [
  { id: "openai", name: "OpenAI", placeholder: "sk-...", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", url: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google AI", placeholder: "AIza...", url: "https://makersuite.google.com/app/apikey" },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-v1-...", url: "https://openrouter.ai/keys" },
];

type ToggleDef = { id: string; title: string; description: string };
const notificationToggles: ToggleDef[] = [
  { id: "email", title: "Email Notifications", description: "Receive email updates about your account" },
  { id: "usage", title: "Usage Alerts", description: "Get notified when approaching daily limits" },
  { id: "digest", title: "Weekly Digest", description: "Receive a weekly summary of your activity" },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-10 h-6 rounded-full transition-colors ${checked ? "bg-foreground" : "bg-muted"}`}>
      <div className={`w-4 h-4 rounded-full bg-background transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const { setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [apiKeysInput, setApiKeysInput] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSavingKey, setIsSavingKey] = useState<Record<string, boolean>>({});
  const [defaultModel, setDefaultModel] = useState("gpt-4");
  const [defaultTone, setDefaultTone] = useState("");
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ email: true, usage: true, digest: false });

  useEffect(() => {
    if (session?.user?.name || session?.user?.email) {
      queueMicrotask(() => {
        if (session?.user?.name) setName(session.user.name);
        if (session?.user?.email) setEmail(session.user.email);
      });
    }
  }, [session?.user?.name, session?.user?.email]);

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
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("promptplus_user_apikeys");
            if (raw) {
              const localMap = JSON.parse(raw);
              Object.keys(localMap).forEach((p) => {
                if (localMap[p]) keyMap[p] = true;
              });
            }
          } catch {
            // ignore
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

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("promptplus_user_apikeys") || "{}";
          const localMap = JSON.parse(raw);
          localMap[provider] = rawKey.trim();
          localStorage.setItem("promptplus_user_apikeys", JSON.stringify(localMap));
        } catch {
          // ignore
        }
      }

      setSavedKeys((prev) => ({ ...prev, [provider]: true }));
      setApiKeysInput((prev) => ({ ...prev, [provider]: "" }));
    } finally {
      setIsSavingKey((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    try {
      await fetch(`/api/v1/api-keys?provider=${provider}`, { method: "DELETE" });
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("promptplus_user_apikeys") || "{}";
          const localMap = JSON.parse(raw);
          delete localMap[provider];
          localStorage.setItem("promptplus_user_apikeys", JSON.stringify(localMap));
        } catch {
          // ignore
        }
      }
      setSavedKeys((prev) => ({ ...prev, [provider]: false }));
      setApiKeysInput((prev) => ({ ...prev, [provider]: "" }));
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => setShowKeys((p) => ({ ...p, [key]: !p[key] }));

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const models = [
    { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
    { id: "claude-3", name: "Claude 3", provider: "Anthropic" },
    { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
    { id: "grok", name: "Grok", provider: "xAI" },
    { id: "deepseek", name: "DeepSeek", provider: "DeepSeek" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Settings</h2>
          <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" /> Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-accent font-medium"
                  : "hover:bg-accent/50 text-muted-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-sm mb-1">Profile</h2>
                <p className="text-xs text-muted-foreground">Manage your personal information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plan</label>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Free Tier</p>
                        <p className="text-xs text-muted-foreground">20 enhancements per day</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-muted">Current</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "api-keys" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-sm mb-1">API Keys</h2>
                <p className="text-xs text-muted-foreground">Connect your own AI provider keys for unlimited usage</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p>Your API keys are stored securely with AES-256-GCM encryption and never shared. They are used only for your requests.</p>
              </div>

              <div className="space-y-4">
                {providers.map((p) => (
                  <div key={p.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{p.name}</span>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {savedKeys[p.id] && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Connected</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeys[p.id] ? "text" : "password"}
                          value={apiKeysInput[p.id] || ""}
                          onChange={(e) => setApiKeysInput({ ...apiKeysInput, [p.id]: e.target.value })}
                          placeholder={savedKeys[p.id] ? "••••••••••••••••" : p.placeholder}
                          className="h-9 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(p.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKeys[p.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveApiKey(p.id)}
                        disabled={!apiKeysInput[p.id]?.trim() || isSavingKey[p.id]}
                        className="h-9 px-3 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
                      >
                        {isSavingKey[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                      </button>
                      {savedKeys[p.id] && (
                        <button
                          type="button"
                          onClick={() => handleDeleteApiKey(p.id)}
                          className="h-9 px-2 rounded-lg border hover:bg-accent text-red-600 transition-colors"
                          title="Remove key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-sm mb-1">Preferences</h2>
                <p className="text-xs text-muted-foreground">Customize your experience</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default Model</label>
                  <select
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default Tone</label>
                  <select
                    value={defaultTone}
                    onChange={(e) => setDefaultTone(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="">None</option>
                    {["Professional", "Casual", "Friendly", "Formal", "Technical", "Creative"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="text-sm font-medium">Auto-analyze on type</p>
                    <p className="text-xs text-muted-foreground">Automatically analyze prompt as you type</p>
                  </div>
                  <ToggleSwitch checked={autoEnhance} onChange={() => setAutoEnhance(!autoEnhance)} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Toggle light/dark theme preference</p>
                  </div>
                  <ToggleSwitch
                    checked={resolvedTheme === "dark"}
                    onChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-sm mb-1">Notifications</h2>
                <p className="text-xs text-muted-foreground">Manage notification preferences</p>
              </div>

              <div className="space-y-3">
                {notificationToggles.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                    <ToggleSwitch checked={toggles[t.id]} onChange={() => setToggles({ ...toggles, [t.id]: !toggles[t.id] })} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
