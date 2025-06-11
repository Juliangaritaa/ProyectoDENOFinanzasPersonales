import { Application,oakCors } from "./Dependencies/Dependencies.ts";
import { loginRouter} from "./Routes/LoginRouter.ts";
import { UserRouter } from "./Routes/UserRouter.ts";
import { CategoriaRouter } from "./Routes/CategoriaRouter.ts"

import { routercuenta } from "./Routes/CuentaRouters.ts";


const app = new Application();

app.use(oakCors());

const routers = [loginRouter,UserRouter,CategoriaRouter,routercuenta];


routers.forEach((router) => {

    app.use(router.routes());
    app.use(router.allowedMethods());
    
});


console.log("Servidor corriendo por el puerto 8000");

app.listen({port:8000});
