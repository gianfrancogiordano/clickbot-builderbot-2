import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MongoAdapter as Database } from '@builderbot/database-mongo'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'


const PORT = process.env.PORT ?? 3008
const endpoint = `https://elb.soyclickstore.com/api/v1`;

const confirmPedido = (phone: any, data?: string) => {
    return axios.put(`${endpoint}/pedidos/bot-confirm/${phone}`, { data }, { headers: { 'Content-Type': 'application/json' } })
}

const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer(`... Estoy procesando la información`, { delay: 1000 },
        async (ctx, { fallBack, gotoFlow, flowDynamic }) => {

            try {
                
            if (!["1", "2"].includes(ctx.body)) {
                return fallBack(
                    `🤖 Lo siento, no entendí tu mensaje. Para poder ayudarte de la mejor manera, por favor intenta lo siguiente:

1️⃣ Confirmar pedido ✅
2️⃣ Modificar/Agregar Datos 📦
                    `
                );
            }

            switch (ctx.body) {
                case "1":
                    const res = await confirmPedido(ctx.from);
                    const pedido = res.data.body;
                    return await flowDynamic(
                        `¡Gracias por confirmar tu pedido, ${pedido.cliente.nombre.trim()}! 🎉 

Tu pedido ha sido procesado. Pronto recibirás un mensaje con el número de seguimiento.

¿Necesitas asistencia *HUMANA*?
Nos puedes contactar a través de WhatsApp:

📱 Whatsapp: https://wa.me/${pedido.wsnumber}

Estamos aquí para ayudarte en todo lo que necesites. 

*${pedido.negocio.nombre_comercial.trim()}*.`,
                            { delay: 1000 })

                case "2":
                    return await gotoFlow(flowEditar);

            }

            } catch (error) {
                console.log(error);
                return await flowDynamic(`Hola, ${ctx.name}. 🤖 Lo siento, ocurrió un error. Intenta nuevamente.`, { delay: 1000 })
            }

        }
    )
const flowEditar = addKeyword(EVENTS.ACTION)
    .addAnswer(`Entendido, por favor, escribe en un solo mensaje qué dato deseas modificar o agregar (por ejemplo, dirección de envio, agregar otro número de contácto o agregar algún comentario). 

⚠️ Si estás modificando la dirección de envío, no olvides incluir el *BARRIO, CIUDAD y DEPARTAMENTO* para evitar retrasos en la entrega. ⚠️`, { delay: 1000, capture: true },

        async (ctx, { flowDynamic }) => {

            try {
            const res = await confirmPedido(ctx.from, ctx.body);
            const pedido = res.data.body;
            return await flowDynamic(`¡Gracias por confirmar tu pedido, ${pedido.cliente.nombre.trim()}! 🎉

Tu pedido ha sido procesado. Pronto recibirás un mensaje con el número de seguimiento.

¿Necesitas asistencia *HUMANA*?
Nos puedes contactar a través de WhatsApp:

📱 Whatsapp: https://wa.me/${pedido.wsnumber}

Estamos aquí para ayudarte en todo lo que necesites. 

*${pedido.negocio.nombre_comercial.trim()}*.`,
                        { delay: 1000 })

            } catch (error) {
                console.log(error);
                return await flowDynamic(`Hola, ${ctx.name}. 🤖 Lo siento, ocurrió un error. Intenta nuevamente.`, { delay: 1000 })
            }

        }
    )

const flowMedia = addKeyword(EVENTS.MEDIA)
    .addAnswer(`... Estoy procesando la información`, { delay: 1000 },
        async (ctx, { flowDynamic }) => {
            
            try {
                return await flowDynamic(`Hola, ${ctx.name}. 🤖 Actualmente no puedo procesar imágenes o videos`, { delay: 1000 })
            } catch (error) {
                console.log(error);
                return await flowDynamic(`Hola, ${ctx.name}. 🤖 Lo siento, ocurrió un error. Intenta nuevamente.`, { delay: 1000 })
            }

        }
    )

const flowVoice = addKeyword(EVENTS.VOICE_NOTE)
    .addAnswer(`... Estoy procesando la información`, { delay: 1000 },
        async (ctx, { flowDynamic }) => {

            try {
                return await flowDynamic(`Hola, ${ctx.name}. 🤖 En este momento, no puedo entender notas de voz.`, { delay: 1000 })
            } catch (error) {
                console.log(error);
                return await flowDynamic(`Hola, ${ctx.name}. 🤖 Lo siento, ocurrió un error. Intenta nuevamente.`, { delay: 1000 })
            }

        }
    )

const main = async () => {
    const adapterFlow = createFlow([flowWelcome, flowMedia, flowVoice, flowEditar])

    const provider = createProvider(Provider, {
        groupsIgnore: true,
        readStatus: false,
        usePairingCode: false,
        experimentalStore: true,  // Reduce significativamente el consumo de recursos
        timeRelease: 10800000,    // Limpieza de datos cada 3 horas (en milisegundos)
        version: [2, 3000, 1025190524],  // Versión fija del protocolo que WhatsApp Web acepta
    });
    
    const adapterDB = new Database({
        dbUri: process.env.MONGO_DB_URI,
        dbName: process.env.MONGO_DB_NAME,
    })

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: provider,
        database: adapterDB,
    })

    provider.server.post('/send-message', handleCtx(async (bot, req: any, res) => {

        try {

            await bot?.sendMessage(req.body.phone, req.body.message, { media: req.body.mediaUrl ?? null });
            res.end('WSSend');

        } catch (error) {
            res.end('WSError - ' + error);
        }

    }));

    httpServer(+PORT)
}

main()
