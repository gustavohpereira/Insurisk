import { PartialType } from '@nestjs/mapped-types';
import { CreateRiskProfileDto } from './create-risk-profile.dto';

export class UpdateRiskProfileDto extends PartialType(CreateRiskProfileDto) {}
