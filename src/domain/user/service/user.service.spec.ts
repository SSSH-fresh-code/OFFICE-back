import { InsertResult, UpdateResult } from 'typeorm';
import { Test } from '@nestjs/testing';
import UserService from './user.service';
import iUserService from '../interface/user.serivce.interface';
import iCommonService from 'src/domain/common/interface/common.service.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import User from '../entity/user';
import { ExceptionMessages } from 'src/domain/common/message/exception.message';
import { BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entity/user.entity';
import iUserRepository from '../interface/user.repository.interface';

describe('UserService', () => {
  let userService: iUserService;
  let mockUserRepository = {
    findOneById: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  let mockCommonService: iCommonService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'USER_REPOSITORY',
          useValue: mockUserRepository,
        },
        {
          provide: 'COMMON_SERVICE',
          useValue: mockCommonService,
        }
      ],
    }).compile();

    userService = moduleRef.get<iUserService>(UserService);
  });

  describe('register', () => {
    it('정상케이스', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'testPw',
        name: 'TestUser',
      };

      const insertResult: InsertResult = {
        identifiers: [],
        generatedMaps: [],
        raw: 1,
      };

      mockUserRepository.insert.mockResolvedValueOnce(insertResult);

      const result = await userService.register(createUserDto);

      expect(result).toEqual(insertResult);
      expect(mockUserRepository.insert).toHaveBeenCalled();
    });
  });


  describe('update', () => {
    it('정상케이스', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'testPw',
        name: 'TestUser',
      };
      const updateUserDto: UpdateUserDto = {
        id: '69669e08-0752-4197-bfb0-0f905f891f78',
        name: 'TestUser2',
        isPwReset: false,
      };

      const updateResult: UpdateResult = {
        generatedMaps: [],
        raw: 1,
        affected: 1,
      };

      const user = new User(createUserDto);
      await user.encryptPassword();
      mockUserRepository.findOneById.mockResolvedValueOnce(user);
      mockUserRepository.update.mockResolvedValueOnce(updateResult);

      const result = await userService.update(updateUserDto);

      expect(result).toEqual(updateResult);
      expect(mockUserRepository.findOneById).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('정상케이스 - PwReset Test', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'testPw',
        name: 'TestUser',
      };
      const updateUserDto: UpdateUserDto = {
        id: '69669e08-0752-4197-bfb0-0f905f891f78',
        name: 'TestUser2',
        isPwReset: true,
      };

      const updateResult: UpdateResult = {
        generatedMaps: [],
        raw: 1,
        affected: 1,
      };

      const user = new User(createUserDto);
      await user.encryptPassword();
      mockUserRepository.findOneById.mockResolvedValueOnce(user);
      mockUserRepository.update.mockResolvedValueOnce(updateResult);

      const result = await userService.update(updateUserDto);

      expect(result).toEqual(updateResult);
      expect(mockUserRepository.findOneById).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('정상케이스', async () => {
      const id = '69669e08-0752-4197-bfb0-0f905f891f78';

      const deleteResult = {
        generatedMaps: [],
        raw: 1,
        affected: 1,
      };

      mockUserRepository.delete.mockResolvedValueOnce(deleteResult);

      const result = await userService.delete(id);

      expect(result).toEqual(deleteResult.affected);
      expect(mockUserRepository.delete).toHaveBeenCalled();
    })
  });


  describe('cert', () => {
    it('정상케이스', async () => {
      const ids = [
        '69669e08-0752-4197-bfb0-0f905f891f78'
        , '69669e08-0752-4197-bfb0-0f905f891f79'
        , '69669e08-0752-4197-bfb0-0f905f891f80'
      ];

      const updateResult: UpdateResult = {
        generatedMaps: [],
        raw: 1,
        affected: 3,
      };

      mockUserRepository.update.mockResolvedValueOnce(updateResult);

      const result = await userService.cert(ids);

      expect(result).toEqual(updateResult.affected);
      expect(mockUserRepository.update).toHaveBeenCalled();
    })
  });
});