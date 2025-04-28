import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, request, Response } from 'express';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe( envs.stripeSecret );
    
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

        switch (event.type) {
            case 'payment_intent.created':
                console.log('payment_intent.created')
                break;
            case 'charge.updated':
                // TODO: Llamar microservice
                const chargeSucceeded = event.data.object;
                console.log('CHARGE UPDATED!!!')
                console.log({
                    metadata: chargeSucceeded.metadata
                })
                break;
            default:
                console.log(`Event ${ event.type } not handled`)
                break;
        }

        // console.log(event)
        return res.status(200).json({ sig })
    }

}
