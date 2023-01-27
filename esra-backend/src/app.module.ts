import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './search/search.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaperModule } from './paper/paper.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule,
        ScheduleModule.forRoot()
      ],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        dbName: config.get<string>('MONGODB_DB_NAME')
      })
    }),
    ConfigModule.forRoot(),
    SearchModule,
    PaperModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
