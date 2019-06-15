import { Module, Global, Inject, DynamicModule } from '@nestjs/common';
import { KeyVaultProvider } from './keyvault.service';
import { ConfigService } from '../config/config.service';

@Global()
@Module({
  controllers: [],
  providers: [
    KeyVaultProvider,
    ConfigService,
  ],
  exports: [KeyVaultProvider],
})
export class SecretModule {}
