import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../config/permissions';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de auditoria (apenas para administradores e gerentes)
router.get('/', 
  requirePermission(Permission.SECURITY_AUDIT), 
  AuditController.getAuditLogs
);

router.get('/stats', 
  requirePermission(Permission.SECURITY_AUDIT), 
  AuditController.getAuditStats
);

router.get('/export', 
  requirePermission(Permission.SECURITY_AUDIT), 
  AuditController.exportAuditLogs
);

router.post('/cleanup', 
  requirePermission(Permission.SYSTEM_CONFIG), 
  AuditController.cleanupOldLogs
);

export default router;
