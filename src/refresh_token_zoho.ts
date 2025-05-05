
import dotenv from 'dotenv';
dotenv.config();
const CLIENT_ID = process.env.ZOHO_CLIENT_ID || "";
const REDIRECT_URI = process.env.AUTHORIZED_URI_REDIRECT || "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || ""
const scope = 'ZohoCRM.modules.ALL';



// const refreshAccessToken = async (refresh_token:string) => {
//     const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
//     const params = new URLSearchParams({
//       response_type: "refresh_token",
//       client_id:  CLIENT_ID,
//       client_secret: CLIENT_SECRET,
//       redirect_uri: REDIRECT_URI,
//       refresh_token: refresh_token
      
//     });
  
//     try {
//       const response = await fetch(tokenUrl, {
//         method: 'POST',
//         body: params
//       });
  
//       const data = await response.json();

//       if(!data) return console.error("No se ha recibido respuesta del servidor")

//       const { access_token, api_domain, expires_in } = data;

  
//       if (access_token) {
//         // Almacena el nuevo access_token de manera segura
//         console.log(`Nuevo Access Token: ${access_token}`);
//       } else {
//         console.error(`Error al renovar el token: ${JSON.stringify(data)}`);
//       }
//     } catch (error:any) {
//       console.error(`Error en la solicitud: ${error.message}`);
//     }
//   };

  // (async () => {
  //   await refreshAccessToken("1000.dccf9dc0e02bb6c0045933e399762c33.928496e6b36117f1c098e09e841f44c1")

  // })()


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


    
