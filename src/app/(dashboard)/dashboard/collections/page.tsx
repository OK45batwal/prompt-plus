"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Folder, FileText, MoreHorizontal, Trash2, Edit, ChevronRight } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string;
  promptCount: number;
  icon: string;
  color: string;
  createdAt: string;
}

const mockCollections: Collection[] = [
  {
    id: "1",
    name: "Blog Writing",
    description: "Prompts for creating blog posts and articles",
    promptCount: 12,
    icon: "📝",
    color: "#3b82f6",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Email Templates",
    description: "Professional email prompts",
    promptCount: 8,
    icon: "📧",
    color: "#10b981",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    name: "Code Review",
    description: "Prompts for code analysis and review",
    promptCount: 15,
    icon: "💻",
    color: "#8b5cf6",
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    name: "Marketing",
    description: "Marketing and sales prompts",
    promptCount: 6,
    icon: "📈",
    color: "#f59e0b",
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    name: "Social Media",
    description: "Social media content prompts",
    promptCount: 10,
    icon: "📱",
    color: "#ec4899",
    createdAt: "2024-01-11",
  },
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState(mockCollections);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const deleteCollection = (id: string) => {
    setCollections(collections.filter((c) => c.id !== id));
  };

  const createCollection = () => {
    if (!newName.trim()) return;
    const newCollection: Collection = {
      id: `new-${Date.now()}`,
      name: newName,
      description: newDescription,
      promptCount: 0,
      icon: "📁",
      color: "#6b7280",
      createdAt: new Date().toISOString(),
    };
    setCollections([newCollection, ...collections]);
    setNewName("");
    setNewDescription("");
    setShowNewModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Collections</h1>
            <p className="text-xs text-muted-foreground">{collections.length} collections</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New Collection
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Collections Grid */}
        {collections.length === 0 ? (
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
                    <button className="p-1 hover:bg-accent rounded">
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
                        width: `${Math.min(100, (collection.promptCount / 20) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Collection Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm bg-background rounded-lg border p-4">
            <h2 className="font-semibold text-sm mb-4">New Collection</h2>
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
