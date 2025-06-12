import { Router } from "../Dependencies/Dependencies.ts";
import { getCuenta ,postCuenta,putCuenta,deleteCuenta} from "../Controller/CuentaController.ts";

const routercuenta = new Router();

routercuenta.get("/cuenta",getCuenta);
routercuenta.post("/cuenta",postCuenta);
routercuenta.put("/cuenta/:id",putCuenta);
routercuenta.delete("/cuenta/:id", deleteCuenta);

export{routercuenta};
