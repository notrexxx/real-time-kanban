import { Controller, Post, Body, Get, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: Record<string, string>) {
    return this.authService.register(body.email, body.password);
  }

  @HttpCode(HttpStatus.OK) 
  @Post('login')
  async login(@Body() body: Record<string, string>) {
    return this.authService.login(body.email, body.password);
  }

 
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) { 
    return req.user; 
  }
}