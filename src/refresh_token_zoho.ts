
import dotenv from 'dotenv';
dotenv.config();
const CLIENT_ID = process.env.ZOHO_CLIENT_ID || "";
const REDIRECT_URI = process.env.AUTHORIZED_URI_REDIRECT || "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || ""
const scope = 'ZohoCRM.modules.ALL';

  import fetch from 'node-fetch';

async function refreshZohoToken() {
  const url = 'https://accounts.zoho.com/oauth/v2/token';

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data:any = await response.json();
    console.log('Access Token:', data?.access_token);
    return data;
  } catch (error) {
    console.error('Failed to refresh Zoho token:', error);
  }
}

(async () => {
    await refreshZohoToken()
  })()  


    
