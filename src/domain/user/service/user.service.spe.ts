import { Test } from '@nestjs/testing';
import { UserRepository } from '../repository/user.repository';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: "USER_REPOSITORY",
          useValue: {
            getUserById: jest.fn(),
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get<UserRepository>(UserRepository);
  });

  it('should return a user by id', () => {
    // Arrange
    const userId = '123';
    const mockUser = { id: userId, name: 'John Doe', email: 'john@example.com' };
    userRepository.getUserById.mockReturnValue(mockUser);

    // Act
    const user = userService.getUserById(userId);

    // Assert
    expect(user).toBeDefined();
    expect(user.id).toBe(userId);
    expect(userRepository.getUserById).toHaveBeenCalledWith(userId);
  });

  it('should create a new user', () => {
    // Arrange
    const newUser = { name: 'John Doe', email: 'john@example.com' };
    const mockCreatedUser = { id: '456', ...newUser };
    userRepository.createUser.mockReturnValue(mockCreatedUser);

    // Act
    const createdUser = userService.createUser(newUser);

    // Assert
    expect(createdUser).toBeDefined();
    expect(createdUser.name).toBe(newUser.name);
    expect(createdUser.email).toBe(newUser.email);
    expect(userRepository.createUser).toHaveBeenCalledWith(newUser);
  });

  // Add more test cases as needed

});