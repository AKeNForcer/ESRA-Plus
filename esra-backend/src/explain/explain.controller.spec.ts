import { Test, TestingModule } from '@nestjs/testing';
import { ExplainController } from './explain.controller';

describe('ExplainController', () => {
  let controller: ExplainController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExplainController],
    }).compile();

    controller = module.get<ExplainController>(ExplainController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
