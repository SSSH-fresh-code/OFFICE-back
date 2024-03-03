import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from './common.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UserPaginationDto } from 'src/users/dto/user-pagination.dto';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonService],
    }).compile();

    service = module.get<CommonService>(CommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
