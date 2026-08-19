import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RiskCalculationPayload, RiskCalculationResult } from '@app/common';
import { Model } from 'mongoose';
import { CreateRiskProfileDto } from './dto/create-risk-profile.dto';
import { UpdateRiskProfileDto } from './dto/update-risk-profile.dto';
import { RiskProfile, RiskProfileDocument } from './risk-profile.schema';

interface RiskScoreContext {
  age: number;
  claimsHistory: number;
  riskFactors: string[];
}

@Injectable()
export class RisksService {
  constructor(
    @InjectModel(RiskProfile.name)
    private readonly riskProfileModel: Model<RiskProfileDocument>,
  ) {}

  async create(createRiskProfileDto: CreateRiskProfileDto) {
    const profile = {
      ...createRiskProfileDto,
      claimsHistory: createRiskProfileDto.claimsHistory ?? 0,
      riskFactors: createRiskProfileDto.riskFactors ?? [],
    };

    return this.riskProfileModel.create({
      ...profile,
      score: this.calculateScore(profile),
    });
  }

  findAll() {
    return this.riskProfileModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const profile = await this.riskProfileModel.findById(id).exec();

    if (!profile) {
      throw new NotFoundException(`Risk profile ${id} not found`);
    }

    return profile;
  }

  async update(id: string, updateRiskProfileDto: UpdateRiskProfileDto) {
    const current = await this.findOne(id);
    const updatedContext = {
      customerDocument:
        updateRiskProfileDto.customerDocument ?? current.customerDocument,
      age: updateRiskProfileDto.age ?? current.age,
      claimsHistory:
        updateRiskProfileDto.claimsHistory ?? current.claimsHistory,
      riskFactors: updateRiskProfileDto.riskFactors ?? current.riskFactors,
    };

    const updated = await this.riskProfileModel
      .findByIdAndUpdate(
        id,
        {
          ...updatedContext,
          score: this.calculateScore(updatedContext),
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Risk profile ${id} not found`);
    }

    return updated;
  }

  async remove(id: string) {
    const profile = await this.findOne(id);
    await this.riskProfileModel.findByIdAndDelete(profile.id).exec();

    return { id, deleted: true };
  }

  async calculate(
    payload: RiskCalculationPayload,
  ): Promise<RiskCalculationResult> {
    const existing = await this.riskProfileModel
      .findOne({ customerDocument: payload.customerDocument })
      .sort({ updatedAt: -1 })
      .exec();

    const context: RiskScoreContext = {
      age: payload.age ?? existing?.age ?? 35,
      claimsHistory:
        payload.claimsHistory ?? existing?.claimsHistory ?? 0,
      riskFactors: payload.riskFactors ?? existing?.riskFactors ?? [],
    };

    return {
      customerDocument: payload.customerDocument,
      score: this.calculateScore(context),
    };
  }

  private calculateScore(context: RiskScoreContext) {
    const factors = context.riskFactors.map((factor) => factor.toLowerCase());
    const highImpactFactors = [
      'coastal',
      'commercial',
      'fire',
      'flood',
      'health_condition',
      'theft',
    ];

    let score = 20;

    if (context.age < 25) {
      score += 20;
    } else if (context.age < 40) {
      score += 10;
    } else if (context.age < 60) {
      score += 15;
    } else {
      score += 30;
    }

    score += context.claimsHistory * 15;
    score += factors.reduce(
      (total, factor) => total + (highImpactFactors.includes(factor) ? 8 : 4),
      0,
    );

    return Math.min(Math.max(score, 0), 100);
  }
}
