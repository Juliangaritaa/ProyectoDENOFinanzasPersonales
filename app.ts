import { Application,oakCors } from "./Dependencies/Dependencies.ts";
import { loginRouter} from "./Routes/LoginRouter.ts";
import { UserRouter } from "./Routes/UserRouter.ts";
import { CategoriaRouter } from "./Routes/CategoriaRouter.ts"
import { EstadisticasRouter } from "./Routes/EstadisticasRouter.ts";
import { routercuenta } from "./Routes/CuentaRouters.ts";
import { routerTransaccion } from "./Routes/TransaccionRouter.ts";
import {TipoTransaccionRouter} from "./Routes/TipoTransaccionRouter.ts"


const app = new Application();

app.use(oakCors());

const routers = [loginRouter,UserRouter,CategoriaRouter,routercuenta,routerTransaccion,TipoTransaccionRouter,  EstadisticasRouter];


routers.forEach((router) => {

    app.use(router.routes());
    app.use(router.allowedMethods());
    
});


console.log("Servidor corriendo por el puerto 8000");

app.listen({port:8000});
