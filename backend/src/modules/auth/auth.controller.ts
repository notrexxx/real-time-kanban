import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: Record<string, string>) {
    return this.authService.register(body.email, body.password);
  }

  @HttpCode(HttpStatus.OK) // Login should return 200 OK, not 201 Created
  @Post('login')
  async login(@Body() body: Record<string, string>) {
    return this.authService.login(body.email, body.password);
  }
}