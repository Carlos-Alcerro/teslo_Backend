import { UseGuards, applyDecorators } from '@nestjs/common';
import { ValidRoles } from '../interface/valid-roles';
import { RoleProtected } from '../decoratos/role-protected/role-protected.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}
