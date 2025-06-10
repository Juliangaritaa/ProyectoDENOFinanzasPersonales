import { Router } from "../Dependencies/Dependencies.ts";
import { posUserLogin } from "../Controller/LoginController.ts";

const loginRouter = new Router();


loginRouter.post("/",posUserLogin);

export {loginRouter}