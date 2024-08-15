import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interface/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, fullName, password } = createUserDto;
    try {
      const passwordEncrypt = bcrypt.hashSync(password, 10);
      const user = this.userRepository.create({
        email: email,
        password: passwordEncrypt,
        fullName: fullName,
      });

      await this.userRepository.save(user);

      delete user.password;

      return { ...user, token: this.getJwt({ id: user.id }) };
    } catch (error) {
      this.handleErrors(error);
      console.log(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
      select: { email: true, password: true, id: true },
    });

    if (!user)
      throw new UnauthorizedException('Credenciales Incorrectas (email)');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credenciales Incorrectas (contrasena)');

    return { ...user, token: this.getJwt({ id: user.id }) };
  }

  async checAuthkStatus(user: User) {
    return { ...user, token: this.getJwt({ id: user.id }) };
  }

  private getJwt(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleErrors(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    console.log(error);
    throw new InternalServerErrorException(
      'Hubo un error interno en el servidor',
    );
  }
}
