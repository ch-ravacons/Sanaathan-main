const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  async createPost(input: {
    userId: string;
    content: string;
    spiritualTopic?: string | null;
    tags?: string[];
  }) {
    const response = await fetch(`${API_BASE}/api/v1/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return handleResponse<{ post: any }>(response);
  },

  async listPosts(params: { userId?: string; interests?: string[]; limit?: number; mine?: boolean }) {
    const url = new URL(`${API_BASE}/api/v1/posts`);
    if (params.userId) url.searchParams.set('userId', params.userId);
    if (params.limit) url.searchParams.set('limit', String(params.limit));
    if (params.interests?.length) {
      params.interests.forEach((interest) => url.searchParams.append('interests', interest));
    }
    if (typeof params.mine === 'boolean') {
      url.searchParams.set('mine', String(params.mine));
    }

    const response = await fetch(url.toString());
    return handleResponse<{ posts: any[]; recommendations?: any[] }>(response);
  },

  async askAgent(input: { agent: 'rag' | 'kag'; query: string; userId?: string }) {
    const response = await fetch(`${API_BASE}/api/v1/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return handleResponse(response);
  }
};
