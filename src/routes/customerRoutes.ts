import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.get('/:id/sales', CustomerController.getCustomerSalesHistory);
router.post('/', validate(schemas.createCustomer), CustomerController.createCustomer);
router.put('/:id', validate(schemas.createCustomer), CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

export default router;