import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    STRIPE_SECRET: string;
    STRIPE_WEBHOOK_SECRET: string;
    SUCCESS_URL: string;
    CANCEL_URL: string;
    NATS_SERVERS: string[];

}


const envsSchema = joi.object({
    PORT: joi.number().required(),
    STRIPE_SECRET: joi.string().required(),
    SUCCESS_URL: joi.string().required(),
    CANCEL_URL: joi.string().required(),
    STRIPE_WEBHOOK_SECRET: joi.string().required(),
    NATS_SERVERS: joi.array().items( joi.string() ).required(),
})
.unknown( true );

const { error, value } = envsSchema.validate( {
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS!.split(',')
} );

if( error ) throw new Error( `Config validation error: ${ error.message }` );

const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,
    stripeSecret: envVars.STRIPE_SECRET,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    successUrl: envVars.SUCCESS_URL,
    cancelUrl: envVars.CANCEL_URL,
    natsServers: envVars.NATS_SERVERS,
}
