import { Test, TestingModule } from '@nestjs/testing';
import { ExplainService } from './explain.service';

describe('ExplainService', () => {
  let service: ExplainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExplainService],
    }).compile();

    service = module.get<ExplainService>(ExplainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
