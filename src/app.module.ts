import { Module, CacheModule, CacheInterceptor } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { ResourceController } from './resource/resource.controller';
import { ResourceModule } from './resource/resource.module';
import { ResourceMiddleware } from './middleware/resource.middleware';
import { SecretModule } from './secrets/secrets.module';
import { LoggingInterceptor } from './logger/logger.interceptor';
const AllControllers = [AppController, ResourceController];

@Module({
  imports: [ResourceModule, SecretModule, CacheModule.register()],
  controllers: AllControllers,
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResourceMiddleware,
    },
  ],
  exports: [],
})
export class AppModule {}
