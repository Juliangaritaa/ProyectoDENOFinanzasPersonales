import { Router } from "../Dependencies/Dependencies.ts";
import { authMiddlware } from "../Middlewares/ValidateJWT.ts";
import { 
    getEstadisticasFinancieras,
    getResumenCuentas
} from "../Controller/EstadisticasController.ts";

const EstadisticasRouter = new Router();

// ✅ Rutas para estadísticas financieras
EstadisticasRouter.get("/estadisticas/financieras", authMiddlware, getEstadisticasFinancieras);
EstadisticasRouter.get("/estadisticas/cuentas", authMiddlware, getResumenCuentas);

export { EstadisticasRouter };