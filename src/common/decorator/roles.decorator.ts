import { SetMetadata } from '@nestjs/common';
import AuthsEnum from 'src/auths/const/auths.enums';

export const ROLES_KEY = 'auths';

export const Roles = (role: AuthsEnum[]) => SetMetadata(ROLES_KEY, role);
