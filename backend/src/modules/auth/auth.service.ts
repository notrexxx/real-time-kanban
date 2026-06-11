import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string) {
    const user = await this.usersService.create(email, pass);
    return this.login(user.email, pass); // Auto-login after registration
  }

  async login(email: string, pass: string) {
    // 1. Find the user
    const user = await this.usersService.findByEmail(email);
    
    // 2. Ensure the user exists AND actually has a password (they might have used OAuth!)
    // This perfectly satisfies TypeScript's strict null checks.
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verify the password mathematically
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Generate the JWT payload
    const payload = { sub: user.id, email: user.email };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
      }
    };
  }
}