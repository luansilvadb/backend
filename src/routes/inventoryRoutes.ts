import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../config/permissions';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de consulta de estoque
router.get('/', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.getInventory
);

router.get('/low-stock', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.getLowStockItems
);

router.get('/report', 
  requirePermission(Permission.INVENTORY_REPORT), 
  InventoryController.getInventoryReport
);

router.get('/product/:productId', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.getInventoryByProductId
);

// Rotas de movimentações de estoque
router.post('/movements', 
  requirePermission(Permission.INVENTORY_CREATE), 
  InventoryController.createInventoryMovement
);

router.get('/movements', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.getInventoryMovements
);

router.get('/product/:productId/movements', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.getProductMovementHistory
);

// Rotas de alertas de estoque
router.get('/alerts', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.getStockAlerts
);

router.patch('/alerts/:alertId/read', 
  requirePermission(Permission.INVENTORY_READ), 
  InventoryController.markAlertAsRead
);

router.patch('/alerts/:alertId/resolve', 
  requirePermission(Permission.INVENTORY_UPDATE), 
  InventoryController.resolveAlert
);

// Monitoramento de estoque
router.post('/monitor', 
  requirePermission(Permission.INVENTORY_UPDATE), 
  InventoryController.monitorStockLevels
);

// Rotas de modificação de estoque (apenas managers e admins)
router.put('/product/:productId', 
  requirePermission(Permission.INVENTORY_UPDATE), 
  validate(schemas.updateInventory), 
  InventoryController.updateInventory
);

router.patch('/product/:productId/adjust', 
  requirePermission(Permission.INVENTORY_UPDATE), 
  InventoryController.adjustInventory
);

export default router;
