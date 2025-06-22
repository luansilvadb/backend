import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../config/permissions';

const router = Router();

// Rotas públicas
router.post('/login', validate(schemas.login), AuthController.login);
router.post('/refresh', validate(schemas.refreshToken), AuthController.refreshToken);

// Rotas de registro (públicas)
router.post('/register', validate(schemas.register), AuthController.register);
router.post('/register-tenant', validate(schemas.registerWithTenant), AuthController.registerWithTenant);

// Rotas protegidas
router.use(authenticateToken);

router.get('/profile', AuthController.getProfile);
router.post('/change-password', validate(schemas.changePassword), AuthController.changePassword);
router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAll);
router.get('/sessions', AuthController.getSessions);
router.delete('/sessions/:sessionId', AuthController.revokeSession);

// Rotas administrativas (criação de usuários por admins/managers)
router.post('/users', 
  requirePermission(Permission.USER_CREATE), 
  validate(schemas.createUser), 
  AuthController.createUser
);

export default router;
