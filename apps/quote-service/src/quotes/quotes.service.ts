import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RISK_CALCULATE_PATTERN,
  RISK_SERVICE_CLIENT,
  RiskCalculationPayload,
  RiskCalculationResult,
} from '@app/common';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote, QuoteStatus } from './quote.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    @Inject(RISK_SERVICE_CLIENT)
    private readonly riskClient: ClientProxy,
  ) {}

  async create(createQuoteDto: CreateQuoteDto) {
    const risk = await this.calculateRisk(createQuoteDto);
    const premium = this.calculatePremium(createQuoteDto.insuredAmount, risk.score);

    const quote = this.quotesRepository.create({
      customerName: createQuoteDto.customerName,
      customerDocument: createQuoteDto.customerDocument,
      insuranceType: createQuoteDto.insuranceType,
      insuredAmount: createQuoteDto.insuredAmount,
      riskScore: risk.score,
      premium,
      status: QuoteStatus.Quoted,
    });

    return this.quotesRepository.save(quote);
  }

  findAll() {
    return this.quotesRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const quote = await this.quotesRepository.findOne({ where: { id } });

    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }

    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto) {
    const quote = await this.findOne(id);

    Object.assign(quote, {
      customerName: updateQuoteDto.customerName ?? quote.customerName,
      customerDocument: updateQuoteDto.customerDocument ?? quote.customerDocument,
      insuranceType: updateQuoteDto.insuranceType ?? quote.insuranceType,
      insuredAmount: updateQuoteDto.insuredAmount ?? quote.insuredAmount,
      status: updateQuoteDto.status ?? quote.status,
    });

    return this.quotesRepository.save(quote);
  }

  async remove(id: string) {
    const quote = await this.findOne(id);
    await this.quotesRepository.remove(quote);

    return { id, deleted: true };
  }

  private async calculateRisk(
    createQuoteDto: CreateQuoteDto,
  ): Promise<RiskCalculationResult> {
    const payload: RiskCalculationPayload = {
      customerDocument: createQuoteDto.customerDocument,
      age: createQuoteDto.age,
      claimsHistory: createQuoteDto.claimsHistory,
      riskFactors: createQuoteDto.riskFactors,
    };

    return firstValueFrom(
      this.riskClient
        .send<RiskCalculationResult, RiskCalculationPayload>(
          RISK_CALCULATE_PATTERN,
          payload,
        )
        .pipe(
          timeout(5000),
          catchError(() => {
            throw new ServiceUnavailableException(
              'Risk service is unavailable for quote calculation',
            );
          }),
        ),
    );
  }

  private calculatePremium(insuredAmount: number, riskScore: number) {
    const baseRate = 0.01;
    const riskRate = riskScore / 1000;

    return Number((insuredAmount * (baseRate + riskRate)).toFixed(2));
  }
}
