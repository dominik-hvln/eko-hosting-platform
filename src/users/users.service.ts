import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Wallet } from '../wallet/entities/wallet.entity';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
      @InjectRepository(User)
      private usersRepository: Repository<User>,
      @InjectRepository(Wallet)
      private walletsRepository: Repository<Wallet>,
  ) {}

  async create(
      createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { email, password } = createUserDto;
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
    });
    await this.usersRepository.save(newUser);
    const newWallet = this.walletsRepository.create({ user: newUser });
    await this.walletsRepository.save(newWallet);
    const { password: _, ...result } = newUser;
    return result;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  // --- NOWE METODY ADMINISTRACYJNE ---

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    const { password, ...result } = user;
    return result;
  }

  async update(
      id: string,
      updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    const updatedUser = await this.usersRepository.save(user);
    const { password, ...result } = updatedUser;
    return result;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Znajdujemy pełny obiekt użytkownika, włącznie z hasłem
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      // Ten błąd teoretycznie nie powinien wystąpić, bo user jest z tokenu
      throw new NotFoundException('User not found');
    }

    // 1. Weryfikujemy, czy stare hasło podane przez użytkownika zgadza się z tym w bazie
    const isPasswordMatching = await bcrypt.compare(
        changePasswordDto.oldPassword,
        user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Niepoprawne stare hasło.');
    }

    // 2. Hashujemy nowe hasło
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

    // 3. Zapisujemy nowe hasło w bazie danych
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    // Nie zwracamy nic wrażliwego
    return { message: 'Hasło zostało pomyślnie zmienione.' };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Łączymy istniejące dane z nowymi
    Object.assign(user, updateProfileDto);

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id); // Używamy findOne, aby rzucić błąd, jeśli nie znajdzie
    await this.usersRepository.delete(id);
  }
}