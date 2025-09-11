/**
 * authFetch - Wrapper para fetch que adiciona automaticamente o token JWT no header Authorization.
 * Uso: import { authFetch } from '../api/authFetch'
 * await authFetch(url, { method, body, ... })
 */
export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) || {}),
  };

  if (token && token !== "homolog-token") {
    headers["Authorization"] = "Bearer " + token;
  }

  // Para homologação, pode simular dados aqui se desejar

  return fetch(input, { ...init, headers });
}

/**
 * Retorna o usuário logado (objeto salvo no localStorage após login)
 */
export function getCurrentUser(): {
  id: number;
  nome: string;
  email: string;
  cargo_superior: boolean;
  administrador_geral: boolean;
  calculadora_liberada: boolean;
  relatorio_liberado: boolean;
} | null {
  const user = localStorage.getItem("user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}
