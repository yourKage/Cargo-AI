import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('CargoAI Backend API')
    .setDescription('Smart Cargo Filtering & Negotiation Agent for Logistics')
    .setVersion('1.0')
    .addTag('dispatcher', 'Dispatcher management and configuration')
    .addTag('broker-post', 'Broker post submission and filtering')
    .addTag('loads', 'Load retrieval and filtering')
    .addTag('notification', 'Notification management')
    .addTag('offer', 'Offer management')
    .addTag('negotiation', 'Negotiation sessions')
    .addTag('decision', 'Decision evaluation')
    .addTag('seed', 'Data seeding')
    .addTag('fake-data', 'Fake data generation')
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'CargoAI API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 CargoAI Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger UI available at http://localhost:${port}/api`);
  console.log(`🎨 Dashboard UI available at http://localhost:${port}/index.html`);
}
bootstrap();
