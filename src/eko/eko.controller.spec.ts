import { Test, TestingModule } from '@nestjs/testing';
import { EkoController } from './eko.controller';
import { EkoService } from './eko.service';

describe('EkoController', () => {
  let controller: EkoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EkoController],
      providers: [EkoService],
    }).compile();

    controller = module.get<EkoController>(EkoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
