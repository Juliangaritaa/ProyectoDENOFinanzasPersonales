import { Router } from "../Dependencies/Dependencies.ts";
import { getTransaccion, postTransaccion } from '../Controller/TransaccionController.ts';

const routerTransaccion = new Router();

routerTransaccion.get("/transaccion", getTransaccion);
routerTransaccion.post("/transaccion", postTransaccion);
export { routerTransaccion };