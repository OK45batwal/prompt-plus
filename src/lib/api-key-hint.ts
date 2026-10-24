export function createKeyHint(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return `••••${trimmed.slice(-3)}`;
  }
  let prefix = "";
  if (trimmed.startsWith("sk-proj-")) {
    prefix = "sk-proj-";
  } else if (trimmed.startsWith("sk-ant-")) {
    prefix = "sk-ant-";
  } else if (trimmed.startsWith("sk-")) {
    prefix = "sk-";
  } else if (trimmed.startsWith("AIza")) {
    prefix = "AIza";
  } else if (trimmed.startsWith("nvapi-")) {
    prefix = "nvapi-";
  } else {
    prefix = trimmed.slice(0, 3);
  }
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

export type KeyValidationStatus = "accepted" | "rejected" | "unreachable";
