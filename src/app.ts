
import dotenv from 'dotenv';
dotenv.config();

import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider } from "@Builderbot/provider-meta";

const PORT = process.env.PORT ?? 3008

const main = async () => { 
    
    const adapterFlow = createFlow([])

    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: process.env.JWTOKEN, //EAARBW3ZBGU0UBAACDjtQIzI8JuEa.............
        numberId: process.env.NUMBER_ID, //103975305758520
        verifyToken: process.env.VERIFY_TOKEN, //LO_QUE_SEA,
        version:'v22.0'
    })
    
    const adapterDB = new Database()

    // const { handleCtx, httpServer } = await createBot({
    const bot = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        bot.handleCtx(async (bot, req, res) => {

            console.log(req.body);

            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        bot.handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    bot.httpServer(+PORT)

    adapterProvider.on('message', ({ body, from }) => {
        // console.log(`Message Payload:`, { body, from })
    })

    bot.on('send_message', ({ answer, from }) => {
        // console.log(`Send Message Payload:`, { answer, from })
    })
}

main()
