"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Key, Bell, Palette, Shield, Save, Eye, EyeOff, Check, ExternalLink, Copy } from "lucide-react";

type SettingsTab = "profile" | "api-keys" | "preferences" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("demo@example.com");

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Preferences state
  const [defaultModel, setDefaultModel] = useState("gpt-4");
  const [defaultTone, setDefaultTone] = useState("");
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maskKey = (key: string) => {
    if (!key) return "Not set";
    if (showKeys[key]) return key;
    return key.slice(0, 8) + "..." + key.slice(-4);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
          </div>
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
      </header>

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
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
                <p>Your API keys are stored securely and never shared. They are used only for your requests.</p>
              </div>

              <div className="space-y-4">
                {/* OpenAI */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">OpenAI</span>
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {openaiKey && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Connected</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys.openai ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="h-9 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility("openai")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {openaiKey && (
                      <button
                        onClick={() => copyKey(openaiKey)}
                        className="h-9 px-2 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Anthropic */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Anthropic</span>
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {anthropicKey && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Connected</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys.anthropic ? "text" : "password"}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="h-9 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility("anthropic")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {anthropicKey && (
                      <button
                        onClick={() => copyKey(anthropicKey)}
                        className="h-9 px-2 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Google */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Google AI</span>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {googleKey && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Connected</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys.google ? "text" : "password"}
                        value={googleKey}
                        onChange={(e) => setGoogleKey(e.target.value)}
                        placeholder="AIza..."
                        className="h-9 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility("google")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {googleKey && (
                      <button
                        onClick={() => copyKey(googleKey)}
                        className="h-9 px-2 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
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
                  <button
                    onClick={() => setAutoEnhance(!autoEnhance)}
                    className={`w-10 h-6 rounded-full transition-colors ${autoEnhance ? "bg-foreground" : "bg-muted"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background transition-transform ${autoEnhance ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Toggle dark mode theme</p>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-10 h-6 rounded-full transition-colors ${darkMode ? "bg-foreground" : "bg-muted"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background transition-transform ${darkMode ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
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
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive email updates about your account</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`w-10 h-6 rounded-full transition-colors ${emailNotifications ? "bg-foreground" : "bg-muted"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background transition-transform ${emailNotifications ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="text-sm font-medium">Usage Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified when approaching daily limits</p>
                  </div>
                  <button
                    onClick={() => setUsageAlerts(!usageAlerts)}
                    className={`w-10 h-6 rounded-full transition-colors ${usageAlerts ? "bg-foreground" : "bg-muted"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background transition-transform ${usageAlerts ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="text-sm font-medium">Weekly Digest</p>
                    <p className="text-xs text-muted-foreground">Receive a weekly summary of your activity</p>
                  </div>
                  <button
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`w-10 h-6 rounded-full transition-colors ${weeklyDigest ? "bg-foreground" : "bg-muted"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background transition-transform ${weeklyDigest ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
