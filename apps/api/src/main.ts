import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('نظام SCADA لإدارة الكهرباء')
    .setDescription(`
      واجهة برمجة التطبيقات (API) لنظام SCADA لإدارة ومراقبة الشبكة الكهربائية.
      
      ## الميزات الرئيسية:
      - إدارة المحطات الكهربائية
      - مراقبة الأجهزة والمعدات
      - قراءة البيانات الحية من نقاط القياس
      - نظام التنبيهات والإنذارات
      - أوامر التحكم عن بعد
      - WebSocket للبيانات الحية
      
      ## WebSocket:
      الاتصال: ws://localhost:3000/ws
    `)
    .setVersion('1.0')
    .addTag('المحطات الكهربائية', 'إدارة المحطات')
    .addTag('الأجهزة والمعدات', 'إدارة الأجهزة')
    .addTag('نقاط القياس', 'إدارة نقاط القياس')
    .addTag('القراءات', 'قراءات البيانات')
    .addTag('التنبيهات', 'نظام التنبيهات')
    .addTag('قواعد التنبيه', 'إدارة قواعد التنبيه')
    .addTag('أوامر التحكم', 'أوامر التحكم عن بعد')
    .addTag('الصحة', 'فحص صحة النظام')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'SCADA API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║   🔌 نظام SCADA لإدارة الكهرباء                              ║
  ║   📡 API Server: http://localhost:${port}/${globalPrefix}                  ║
  ║   📚 Swagger Docs: http://localhost:${port}/${globalPrefix}/docs           ║
  ║   🔗 WebSocket: ws://localhost:${port}/ws                      ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
