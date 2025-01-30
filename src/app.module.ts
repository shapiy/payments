import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { SystemConfigurationModule } from './system-configuration/system-configuration.module';
import { MerchantModule } from './merchant/merchant.module';
import { PaymentModule } from './payment/payment.module';
import { PayoutModule } from './payout/payout.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('local', 'staging', 'production')
          .default('local'),
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string().required(),

        SYSTEM_CONFIG_CURRENCY: Joi.string()
          .valid('UAH', 'USD', 'EUR')
          .required(),

        SYSTEM_CONFIG_FEE_FIXED_DEFAULT: Joi.number().precision(2).required(),
        SYSTEM_CONFIG_FEE_PERCENT_DEFAULT: Joi.number().precision(2).required(),
        SYSTEM_CONFIG_HOLD_PERCENT_DEFAULT: Joi.number()
          .precision(2)
          .required(),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
    MerchantModule,
    SystemConfigurationModule,
    PaymentModule,
    PayoutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
