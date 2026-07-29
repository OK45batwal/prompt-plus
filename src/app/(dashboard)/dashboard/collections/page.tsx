"use client";

import { useState, useEffect } from "react";
import { Plus, Folder, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Collection {
  id: string;
  name: string;
  description: string;
  promptCount: number;
  icon: string;
  color: string;
  createdAt: string;
}

export default function CollectionsPage() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/v1/collections");
      const json = await res.json();
      const data: Collection[] = (json.data || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        promptCount: item.prompt_count ?? 0,
        icon: item.icon || "📁",
        color: item.color || "#6b7280",
        createdAt: item.createdAt,
      }));
      setCollections(data);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/v1/collections");
        const json = await res.json();
        const data: Collection[] = (json.data || []).map((item: Record<string, unknown>) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          promptCount: item.prompt_count ?? 0,
          icon: item.icon || "📁",
          color: item.color || "#6b7280",
          createdAt: item.createdAt,
        }));
        setCollections(data);
      } catch {
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const deleteCollection = async (id: string) => {
    try {
      await fetch(`/api/v1/collections/${id}`, { method: "DELETE" });
      setCollections((prev) => prev.filter((c) => c.id !== id));
      toast("Collection deleted", "success");
    } catch {
      toast("Failed to delete collection", "error");
    }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/v1/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });
      setNewName("");
      setNewDescription("");
      setShowNewModal(false);
      await fetchCollections();
      toast("Collection created", "success");
    } catch {
      toast("Failed to create collection", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Collections</h2>
          <p className="text-xs text-muted-foreground">{collections.length} collections</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New Collection
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
              <div className="flex items-start gap-2 mb-3">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full mb-3" />
              <div className="h-1 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No collections yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first collection to organize prompts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{collection.icon}</span>
                  <div>
                    <h3 className="font-medium text-sm">{collection.name}</h3>
                    <p className="text-xs text-muted-foreground">{collection.promptCount} prompts</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {
                    const newName = prompt("New name for this collection:", collection.name);
                    if (newName && newName.trim()) {
                      fetch(`/api/v1/collections/${collection.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newName.trim() }),
                      }).then(() => {
                        setCollections((prev) => prev.map((c) => c.id === collection.id ? { ...c, name: newName.trim() } : c));
                        toast("Collection renamed", "success");
                      }).catch(() => toast("Failed to rename", "error"));
                    }
                  }} className="p-1 hover:bg-accent rounded">
                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteCollection(collection.id)}
                    className="p-1 hover:bg-accent rounded text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{collection.description}</p>
              <div className="flex items-center justify-between">
                <div
                  className="w-full h-1 rounded-full"
                  style={{ backgroundColor: collection.color + "30" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: collection.color,
                      width: `${Math.min(100, collections.length > 0 ? (collection.promptCount / Math.max(...collections.map((c) => c.promptCount))) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">New Collection</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewModal(false)}
                className="h-8 px-3 text-xs font-medium rounded-lg border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCollection}
                className="h-8 px-3 text-xs font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
