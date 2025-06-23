// Dependências principais
import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

// Middlewares e rotas customizadas
import routes from "./routes"; // descomente se houver arquivo de rotas
import { errorHandler, notFound } from "./middleware/errorHandler"; // descomente se houver
import { HealthController } from "./controllers/healthController";

const app = express();

// Middlewares essenciais
app.use(express.json());

// PATCH: Permitir CORS para qualquer origem temporariamente
app.use(cors());

// PATCH: Content Security Policy para permitir chamadas do Swagger UI para a API externa
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.pdv.luansilva.com.br"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// Rotas principais
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes); // descomente se houver arquivo de rotas

app.get('/', HealthController.healthCheck);

// Middleware para rotas não encontradas
app.use(notFound);

// Handler de erro global (descomente se houver)
app.use(errorHandler);

// Inicialização do servidor
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n========================================");
  console.log(`🚀  Servidor rodando na porta ${PORT}`);
  console.log(`📚  Swagger documentation available at: http://localhost:${PORT}/api-docs`);
  console.log(`💚  Health check disponível em: http://localhost:${PORT}/`);
  console.log("========================================\n");
});
