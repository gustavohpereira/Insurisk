import { ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './quote.entity';
import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let riskClient: {
    send: jest.Mock;
  };
  let service: QuotesService;

  beforeEach(() => {
    repository = {
      create: jest.fn((quote) => quote as Quote),
      save: jest.fn(async (quote) => ({ id: 'quote-id', ...quote }) as Quote),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    riskClient = {
      send: jest.fn(),
    };
    service = new QuotesService(
      repository as unknown as Repository<Quote>,
      riskClient as unknown as ClientProxy,
    );
  });

  it('creates a quote with calculated risk and premium', async () => {
    riskClient.send.mockReturnValue(of({ customerDocument: '123', score: 35 }));

    const quote = await service.create({
      customerName: 'Ada Lovelace',
      customerDocument: '123',
      insuranceType: 'home',
      insuredAmount: 100000,
    });

    expect(riskClient.send).toHaveBeenCalledWith('risk.calculate', {
      customerDocument: '123',
      age: undefined,
      claimsHistory: undefined,
      riskFactors: undefined,
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        riskScore: 35,
        premium: 4500,
        status: QuoteStatus.Quoted,
      }),
    );
    expect(quote).toEqual(
      expect.objectContaining({
        id: 'quote-id',
        riskScore: 35,
        premium: 4500,
      }),
    );
  });

  it('throws a controlled error when risk calculation fails', async () => {
    riskClient.send.mockReturnValue(throwError(() => new Error('offline')));

    await expect(
      service.create({
        customerName: 'Ada Lovelace',
        customerDocument: '123',
        insuranceType: 'home',
        insuredAmount: 100000,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
