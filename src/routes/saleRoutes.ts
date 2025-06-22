import { Router } from 'express';
import { SaleController } from '../controllers/saleController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de venda (todos os usuários autenticados)
router.post('/', validate(schemas.createSale), SaleController.createSale);
router.get('/', SaleController.getSales);
router.get('/reports', requireManagerOrAdmin, SaleController.getSalesReport);
router.get('/:id', SaleController.getSaleById);

// Rotas de cancelamento (apenas managers e admins)
router.patch('/:id/cancel', requireManagerOrAdmin, SaleController.cancelSale);

// NOVO: Estorno parcial (apenas managers e admins)
router.patch('/:id/refund', requireManagerOrAdmin, SaleController.refundSale);

export default router;
