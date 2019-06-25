import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ResourceController } from './resource.controller';
import { LoggerModule } from '../logger/logger.module';
import { DbModule } from '../db/db.module';
import { SecretModule } from '../secrets/secrets.module';
import { ConfigModule } from '../config/config.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { BaseControllerMiddleware } from '../middleware/baseConstroller.middleware';

@Module({
  controllers: [ResourceController],
  providers: [],
  imports: [
    ConfigModule,
    SecretModule,
    LoggerModule.forRoot(),
    TelemetryModule.forRoot(),
    DbModule.forRoot(),
  ],
  exports: [SecretModule],
})
export class ResourceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BaseControllerMiddleware)
      .forRoutes('api/:resource');
  }
}
