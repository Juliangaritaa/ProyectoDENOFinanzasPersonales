import { Router } from "../Dependencies/Dependencies.ts";
import { getCuenta ,postCuenta,putCuenta,deleteCuenta} from "../Controller/CuentaController.ts";

const routercuenta = new Router();

routercuenta.get("/cuenta",getCuenta);
routercuenta.post("/cuenta",postCuenta);
routercuenta.put("/cuenta",putCuenta);
routercuenta.delete("/cuenta",deleteCuenta);
export{routercuenta};