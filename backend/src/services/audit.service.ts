import AuditLog, { IAuditLog } from '../models/AuditLog';
import { AuditAction } from '../utils/constants';

interface AuditLogFilters {
  action?: string;
  adminId?: string;
  targetType?: string;
}

export const logAction = async (
  adminId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<IAuditLog> => {
  const log = await AuditLog.create({
    adminId,
    action,
    targetType,
    targetId,
    details,
    ipAddress,
  });
  return log;
};

export const getAuditLogs = async (
  filters: AuditLogFilters,
  page: number = 1,
  limit: number = 50
): Promise<{ logs: IAuditLog[]; total: number }> => {
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (filters.action && filters.action !== 'all') {
    query.action = filters.action;
  }
  if (filters.adminId) {
    query.adminId = filters.adminId;
  }
  if (filters.targetType) {
    query.targetType = filters.targetType;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('adminId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total };
};
