import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuoteStatus {
  Quoted = 'quoted',
  Cancelled = 'cancelled',
}

const numericTransformer = {
  to: (value?: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'quotes' })
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerName: string;

  @Column()
  customerDocument: string;

  @Column()
  insuranceType: string;

  @Column('numeric', { precision: 14, scale: 2, transformer: numericTransformer })
  insuredAmount: number;

  @Column({ type: 'int' })
  riskScore: number;

  @Column('numeric', { precision: 14, scale: 2, transformer: numericTransformer })
  premium: number;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.Quoted,
  })
  status: QuoteStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
