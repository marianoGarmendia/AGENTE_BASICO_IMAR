import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const CLIENT_ID = process.env.ZOHO_CLIENT_ID || "";
const REDIRECT_URI = process.env.AUTHORIZED_URI_REDIRECT || "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || "";


type TokenData = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // timestamp en ms
};


let tokenData: TokenData | null = null;

const TOKEN_EXPIRATION_BUFFER_MS = 60 * 1000; // 1 minuto de margen

// Simulación de una llamada HTTP para refrescar token
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenData> {
  const url = "https://accounts.zoho.com/oauth/v2/token";

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();
    console.log("Access Token:", data?.access_token);
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken, // puede que no cambie
      accessTokenExpiresAt: Date.now() + 3600 * 1000, // suponemos que dura 1 hora
    };
  } catch (error) {
    console.error("Failed to refresh Zoho token:", error);
    throw new Error("Failed to refresh Zoho token");
  }
}

export async function getValidAccessToken(): Promise<string> {
  if (
    !tokenData ||
    Date.now() + TOKEN_EXPIRATION_BUFFER_MS >= tokenData.accessTokenExpiresAt
  ) {
    if (!tokenData?.refreshToken) {
      throw new Error("No hay refresh token disponible para renovar el access token");
    }

    console.log("🔁 Access token expirado o por expirar. Renovando...");
    tokenData = await refreshAccessToken(tokenData.refreshToken);
    console.log("✅ Token renovado correctamente.");
  }

  return tokenData.accessToken;
}

// Método para setear inicialmente los tokens
export function initializeTokenSession(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  tokenData = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: Date.now() + 3600 * 1000, // 1 hora a partir de ahora
  };

  console.log("Token inicializado:", tokenData);
  
}
