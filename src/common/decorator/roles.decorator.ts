import { SetMetadata } from '@nestjs/common';
import { TUserRole } from 'types-sssh';

export const ROLES_KEY = 'user_roles';

export const Roles = (role: TUserRole) => SetMetadata(ROLES_KEY, role);
