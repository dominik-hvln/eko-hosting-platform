import { Test, TestingModule } from '@nestjs/testing';
import { TicketMessagesService } from './ticket-messages.service';

describe('TicketMessagesService', () => {
  let service: TicketMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketMessagesService],
    }).compile();

    service = module.get<TicketMessagesService>(TicketMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
