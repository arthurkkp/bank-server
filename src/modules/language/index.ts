import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageEntity } from 'modules/language/entities';
import { LanguageService } from 'modules/language/services';

@Module({
    imports: [TypeOrmModule.forFeature([LanguageEntity])],
    controllers: [],
    exports: [LanguageService],
    providers: [LanguageService],
})
export class LanguageModule {}
