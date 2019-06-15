import { Module, Global, Inject, DynamicModule } from '@nestjs/common';
import { BunyanLogger } from './extlogger.service';

@Global()
@Module({
  controllers: [],
  providers: [
    BunyanLogger,
  ],
  exports: [BunyanLogger],
})
export class LoggerModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = [{
      provide: 'LOGGER_NAME',
      useValue: {
          name: 'bunyanlog',
      },
    }]
    return {
      module: LoggerModule,
      providers: providers,
      exports: providers,
    };
  }
}
