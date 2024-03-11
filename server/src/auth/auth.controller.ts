import {
  Body,
  Controller,
  Get,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Profile } from 'passport-github2';
import { AuthService } from './auth.service';
import { LoginResDto } from '../core/auth.model';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    // ? better way to validate this?
    this.configService.getOrThrow('CLIENT_BASE_URL');
  }

  @UseGuards(AuthGuard('github'))
  @Get('github')
  authWithGithub() {}

  @UseGuards(AuthGuard('github'))
  @Get('github/callback')
  @Redirect(`${process.env['CLIENT_BASE_URL']}`)
  async callBack(@Req() req: Express.Request): Promise<{ url: string }> {
    const _profile = req.user as Profile;
    const _email = _profile.emails?.[0].value;
    const _name = _profile.displayName ?? _profile.username;
    const _avatar = _profile.photos?.[0].value ?? '';

    if (!_email) throw new Error('No email found');

    const _loginRes = await this.authService.login({
      email: _email,
      name: _name,
      avatar: _avatar,
      createdAt: new Date(),
    });

    const _data = JSON.stringify(_loginRes);
    return { url: `${process.env['CLIENT_BASE_URL']}/?data=${_data}` };
  }

  @Get('refresh')
  async refresh(
    @Req() req: Request & { cookies: { PORE_TOKENS: string } },
  ): Promise<LoginResDto> {
    const _tokens: LoginResDto = JSON.parse(req.cookies['PORE_TOKENS']);
    if (!_tokens) throw new Error('No tokens found');

    return await this.authService.refresh(_tokens.refreshToken);
  }

  @Get('verify')
  async verify(@Body() verifyReq: { accessToken: string }) {
    return await this.authService.verify(verifyReq.accessToken);
  }
}