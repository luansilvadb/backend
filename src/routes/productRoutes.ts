import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../config/permissions';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de consulta
router.get('/', 
  requirePermission(Permission.PRODUCT_LIST), 
  ProductController.getProducts
);

router.get('/units', 
  requirePermission(Permission.PRODUCT_READ), 
  ProductController.getProductUnits
);

router.get('/low-stock', 
  requirePermission(Permission.INVENTORY_READ), 
  ProductController.getLowStockProducts
);

router.get('/sku/:sku', 
  requirePermission(Permission.PRODUCT_READ), 
  ProductController.getProductBySku
);

router.get('/barcode/:barcode', 
  requirePermission(Permission.PRODUCT_READ), 
  ProductController.getProductByBarcode
);

router.get('/:id', 
  requirePermission(Permission.PRODUCT_READ), 
  ProductController.getProductById
);

// Rotas de modificação
router.post('/', 
  requirePermission(Permission.PRODUCT_CREATE), 
  validate(schemas.createProduct), 
  ProductController.createProduct
);

router.put('/:id', 
  requirePermission(Permission.PRODUCT_UPDATE), 
  validate(schemas.updateProduct), 
  ProductController.updateProduct
);

router.patch('/:id/reactivate', 
  requirePermission(Permission.PRODUCT_UPDATE), 
  ProductController.reactivateProduct
);

router.delete('/:id', 
  requirePermission(Permission.PRODUCT_DELETE), 
  ProductController.deleteProduct
);

export default router;
