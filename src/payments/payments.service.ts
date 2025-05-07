import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, request, Response } from 'express';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe( envs.stripeSecret );
    private readonly logger = new Logger('Payments-Service');

    constructor(
        @Inject(NATS_SERVICE)
        private readonly client: ClientProxy 
    ) {}
    
    async createPaymentSession( paymentSessionDto: PaymentSessionDto ) {

        const { currency, items, orderId } = paymentSessionDto;

        const lineItems = items.map( item => (
            {
                price_data: { 
                    currency,
                    product_data: {
                        name: item.name
                    },
                    unit_amount: Math.round(item.price * 100) // ? 200 equivalen a $20, ya que solo acepta enteres (no decimales 20.00)
                },
                quantity: item.quantity,
            }
        ))

        const session = await this.stripe.checkout.sessions.create({
            // TODO: Colocar el id de la orden
            payment_intent_data: {
                metadata: {
                    orderId
                }
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: envs.successUrl,
            cancel_url: envs.cancelUrl
        })

        return session;
    }

    async stripeWebhook( req: Request, res: Response) {

        
        // ? Signature
        const sig = req.headers['stripe-signature'];

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent( req['rawBody'], sig as string, envs.webhookSecret)
        } catch (error) {
            res.status(400).send(`Webhook error: ${ error.message }`)
            return;
        }
        
        let chargeObject;
        let payload;
        
        switch (event.type) {
            case 'payment_intent.created':
                console.log('payment_intent.created')
                break;
            case 'charge.updated':
                chargeObject = event.data.object;

                payload = {
                    stripePaymentId: chargeObject.id,
                    orderId: chargeObject.metadata.orderId,
                    receiptUrl: chargeObject.receipt_url,
                }
                // this.logger.log({ payload });
                this.client.emit('payment.succeeded', payload);
                break;

            case 'charge.succeeded':
                chargeObject = event.data.object;

                payload = {
                    stripePaymentId: chargeObject.id,
                    orderId: chargeObject.metadata.orderId,
                    receiptUrl: chargeObject.receipt_url,
                }

                // this.logger.log({ payload });
                this.client.emit('payment.succeeded', payload);
                break;
            default:
                console.log(`Event ${ event.type } not handled`)
                break;
        }

        // console.log(event)
        return res.status(200).json({ sig })
    }

}
