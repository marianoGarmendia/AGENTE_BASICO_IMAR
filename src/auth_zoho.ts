import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = 5000;

const CLIENT_ID = process.env.ZOHO_CLIENT_ID || "";
const REDIRECT_URI = process.env.AUTHORIZED_URI_REDIRECT || "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const scope = 'ZohoCRM.modules.ALL';

console.log(`CLIENT_ID: ${CLIENT_ID}`);
console.log(`REDIRECT_URI: ${REDIRECT_URI}`);
console.log(`CLIENT_SECRET: ${CLIENT_SECRET}`);


app.get('/auth', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    access_type: 'offline',
    prompt: 'consent'
  });

  res.redirect(`https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`);
  return
});

app.get('/agent', async (req, res) => {
    const { code } = req.query ;

    if (!code) {
      res.status(400).send('No se recibió ningún código de autorización.');
      return
    }
  
    const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: 'http://localhost:5000/agent',
      code: code as string,
    });
  
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        body: params
      });
  
      const data = await response.json();
  
      if (data.access_token) {
        // Almacena los tokens de manera segura
        res.send(`Access Token: ${data.access_token}<br>Refresh Token: ${data.refresh_token}`);
      } else {
        res.status(400).send(`Error al obtener tokens: ${JSON.stringify(data)}`);
        return 
      }
    } catch (error:any) {
      res.status(500).send(`Error en la solicitud: ${error.message}`);
      return
    }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});


// Este código puede ser llamado cuando detectes que el access_token ha expirado.
const refreshAccessToken = async (refresh_token:string) => {
    const tokenUrl = 'https://accounts.zoho.com/oauth/v2/auth/refresh';
    const params = new URLSearchParams({
      response_type: "token",
      client_id:  CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
        refresh_token: refresh_token,
      scope,
    });
  
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        body: params
      });
  
      const data = await response.json();
  
      if (data.access_token) {
        // Almacena el nuevo access_token de manera segura
        console.log(`Nuevo Access Token: ${data.access_token}`);
      } else {
        console.error(`Error al renovar el token: ${JSON.stringify(data)}`);
      }
    } catch (error:any) {
      console.error(`Error en la solicitud: ${error.message}`);
    }
  };



