// Routes/TransaccionRouter.ts - Archivo completo actualizado

import { Router } from "../Dependencies/Dependencies.ts";
import { authMiddlware } from "../Middlewares/ValidateJWT.ts";
import { 
    getTransaccion, 
    postTransaccion,
    getTransaccionesConFiltros,
    getResumenPorCategoria,
    getTransaccionesRecientes
} from '../Controller/TransaccionController.ts';

const routerTransaccion = new Router();

// ✅ Rutas existentes
routerTransaccion.get("/transaccion", getTransaccion);
routerTransaccion.post("/transaccion", authMiddlware, postTransaccion);

// ✅ Nuevas rutas para consultas y filtros
routerTransaccion.get("/transacciones/filtros", authMiddlware, getTransaccionesConFiltros);
routerTransaccion.get("/transacciones/resumen-categoria", authMiddlware, getResumenPorCategoria);
routerTransaccion.get("/transacciones/recientes", authMiddlware, getTransaccionesRecientes);

export { routerTransaccion };