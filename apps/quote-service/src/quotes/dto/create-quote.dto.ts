import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  customerName: string;

  @IsString()
  customerDocument: string;

  @IsString()
  insuranceType: string;

  @IsNumber()
  @IsPositive()
  insuredAmount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  claimsHistory?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  riskFactors?: string[];
}
