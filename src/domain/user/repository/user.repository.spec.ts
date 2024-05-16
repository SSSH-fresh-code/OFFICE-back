import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, InsertResult, UpdateResult, DeleteResult, DataSource } from 'typeorm';
import { UserRepository } from './user.repository';
import { UserEntity } from '../entity/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { WorkEntity } from 'src/work/entities/work.entity';
import { AuthsEntity } from 'src/auths/entities/auths.entity';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let userRepositoryMock: Repository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: 'USER_REPOSITORY',
          useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
          inject: ['DATA_SOURCE'],
        },
        {
          provide: 'DATA_SOURCE',
          useFactory: async () => {
            const dataSource = new DataSource({
              type: 'sqlite',
              database: ':memory:',
              entities: [UserEntity],
              synchronize: true,
            });

            return dataSource.initialize();
          },
        }
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    userRepositoryMock = module.get('USER_REPOSITORY');
  });

  describe('insert', () => {
    it('should insert a new user and return the insert result', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'testPw',
        name: 'TestUser',
      };

      const result = await userRepository.insert(createUserDto);

      // expect(userRepositoryMock.insert).toHaveBeenCalledWith(createUserDto);
      console.log(result);
    });
  });
});

//   describe('select', () => {
//     it('should select users based on the given options and return the result', async () => {
//       const findManyOptions: FindManyOptions<UserEntity> = { /* find many options */ };
//       const users: UserEntity[] = [/* user entities */];
//       const totalCount: number = 10;

//       userRepositoryMock.findAndCount.mockReturnValueOnce(Promise.resolve([users, totalCount]));

//       const result = await userRepository.select(findManyOptions);

//       expect(userRepositoryMock.findAndCount).toHaveBeenCalledWith(findManyOptions);
//       expect(result).toEqual([users, totalCount]);
//     });
//   });

//   describe('update', () => {
//     it('should update a user and return the update result', async () => {
//       const updateUserDto: UpdateUserDto = { /* update user DTO data */ };
//       const updateResult: UpdateResult = { /* update result data */ };

//       userRepositoryMock.update.mockReturnValueOnce(Promise.resolve(updateResult));

//       const result = await userRepository.update(updateUserDto);

//       expect(userRepositoryMock.update).toHaveBeenCalledWith(updateUserDto);
//       expect(result).toBe(updateResult);
//     });
//   });

//   describe('delete', () => {
//     it('should delete a user based on the given primary key and return the delete result', async () => {
//       const pk: string = 'user-id';
//       const deleteResult: DeleteResult = { /* delete result data */ };

//       userRepositoryMock.delete.mockReturnValueOnce(Promise.resolve(deleteResult));

//       const result = await userRepository.delete(pk);

//       expect(userRepositoryMock.delete).toHaveBeenCalledWith(pk);
//       expect(result).toBe(deleteResult);
//     });
//   });

//   describe('findOneById', () => {
//     it('should find a user by the given ID and return the user entity', async () => {
//       const id: string = 'user-id';
//       const user: UserEntity = { /* user entity data */ };

//       userRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(user));

//       const result = await userRepository.findOneById(id);

//       expect(userRepositoryMock.findOne).toHaveBeenCalledWith(id);
//       expect(result).toBe(user);
//     });
//   });

//   describe('existsUserByEmail', () => {
//     it('should check if a user exists with the given email and return a boolean value', async () => {
//       const email: string = 'user@example.com';
//       const exists: boolean = true;

//       userRepositoryMock.count.mockReturnValueOnce(Promise.resolve(exists ? 1 : 0));

//       const result = await userRepository.existsUserByEmail(email);

//       expect(userRepositoryMock.count).toHaveBeenCalledWith({ where: { email } });
//       expect(result).toBe(exists);
//     });
//   });

//   describe('existsUserByName', () => {
//     it('should check if a user exists with the given name and return a boolean value', async () => {
//       const name: string = 'John Doe';
//       const exists: boolean = true;

//       userRepositoryMock.count.mockReturnValueOnce(Promise.resolve(exists ? 1 : 0));

//       const result = await userRepository.existsUserByName(name);

//       expect(userRepositoryMock.count).toHaveBeenCalledWith({ where: { name } });
//       expect(result).toBe(exists);
//     });
//   });
// });

// // Helper function to create a mock repository
// type MockType<T> = {
//   [P in keyof T]: jest.Mock<{}>;
// };

// function repositoryMockFactory(): MockType<Repository<UserEntity>> {
//   return {
//     insert: jest.fn(),
//     findAndCount: jest.fn(),
//     update: jest.fn(),
//     delete: jest.fn(),
//     findOne: jest.fn(),
//     count: jest.fn(),
//   };
// }
