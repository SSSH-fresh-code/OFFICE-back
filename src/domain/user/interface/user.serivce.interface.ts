import { PaginationDto } from "src/common/dto/pagination.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";

export default interface iUserService {
  login(loginDto: any): any;
  refresh(tokenDto: any): any;
  register(dto: CreateUserDto): any;
  select(page: PaginationDto): Promise<any>;
  findById(id: string): Promise<any>;
  update(dto: UpdateUserDto): Promise<any>;
  delete(id: string): Promise<number>;
  cert(ids: string[]): Promise<number>;
}