import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassroomModule } from './classroom/classroom.module';
import { DuesModule } from './dues/dues.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { MeModule } from './me/me.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { MembersModule } from './members/members.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { DevicesModule } from './devices/devices.module';
import { UsersModule } from './users/users.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembersModule,
    MeModule,
    DuesModule,
    ServicesModule,
    AnnouncementsModule,
    ClassroomModule,
    DevicesModule,
    UsersModule,
    NewsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, HealthService],
})
export class AppModule {}
