import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de consulta (todos os usuários autenticados)
router.get('/', CategoryController.getCategories);
router.get('/:id', CategoryController.getCategoryById);

// Rotas de modificação (apenas managers e admins)
router.post('/', requireManagerOrAdmin, validate(schemas.createCategory), CategoryController.createCategory);
router.put('/:id', requireManagerOrAdmin, validate(schemas.createCategory), CategoryController.updateCategory);
router.delete('/:id', requireManagerOrAdmin, CategoryController.deleteCategory);

export default router;