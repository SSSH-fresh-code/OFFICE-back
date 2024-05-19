import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import iUserService from '../interface/user.serivce.interface';
import { Inject, Injectable } from '@nestjs/common';
import User from '../entity/user';
import iUserRepository from '../interface/user.repository.interface';
import CommonService from 'src/domain/common/provider/common.service';

@Injectable()
export default class UserService implements iUserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: iUserRepository,
    @Inject('COMMON_SERVICE')
    private readonly commonService: CommonService
  ) { }

  login(loginDto: any) {
    throw new Error('Method not implemented.');
  }
  refresh(tokenDto: any) {
    throw new Error('Method not implemented.');
  }

  async register(dto: CreateUserDto) {
    const user = new User(dto);

    user.validate();

    await user.encryptPassword();

    return this.usersRepository.insert(user);
  }

  async select(page: PaginationDto): Promise<any> {
    return await this.commonService.paginate(page, this.usersRepository.select);
  }

  async findById(id: string): Promise<any> {
    return await this.usersRepository.findOneById(id);
  }

  async update(dto: UpdateUserDto): Promise<any> {
    const user = await this.usersRepository.findOneById(dto.id);

    if (dto.isPwReset) {
      user.setPassword("a12345678");
      await user.encryptPassword();
    }

    const entity = { ...user.toUserEntity(), name: dto.name }

    return await this.usersRepository.update(entity)
  }

  async delete(id: string): Promise<number> {
    const del = await this.usersRepository.delete(id);

    return del.affected;
  }

  async cert(ids: string[]): Promise<number> {
    //TODO
    throw new Error('Method not implemented.');
  }
}