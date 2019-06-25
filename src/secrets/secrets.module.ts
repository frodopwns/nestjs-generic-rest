import { Module, Global } from '@nestjs/common';
import { KeyVaultProvider } from './keyvault.service';

@Global()
@Module({
  controllers: [],
  providers: [KeyVaultProvider],
  exports: [KeyVaultProvider],
})
export class SecretModule {}
