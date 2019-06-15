import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { MovieController } from './movie/movie.controller';
import { MovieModule } from './movie/movie.module';
import { ConfigModule } from './config/config.module';
import { SecretModule } from './secrets/secrets.module';

const AllControllers = [AppController, MovieController];

@Module({
  imports: [MovieModule, ConfigModule, SecretModule],
  controllers: AllControllers,
  providers: [],
  exports: [],
})
export class AppModule {}
