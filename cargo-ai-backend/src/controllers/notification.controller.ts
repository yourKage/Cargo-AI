import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationAgentService } from '../services/notification-agent.service';

@ApiTags('notification')
@Controller('notify')
export class NotificationController {
  constructor(
    private notificationAgentService: NotificationAgentService,
  ) {}

  @Post('dispatcher/:id')
  @ApiOperation({ summary: 'Trigger notification for a dispatcher' })
  @ApiParam({ name: 'id', description: 'Dispatcher UUID' })
  @ApiResponse({ status: 200, description: 'Notification sent' })
  async notifyDispatcher(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationAgentService.notifyDispatcher(id);
    return { message: 'Notification sent' };
  }
}

