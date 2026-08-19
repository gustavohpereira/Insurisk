import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RiskProfile,
  RiskProfileSchema,
} from './risks/risk-profile.schema';
import { RiskMessagesController } from './risks/risk-messages.controller';
import { RisksController } from './risks/risks.controller';
import { RisksService } from './risks/risks.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/insurisk_risks',
        ),
      }),
    }),
    MongooseModule.forFeature([
      { name: RiskProfile.name, schema: RiskProfileSchema },
    ]),
  ],
  controllers: [RisksController, RiskMessagesController],
  providers: [RisksService],
})
export class AppModule {}
