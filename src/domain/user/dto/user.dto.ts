export default class UserDto {
  id: string;
  email: string;
  password: string;
  name: string;
  deletedAt: Date | null;
}