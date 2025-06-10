import { Router } from "../Dependencies/Dependencies.ts";
import { authMiddlware } from "../Middlewares/ValidateJWT.ts";
import { getUsuario, postUsuario, putUsuario, deleteUsuario } from "../Controller/UserController.ts";

const UserRouter = new Router();

UserRouter.get("/users", authMiddlware, getUsuario);
UserRouter.post("/users", authMiddlware, postUsuario);
UserRouter.put("/users", authMiddlware, putUsuario);
UserRouter.delete("/users", authMiddlware, deleteUsuario);

export { UserRouter };