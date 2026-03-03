import { Controller, Delete, Get, Post } from '@nestjs/common';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("test-user")
  testCreateUser() {
    return this.appService.createTestUser();
  }
  @Delete("test-user")
  testDeleteUser() {
    return this.appService.deleteUserByEmail('test@example.com');
  }

}
