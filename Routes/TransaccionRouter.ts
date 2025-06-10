import { Router } from "../Dependencies/Dependencies.ts";
import { getTransaccion } from '../Controller/TransaccionController.ts';

const routerTransaccion = new Router();

routerTransaccion.get("/transaccion", getTransaccion);

export { routerTransaccion };