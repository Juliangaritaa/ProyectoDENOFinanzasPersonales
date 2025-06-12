import { Router } from "../Dependencies/Dependencies.ts";
import { getTipoTransaccion } from "../Controller/TipoTransaccionController.ts";

const TipoTransaccionRouter = new Router();

// ✅ Ruta para obtener tipos de transacción (Gasto e Ingreso)
TipoTransaccionRouter.get("/tipos-transaccion", getTipoTransaccion);

export { TipoTransaccionRouter };