import { Controller, Delete, Get, Post } from '@nestjs/common';
import { AppService } from '@/app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns a simple greeting to verify the API is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running.',
    schema: { type: 'string', example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-user')
  @ApiOperation({
    summary: 'Create a test user (development only)',
    description:
      'Creates a hardcoded test user for development purposes. Not intended for production use.',
  })
  @ApiResponse({ status: 201, description: 'Test user created.' })
  testCreateUser() {
    return this.appService.createTestUser();
  }

  @Delete('test-user')
  @ApiOperation({
    summary: 'Delete a test user (development only)',
    description:
      'Deletes the test user by email. Not intended for production use.',
  })
  @ApiResponse({ status: 200, description: 'Test user deleted.' })
  testDeleteUser() {
    return this.appService.deleteUserByEmail('test@example.com');
  }
}
