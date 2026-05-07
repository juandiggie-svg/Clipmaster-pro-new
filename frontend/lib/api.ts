const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export async function callClaude(
  prompt: string,
  opts?: { maxTokens?: number; images?: string[] }
): Promise<string> {
  if (!BASE) {
    throw new Error('Backend URL not configured. Restart the app and try again.');
  }
  const url = `${BASE}/api/claude`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: opts?.maxTokens ?? 1200,
        images: opts?.images,
      }),
    });
  } catch {
    throw new Error('No internet connection. Check your network and try again.');
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (res.status === 404) {
      throw new Error(`API not found (404) at ${url}. The backend may be sleeping — pull-to-refresh and try again.`);
    }
    if (res.status === 429) throw new Error("You're generating too fast — wait a moment.");
    if (res.status >= 500) throw new Error('Claude is having trouble. Try again in a few seconds.');
    throw new Error(`Request failed (${res.status}). ${txt.slice(0, 120)}`);
  }
  const data = await res.json();
  if (!data?.text) throw new Error('Got an empty response. Please regenerate.');
  return data.text as string;
}

export type TrackedPost = {
  id: string;
  device_id: string;
  platform: string;
  type: string;
  topic: string;
  likes: string;
  comments?: string;
  reach?: string;
  date: string;
};

export async function listPosts(deviceId: string): Promise<TrackedPost[]> {
  const r = await fetch(`${BASE}/api/posts?device_id=${encodeURIComponent(deviceId)}`);
  if (!r.ok) return [];
  return r.json();
}

export async function createPost(p: Omit<TrackedPost, 'id' | 'date'>): Promise<TrackedPost> {
  const r = await fetch(`${BASE}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error('Failed to save post');
  return r.json();
}

export async function deletePost(id: string, deviceId: string) {
  await fetch(`${BASE}/api/posts/${id}?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
}
