import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { MovieController } from './movie/movie.controller';
import { MovieModule } from './movie/movie.module';
import { ConfigModule } from './config/config.module';
import { SecretModule } from './secrets/secrets.module';
import { LoggingInterceptor } from './logger/logger.interceptor';

const AllControllers = [AppController, MovieController];

@Module({
  imports: [MovieModule, ConfigModule, SecretModule],
  controllers: AllControllers,
  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  }],
  exports: [],
})
export class AppModule {}
