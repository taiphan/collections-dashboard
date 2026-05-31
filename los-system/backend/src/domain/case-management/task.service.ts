import { TaskStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'task-service' });

export interface UpdateTaskInput {
  taskId: string;
  status: TaskStatus;
  result?: Record<string, unknown>;
  completedBy?: string;
}

export class TaskService {
  async updateTaskStatus(input: UpdateTaskInput) {
    const task = await prisma.caseTask.findUnique({
      where: { id: input.taskId },
    });

    if (!task) {
      throw new NotFoundError('CaseTask', input.taskId);
    }

    if (task.status === 'COMPLETED') {
      throw new BusinessRuleError('Task is already completed');
    }

    const updated = await prisma.caseTask.update({
      where: { id: input.taskId },
      data: {
        status: input.status,
        completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
        result: input.result as any,
      },
    });

    // Log activity
    if (input.status === 'COMPLETED') {
      await prisma.caseActivity.create({
        data: {
          caseId: task.caseId,
          userId: input.completedBy,
          activityType: 'TASK_COMPLETED',
          description: `Task completed: ${task.title}`,
        },
      });
    }

    log.info({ taskId: input.taskId, status: input.status }, 'Task status updated');
    return updated;
  }

  async getTasksByCase(caseId: string, stage?: string) {
    return prisma.caseTask.findMany({
      where: {
        caseId,
        ...(stage ? { stage: stage as never } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

export const taskService = new TaskService();
