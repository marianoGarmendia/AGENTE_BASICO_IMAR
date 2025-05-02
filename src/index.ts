import express, { type Request, type Response } from "express";
import cors from "cors";
import * as uuid from "uuid";
import { parsePhoneNumber } from "./parser-phone-number";
import { workflow } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "./utils/sendMessageIG";
import { sendMessageWsp } from "./send_msg_wsp";
import { messageTemplateGeneric } from "./utils/wsp_templates";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const WEBHOOK_VERIFY_TOKEN = process.env.TOKEN_VERIFY_WEBHOOK_DEV || "";
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

app.post("/mail", (req, res) => {
  console.log("Received mail request");

  console.log(req.body);

  const str = req.body.from;
  const regex = /<([^>]+)>/;
  const match = str.match(regex);

  const response = {
    message: "Mail recibido, gracias por estar en contacto",
    to: match[1],
    subject: req.body.subject,
  };

  res.json(response);
});

app.get("/webhook", (req, res) => {
  console.log("Received webhook request");
  console.log(req.query);
  console.log(req.body);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Asegúrate de usar el mismo token aquí
      console.log("Webhook verified");
      res.status(200).send(challenge); // Envía el challenge de vuelta
    } else {
      res.sendStatus(403); // Token incorrecto
    }
  }
});

app.post("/webhook", async (req, res): Promise<any> => {
  const body = req.body;
  console.log("Received webhook POST request");
  console.dir(body, { depth: null });

  if (body.source === "web") {
    const message = body.message;
    const thread_id = body.threadId;
    try {
      const response = await workflow.invoke(
        { messages: [new HumanMessage(message)] },
        { configurable: { thread_id } }
      );
      const responseMessage =
        response.messages[response.messages.length - 1].content;

      return res.status(200).json(responseMessage);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
      // throw new Error("Error al enviar mensaje: " + error.message);
    }
  }

  if (body.source === "whatsapp") {
    const message = body.query;
    const thread_id = body.from;
    // Esto es con el bot de botbuilder , modificarlo con la app oficial
    const lead = body.lead;
    try {
      const response = await workflow.invoke(
        { messages: [new HumanMessage(message)] },
        { configurable: { thread_id } }
      );
      const responseMessage =
        response.messages[response.messages.length - 1].content;

      return res.status(200).json(responseMessage);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
      // throw new Error("Error al enviar mensaje: " + error.message);
    }
  }

  app.post("/webhook", async (req, res) => {
    console.log("message body:");
    console.dir(req.body, { depth: null });

    // Chequear en la database si es un lead para gestionar la informacion

    const messages = req.body.entry[0]?.changes[0]?.value?.messages;
    if (!messages || messages.length <= 0) {
      console.error(
        "El mensaje recibido no tiene el formato esperado o no contiene mensajes."
      );

      res.sendStatus(400).end(); // Bad Request
      return;
    }

    // no tenemos muy bien en claro por que es un array pero agarramos el primer elemento
    // ya que es el unico que nos interesa por ahora
    const firstMessage = messages[0];

    console.log("firstMessage:", firstMessage);

    const business_phone_number_id =
      req.body.entry[0].changes[0].value.metadata.phone_number_id;
    const cel_number = parsePhoneNumber(firstMessage.from);

    if (firstMessage.type !== "text") {
      await sendMessageWsp(
       { business_phone_number_id,
      
        WEBHOOK_VERIFY_TOKEN,
       template: {
          ...messageTemplateGeneric,
          to: cel_number,
          text: {
            body: "Solo recibimos mensajes de texto, por favor vuelve a intentarlo",
          },
        }}
      );
      console.log("Message sent successfully, No es un mensaje de texto:", res);

      res.sendStatus(200).end();
      // Bad Request
      return; // descomentar para win 2 win
    } // para que no siga ejecutando el codigo

    // iniciamos el agente para que analice el mensaje
    if (firstMessage.text.body) {
      const responseGraph = await workflow.invoke(
        {
          // context: enterpriseContext.bot_context,

          messages: firstMessage.text.body,
        },
        {
          configurable: { thread_id: cel_number },
          streamMode: "values",
        }
      );
      console.log(
        responseGraph.messages[responseGraph.messages.length - 1].content
      );

      const res2 = await sendMessageWsp(
       { business_phone_number_id,
  
        WEBHOOK_VERIFY_TOKEN,
        template: {
          ...messageTemplateGeneric,
          to: cel_number,
          text: {
            body: responseGraph.messages[responseGraph.messages.length - 1]
              .content,
          },
        }}
      );
      console.log("respuesta de agente");
      console.log("Message sent successfully:", res2);

      // Respond to the webhook
      res.sendStatus(200).end();
    }
  });

  // Si viene de la automatizacion de zoho
  if (body.source === "zoho") {
    const message = body.query;
    const thread_id = body.from;
    const { nombre, apellido, camposFaltantes } = body;

    const prompt = `La persona ${nombre} ${apellido} hay que contactarlo
   para completar los siguientes campos: ${camposFaltantes}.
   las instrucciones que debes seguir son: ${message}
  .`;
    try {
      const response = await workflow.invoke(
        { messages: [new HumanMessage(prompt)] },
        { configurable: { thread_id } }
      );
      const responseMessage =
        response.messages[response.messages.length - 1].content;

      return res.status(200).json(responseMessage);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
      // throw new Error("Error al enviar mensaje: " + error.message);
    }
  }

  // const is_echo = req.body.entry[0].changes[0].value.message["is_echo"];

  // Verifica que sea una notificación válida
  if (body.object === "instagram") {
    const is_echo = req.body.entry[0].messaging[0].message["is_echo"];
    console.log("is_echo: " + is_echo);

    if (is_echo) {
      return res.sendStatus(200).send();
    }
    // Maneja los eventos aquí
    // con esta ruta manejamos los mensajes que llegan a la página de facebook "req.body.entry[0].changes[0] "
    // DE ESTA MANERA FUNCIONABA ANTES

    const senderId = req.body.entry[0].messaging[0].sender.id;
    const recipientId = req.body.entry[0].messaging[0].recipient.id;
    const message = req.body.entry[0].messaging[0].message.text;

    const thread_id = senderId;

    if (!message) return res.sendStatus(200);

    // Enviar al agente

    const config = {
      configurable: { thread_id },
      streamMode: "values" as const,
    };

    for await (const event of await workflow.stream(
      {
        messages: [new HumanMessage(message)],
      },
      config
    )) {
      const recentMsg = event.messages[event.messages.length - 1];
      if (recentMsg._getType() === "ai") {
        if (recentMsg === null) return;
        if (recentMsg.content !== null && recentMsg.content !== "") {
          try {
            sendMessage({ senderId, recipientId, message: recentMsg.content });
          } catch (e) {
            console.log(e);
          }
        }
      }
    }

    res.status(200).send("EVENT_RECEIVED"); // Responde a Facebook
  } else {
    res.sendStatus(404);
  }
});

// ENPOINT PARA  QUE EL AGENTE ENVIE UN MENSAJE AL LEAD DE ZOHO QUE QUIERE RECUPERAR INFORMACION

app.post("/zoho", async (req, res) => {
  console.log("Received zoho request");
  console.dir(req.body, { depth: null });
  const { lead_id, message, number_phone, campos_faltantes } = req.body;

  const response = await workflow.invoke(
    {
      messages: [new HumanMessage(message)],
    },
    { configurable: { thread_id: lead_id } }
  );
  const responseMessage =
    response.messages[response.messages.length - 1].content;

  res.status(200).json(responseMessage);
  return;
});

// Twilio
app.post("/twilio", async (req, res) => {
  console.log("Received twilio request");
  console.dir(req.body, { depth: null });

  res.json({ message: "Mensaje recibido" });
});

// fetch("http://localhost:3000/mail", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     key: "foo",
//   }),
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
