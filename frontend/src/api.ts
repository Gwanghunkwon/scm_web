const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: email,
      password,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '로그인에 실패했습니다.');
  }

  const data = (await res.json()) as LoginResponse;
  return data.access_token;
}

export type MeResponse = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export async function fetchMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('사용자 정보를 가져오지 못했습니다.');
  }

  return (await res.json()) as MeResponse;
}

// 품목 API
export type Item = {
  id: number;
  code: string;
  name: string;
  type: string;
  uom: string;
  safety_stock_qty: number;
  lead_time_days: number;
  is_active: boolean;
};

export type ItemCreateInput = Omit<Item, 'id'>;

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API_BASE_URL}/api/items`);
  if (!res.ok) {
    throw new Error('품목 목록을 가져오지 못했습니다.');
  }
  return (await res.json()) as Item[];
}

export async function createItem(input: ItemCreateInput): Promise<Item> {
  const res = await fetch(`${API_BASE_URL}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '품목 생성에 실패했습니다.');
  }
  return (await res.json()) as Item;
}

