import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { getRawHeaders } from './decorators/get-rawheaders.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decoratos/role-protected/role-protected.decorator';
import { ValidRoles } from './interface/valid-roles';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checAuthkStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  privateTestingRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') email: string,
    @getRawHeaders() headers: string[],
  ) {
    console.log(request);

    return {
      ok: true,
      message: 'Hola Mundo Private',
      user,
      email,
      headers,
    };
  }

  /*   @SetMetadata('roles', ['admin', 'super-user'])
   */
  @Get('private2')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get('private3')
  @Auth(ValidRoles.user)
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}
