import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as os from 'os';
import checkDiskSpace from 'check-disk-space';

@Injectable()
export class HealthService extends HealthIndicator {
  async checkSystem(key: string): Promise<HealthIndicatorResult> {
    try {
      // 1. Memory Details
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = (usedMem / totalMem) * 100;

      // 2. Disk Details
      const diskSpace = await checkDiskSpace(process.cwd());
      const diskUsed = diskSpace.size - diskSpace.free;
      const diskUsagePercent = (diskUsed / diskSpace.size) * 100;

      // 3. CPU Details
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      // Define health thresholds
      const isMemoryHealthy = memUsagePercent < 90;
      const isDiskHealthy = diskUsagePercent < 90;
      const isCpuHealthy = loadAvg[0] < cpus.length;

      const isOverallHealthy = isMemoryHealthy && isDiskHealthy && isCpuHealthy;

      return this.getStatus(key, isOverallHealthy, {
        memory: {
          status: isMemoryHealthy ? 'healthy' : 'warning',
          used: `${(usedMem / 1024 / 1024).toFixed(2)} MB`,
          total: `${(totalMem / 1024 / 1024).toFixed(2)} MB`,
          usagePercent: `${memUsagePercent.toFixed(2)}%`,
          nodeHeap: {
            used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          },
        },
        disk: {
          status: isDiskHealthy ? 'healthy' : 'warning',
          used: `${(diskUsed / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(diskSpace.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
          total: `${(diskSpace.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: `${diskUsagePercent.toFixed(2)}%`,
          path: process.cwd(), // ✅ FIX: Use the path we actually queried
        },
        cpu: {
          status: isCpuHealthy ? 'healthy' : 'warning',
          loadAverage: {
            '1min': loadAvg[0].toFixed(2),
            '5min': loadAvg[1].toFixed(2),
            '15min': loadAvg[2].toFixed(2),
          },
          cores: cpus.length,
          model: cpus[0].model,
        },
      });
    } catch (error: any) {
      return this.getStatus(key, false, {
        message: error.message,
      });
    }
  }
}
