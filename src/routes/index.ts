import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import customerRoutes from './customerRoutes';
import saleRoutes from './saleRoutes';
import inventoryRoutes from './inventoryRoutes';
import auditRoutes from './auditRoutes';
import { HealthController } from '../controllers/healthController';

const router = Router();

// Definir todas as rotas da API
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/audit', auditRoutes);

// Rotas de health check
router.get('/health', HealthController.healthCheck);
router.get('/health/detailed', HealthController.detailedHealth);

export default router;
