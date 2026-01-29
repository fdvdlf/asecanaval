import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginRateLimitService } from './login-rate-limit.service';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: LoginRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ipHeader = req.headers['x-forwarded-for'];
    const ip = Array.isArray(ipHeader)
      ? ipHeader[0]
      : typeof ipHeader === 'string'
        ? ipHeader.split(',')[0].trim()
        : req.ip || req.connection?.remoteAddress || 'unknown';
    const dni = req.body?.dni || 'unknown';
    const key = `${ip}:${dni}`;

    const result = this.rateLimitService.check(key);
    if (!result.allowed) {
      throw new HttpException('Demasiados intentos. Intenta nuevamente mas tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
