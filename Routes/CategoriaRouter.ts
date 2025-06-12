import { Router } from "../Dependencies/Dependencies.ts";
import { authMiddlware } from "../Middlewares/ValidateJWT.ts";
import { 
    getCategoria,           // Ver todas las categorías disponibles
    getMisCategorias,       // Ver mis categorías usadas
    postCategoria,          // Crear categoría
    putCategoria,           // Actualizar categoría
    deleteCategoria,        // Eliminar categoría
    getPermisosCategoria    // Verificar permisos
} from "../Controller/CategoriaController.ts";

const CategoriaRouter = new Router();

// ✅ Rutas principales
CategoriaRouter.get("/categorias", getCategoria);                              // Ver todas (sin auth, global)
CategoriaRouter.get("/categorias/mis-usadas", authMiddlware, getMisCategorias); // Ver mis usadas (privado)
CategoriaRouter.post("/categorias", authMiddlware, postCategoria);              // Crear (híbrido)
CategoriaRouter.put("/categorias", authMiddlware, putCategoria);                // Actualizar (seguro)
CategoriaRouter.delete("/categorias", authMiddlware, deleteCategoria);          // Eliminar (seguro)

// ✅ Ruta para verificar permisos
CategoriaRouter.get("/categorias/permisos", authMiddlware, getPermisosCategoria);

export { CategoriaRouter };