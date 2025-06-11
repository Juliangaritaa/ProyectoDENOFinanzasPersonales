import { Router } from "../Dependencies/Dependencies.ts";
import { getCategoria, postCategoria, putCategoria, deleteCategoria } from "../Controller/CategoriaController.ts";

const CategoriaRouter = new Router();

CategoriaRouter.get("/categorias", getCategoria);
CategoriaRouter.post("/categorias", postCategoria);
CategoriaRouter.put("/categorias", putCategoria);
CategoriaRouter.delete("/categorias", deleteCategoria);

export { CategoriaRouter };