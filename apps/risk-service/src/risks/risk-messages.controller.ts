import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  RISK_CALCULATE_PATTERN,
  RiskCalculationPayload,
} from '@app/common';
import { RisksService } from './risks.service';

@Controller()
export class RiskMessagesController {
  constructor(private readonly risksService: RisksService) {}

  @MessagePattern(RISK_CALCULATE_PATTERN)
  calculate(@Payload() payload: RiskCalculationPayload) {
    return this.risksService.calculate(payload);
  }
}
