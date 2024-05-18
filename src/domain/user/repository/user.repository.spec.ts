import { Test, TestingModule } from '@nestjs/testing';
import { InsertResult, UpdateResult, DeleteResult, DataSource, FindManyOptions } from 'typeorm';
import { UserRepository } from './user.repository';
import { UserEntity } from '../entity/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { testModule } from 'src/domain/common/provider/test.module';
import User from '../entity/user';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const createUserDto: CreateUserDto = {
    email: 'test@test.com',
    password: 'testPw',
    name: 'TestUser',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [testModule],
      providers: [
        UserRepository,
        {
          provide: 'USER_REPOSITORY',
          useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
          inject: ['DATA_SOURCE'],
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('insert', () => {
    it('정상케이스', async () => {
      const user = new User(createUserDto);

      const result = await userRepository.insert(user);

      expect(result).toBeInstanceOf(InsertResult);
      expect(result.generatedMaps).toHaveLength(1);
      expect(result.raw).toBe(1);
    });
  });

  describe('select', () => {
    it('정상케이스', async () => {
      const user = new User(createUserDto);
      await userRepository.insert(user);

      const findManyOptions: FindManyOptions<UserEntity> = {
        order: { id: 'DESC' },
        take: 10,
        skip: 0
      };

      const result = await userRepository.select(findManyOptions);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toBe(1);
    });
  });

  describe('update', () => {
    it('정상케이스', async () => {
      const user = new User(createUserDto);
      const { identifiers } = await userRepository.insert(user);

      const id = identifiers[0].id as string;

      const entity: UserEntity = {
        id,
        email: "test2@test.com",
        password: "1234",
        name: "changed",
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await userRepository.update(entity);

      expect(result).toBeInstanceOf(UpdateResult);
      expect(result.affected).toBe(1);
    });
  });

  describe('delete', () => {
    it('정상케이스', async () => {
      const user = new User(createUserDto);
      const { identifiers } = await userRepository.insert(user);

      const id = identifiers[0].id as string;

      const result = await userRepository.delete(id);

      expect(result).toBeInstanceOf(DeleteResult);
      expect(result.affected).toBe(1);
    });
  });

  describe('findOneById', () => {
    it('정상 케이스', async () => {
      const user = new User(createUserDto);
      const { identifiers } = await userRepository.insert(user);

      const id = identifiers[0].id as string;

      const result = await userRepository.findOneById(id);

      expect(result).toBeInstanceOf(User);
      expect(result.validate()).toBeUndefined();
    });
  });

  describe('existsUserByEmail', () => {
    it('정상케이스 - 이메일이 존재하는 경우', async () => {
      const user = new User(createUserDto);
      await userRepository.insert(user);

      const result = await userRepository.existsUserByEmail(createUserDto.email);

      expect(result).toBeTruthy();
    });

    it('정상케이스 - 이메일이 존재하지 않는 경우', async () => {
      const user = new User(createUserDto);
      await userRepository.insert(user);

      const result = await userRepository.existsUserByEmail(createUserDto.email + "1");

      expect(result).toBeFalsy();
    });
  });

  describe('existsUserByName', () => {
    it('정상케이스 - 이름이 존재하는 경우', async () => {
      const user = new User(createUserDto);
      await userRepository.insert(user);

      const result = await userRepository.existsUserByName(createUserDto.name);

      expect(result).toBeTruthy();
    });

    it('정상케이스 - 이름이 존재하지 않는 경우', async () => {
      const user = new User(createUserDto);
      await userRepository.insert(user);

      const result = await userRepository.existsUserByName(createUserDto.name);

      expect(result).toBeTruthy();
    });
  });
});