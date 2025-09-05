import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status with timestamp', () => {
      const result = appController.health();

      expect(result).toHaveProperty('status', 'OK');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });
});
