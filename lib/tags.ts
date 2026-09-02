const TAG_MAX = 10;

export function normalizeTags(raw: unknown): string[] {
  const parts: string[] = [];
  const push = (value: string) => {
    value
      .split(/[,#]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach((item) => {
        if (!parts.includes(item) && parts.length < TAG_MAX) parts.push(item);
      });
  };

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (item && typeof item === "object" && "name" in (item as object)) {
        push(String((item as { name?: string }).name || ""));
      } else {
        push(String(item ?? ""));
      }
    });
  } else if (typeof raw === "string") {
    push(raw);
  } else if (raw && typeof raw === "object") {
    Object.values(raw as Record<string, unknown>).forEach((item) => {
      if (item != null) push(String(item));
    });
  }

  return parts;
}
