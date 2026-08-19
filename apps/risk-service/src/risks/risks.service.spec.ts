import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { RiskProfileDocument } from './risk-profile.schema';
import { RisksService } from './risks.service';

describe('RisksService', () => {
  let model: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    findOne: jest.Mock;
  };
  let service: RisksService;

  beforeEach(() => {
    model = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
    };
    service = new RisksService(model as unknown as Model<RiskProfileDocument>);
  });

  it('creates a risk profile with a calculated score', async () => {
    model.create.mockResolvedValue({
      id: 'risk-id',
      customerDocument: '123',
      age: 42,
      claimsHistory: 1,
      riskFactors: ['coastal'],
      score: 58,
    } as RiskProfileDocument);

    const profile = await service.create({
      customerDocument: '123',
      age: 42,
      claimsHistory: 1,
      riskFactors: ['coastal'],
    });

    expect(model.create).toHaveBeenCalledWith({
      customerDocument: '123',
      age: 42,
      claimsHistory: 1,
      riskFactors: ['coastal'],
      score: 58,
    });
    expect(profile).toEqual(expect.objectContaining({ score: 58 }));
  });

  it('calculates risk from an existing profile when quote payload is minimal', async () => {
    model.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          customerDocument: '123',
          age: 70,
          claimsHistory: 2,
          riskFactors: ['fire'],
        }),
      }),
    } as any);

    await expect(service.calculate({ customerDocument: '123' })).resolves.toEqual({
      customerDocument: '123',
      score: 88,
    });
  });

  it('throws when a risk profile is not found', async () => {
    model.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
