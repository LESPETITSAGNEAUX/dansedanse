
import { EventEmitter } from "events";

export type TaskPriority = "critical" | "high" | "normal" | "low" | "background";

export interface ScheduledTask {
  id: string;
  name: string;
  priority: TaskPriority;
  intervalMs: number;
  lastRunTime: number;
  nextRunTime: number;
  isRunning: boolean;
  runCount: number;
  avgExecutionTime: number;
  maxExecutionTime: number;
  errorCount: number;
  enabled: boolean;
  run: () => Promise<void>;
}

interface TaskStats {
  totalExecutions: number;
  totalErrors: number;
  avgExecutionTime: number;
  lastError?: Error;
  lastErrorTime?: number;
}

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 1000,
  high: 500,
  normal: 100,
  low: 50,
  background: 10,
};

export class TaskScheduler extends EventEmitter {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;
  private eventLoopInterval = 5; // 5ms event loop tick
  private stats: Map<string, TaskStats> = new Map();
  private maxConcurrentTasks = 6;
  private currentlyRunningTasks = 0;

  constructor() {
    super();
  }

  addTask(config: {
    id: string;
    name: string;
    priority: TaskPriority;
    intervalMs: number;
    run: () => Promise<void>;
    enabled?: boolean;
  }): void {
    const task: ScheduledTask = {
      id: config.id,
      name: config.name,
      priority: config.priority,
      intervalMs: config.intervalMs,
      lastRunTime: 0,
      nextRunTime: Date.now(),
      isRunning: false,
      runCount: 0,
      avgExecutionTime: 0,
      maxExecutionTime: 0,
      errorCount: 0,
      enabled: config.enabled !== false,
      run: config.run,
    };

    this.tasks.set(config.id, task);
    this.stats.set(config.id, {
      totalExecutions: 0,
      totalErrors: 0,
      avgExecutionTime: 0,
    });

    this.emit("taskAdded", { taskId: config.id, name: config.name });
  }

  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.stats.delete(taskId);
    this.emit("taskRemoved", { taskId });
  }

  enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      task.nextRunTime = Date.now();
    }
  }

  disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
    }
  }

  updateTaskInterval(taskId: string, intervalMs: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.intervalMs = intervalMs;
    }
  }

  private getTasksByPriority(): ScheduledTask[] {
    const now = Date.now();
    
    return Array.from(this.tasks.values())
      .filter(task => 
        task.enabled && 
        !task.isRunning && 
        task.nextRunTime <= now
      )
      .sort((a, b) => {
        // Tri par priorité puis par temps écoulé depuis le dernier run
        const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Si même priorité, celui qui attend le plus longtemps passe en premier
        const timeOverdueA = now - a.nextRunTime;
        const timeOverdueB = now - b.nextRunTime;
        return timeOverdueB - timeOverdueA;
      });
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    if (task.isRunning || !task.enabled) return;

    task.isRunning = true;
    this.currentlyRunningTasks++;
    const startTime = Date.now();

    try {
      await task.run();
      
      const executionTime = Date.now() - startTime;
      
      // Mettre à jour les stats
      task.runCount++;
      task.lastRunTime = startTime;
      task.nextRunTime = startTime + task.intervalMs;
      
      // Calcul moyenne mobile execution time
      if (task.avgExecutionTime === 0) {
        task.avgExecutionTime = executionTime;
      } else {
        task.avgExecutionTime = (task.avgExecutionTime * 0.9) + (executionTime * 0.1);
      }
      
      task.maxExecutionTime = Math.max(task.maxExecutionTime, executionTime);

      const stats = this.stats.get(task.id);
      if (stats) {
        stats.totalExecutions++;
        stats.avgExecutionTime = (stats.avgExecutionTime * 0.95) + (executionTime * 0.05);
      }

      // Warning si la tâche prend plus de temps que son intervalle
      if (executionTime > task.intervalMs * 0.8) {
        this.emit("taskSlowWarning", {
          taskId: task.id,
          name: task.name,
          executionTime,
          intervalMs: task.intervalMs,
          percentOfInterval: (executionTime / task.intervalMs) * 100,
        });
      }

      this.emit("taskCompleted", {
        taskId: task.id,
        name: task.name,
        executionTime,
      });

    } catch (error) {
      task.errorCount++;
      
      const stats = this.stats.get(task.id);
      if (stats) {
        stats.totalErrors++;
        stats.lastError = error as Error;
        stats.lastErrorTime = Date.now();
      }

      this.emit("taskError", {
        taskId: task.id,
        name: task.name,
        error,
        errorCount: task.errorCount,
      });

      // Auto-disable si trop d'erreurs consécutives
      if (task.errorCount > 10) {
        task.enabled = false;
        this.emit("taskAutoDisabled", {
          taskId: task.id,
          name: task.name,
          reason: "Too many consecutive errors",
        });
      }

      // Retry avec backoff exponentiel
      const backoffMs = Math.min(30000, task.intervalMs * Math.pow(2, Math.min(task.errorCount, 5)));
      task.nextRunTime = Date.now() + backoffMs;

    } finally {
      task.isRunning = false;
      this.currentlyRunningTasks--;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit("schedulerStarted");

    // Event Loop principal
    while (this.isRunning) {
      const tasks = this.getTasksByPriority();
      
      // Exécuter les tâches par ordre de priorité avec limite de concurrence
      for (const task of tasks) {
        if (!this.isRunning) break;
        
        // Respecter la limite de concurrence
        if (this.currentlyRunningTasks >= this.maxConcurrentTasks) {
          break;
        }

        // Exécution async sans await pour permettre concurrence
        this.executeTask(task).catch(error => {
          console.error(`Fatal error in task ${task.id}:`, error);
        });
      }

      // Attendre le prochain tick (non-blocking)
      await new Promise(resolve => setTimeout(resolve, this.eventLoopInterval));
    }

    this.emit("schedulerStopped");
  }

  stop(): void {
    this.isRunning = false;
  }

  getTaskStats(taskId: string): TaskStats | undefined {
    return this.stats.get(taskId);
  }

  getAllTaskStats(): Map<string, TaskStats> {
    return new Map(this.stats);
  }

  getTaskInfo(taskId: string): ScheduledTask | undefined {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : undefined;
  }

  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values()).map(t => ({ ...t }));
  }

  getSystemStats(): {
    totalTasks: number;
    enabledTasks: number;
    runningTasks: number;
    avgExecutionTime: number;
    totalExecutions: number;
    totalErrors: number;
  } {
    const tasks = Array.from(this.tasks.values());
    const stats = Array.from(this.stats.values());

    return {
      totalTasks: tasks.length,
      enabledTasks: tasks.filter(t => t.enabled).length,
      runningTasks: this.currentlyRunningTasks,
      avgExecutionTime: stats.reduce((sum, s) => sum + s.avgExecutionTime, 0) / Math.max(1, stats.length),
      totalExecutions: stats.reduce((sum, s) => sum + s.totalExecutions, 0),
      totalErrors: stats.reduce((sum, s) => sum + s.totalErrors, 0),
    };
  }

  setMaxConcurrentTasks(max: number): void {
    this.maxConcurrentTasks = Math.max(1, max);
  }

  setEventLoopInterval(ms: number): void {
    this.eventLoopInterval = Math.max(1, ms);
  }
}

let globalScheduler: TaskScheduler | null = null;

export function getTaskScheduler(): TaskScheduler {
  if (!globalScheduler) {
    globalScheduler = new TaskScheduler();
  }
  return globalScheduler;
}

export function resetTaskScheduler(): void {
  if (globalScheduler) {
    globalScheduler.stop();
    globalScheduler = null;
  }
}
