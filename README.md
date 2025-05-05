## AGENTE IMAR BASICO - PRIMER ITERACION

### AGENTE CONECTADO A WHATSAPP CON FUNCIONALIDADES

- Asesoramiento informativo acerca deL INSTITUTO IMAR
- Responde sobre obras sociales, si trabaja o no y que hacer
- Tiene informacion sobre listado de médicos y la franja horaria en que atienden
- Si quiere una consulta recopila datos de toda la solicitud que necesita 
> Carga en zoho como trato


> Para testear el agente
https://agentchat.vercel.app/

url de documentacion de api zoho:
https://www.zoho.com/crm/developer/docs/api/v2/get-records.html 


TODO:

- CUANDO MANDE HISOTRIA CLINICA U ORDEN PROCESARLA EN EL SERVER Y ENVIARLA A UN MAIL DE RECEPCION - CONFIGURAR RESPUESTA

05-05
- configurar función que envíe whatsapp
- Cargar como lead, el sistema de zoho de manera predeterminada cuando intentmaos insertar un registro mnuevo analiza algún campo (ver  "Campos de comprobación de duplicados definidos por el sistema" ) 
Configurar aqui : https://help.zoho.com/portal/en/kb/crm/customize-crm-account/customizing-fields/articles/use-custom-fields#Mark_a_Field_as_Unique
Seleccionar un campo como unico apra que se duplique, como recomendación se utiliza el email