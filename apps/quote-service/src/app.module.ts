import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RISK_QUEUE, RISK_SERVICE_CLIENT } from '@app/common';
import { Quote } from './quotes/quote.entity';
import { QuotesController } from './quotes/quotes.controller';
import { QuotesService } from './quotes/quotes.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'insurisk'),
        password: config.get<string>('POSTGRES_PASSWORD', 'insurisk'),
        database: config.get<string>('POSTGRES_DB', 'insurisk_quotes'),
        entities: [Quote],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Quote]),
    ClientsModule.registerAsync([
      {
        name: RISK_SERVICE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: RISK_QUEUE,
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class AppModule {}
