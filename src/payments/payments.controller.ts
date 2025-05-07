import { Body, Controller, Get, Post, Request, Response } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { MessagePattern } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // @Post('create-payment-session')
  @MessagePattern('create.payment.session')
  createPaymentSession( @Body() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
    // return { paymentSessionDto }
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful',
    }
  }

  @Get('cancelled')
  cancel() {
    return {
      ok: true,
      message: 'Payment cancelled',
    }
  }

  @Post('webhook')
  async stripeWebhook( @Request() req, @Response() res) {
    // ?https://docs.nestjs.com/faq/raw-body
    console.log('Webhook called')
    return this.paymentsService.stripeWebhook(req, res);
  }



}
