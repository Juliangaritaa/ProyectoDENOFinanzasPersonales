// deno-lint-ignore-file
import { Categoria } from '../Models/CategoriaModels.ts';
import { VerificarTokenAcceso } from "../Helpers/Jwt.ts";

// ✅ HELPER: Extraer userId del token (mantener igual)
const getUserIdFromToken = async (authHeader: string | null): Promise<number | null> => {
    if (!authHeader) return null;
    
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    
    try {
        const payload = await VerificarTokenAcceso(token);
        return payload ? parseInt(payload.sub as string) : null;
    } catch (error) {
        console.error('Error verificando token:', error);
        return null;
    }
};

// ✅ VER TODAS LAS CATEGORÍAS DISPONIBLES (Global)
export const getCategoria = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objCategoria = new Categoria();
        const listaCategorias = await objCategoria.SeleccionarCategoria();
        
        response.status = 200;
        response.body = {
            success: true,
            data: listaCategorias,
            count: listaCategorias.length,
            message: "Categorías disponibles para usar"
        };
    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ VER MIS CATEGORÍAS USADAS (Privado)
export const getMisCategorias = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        // Extraer userId del token
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        const objCategoria = new Categoria();
        const misCategorias = await objCategoria.SeleccionarMisCategorias(userId);
        
        response.status = 200;
        response.body = {
            success: true,
            data: misCategorias,
            count: misCategorias.length,
            message: `Tienes ${misCategorias.length} categorías en uso`
        };
    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ CREAR CATEGORÍA (Híbrido inteligente)
export const postCategoria = async (ctx: any) => {
    const { response, request } = ctx;
    
    try {
        // Extraer userId del token
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "El cuerpo de la solicitud se encuentra vacío." };
            return;
        }

        const body = await request.body.json();
        
        // Validar datos requeridos
        if (!body.nombre || !body.descripcion) {
            response.status = 400;
            response.body = { success: false, message: "Faltan datos requeridos (nombre y descripción)" };
            return;
        }

        // Crear con userId del token
        const categoriaData = {
            idCategoria: null,
            nombre: body.nombre.trim(),
            descripcion: body.descripcion.trim(),
            idUsuario: userId // Agregar userId para el SP
        };

        const objCategoria = new Categoria(categoriaData);
        const result = await objCategoria.InsertarCategoria();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.categoria
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ ACTUALIZAR CATEGORÍA (Solo si tengo permisos)
export const putCategoria = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        // Extraer userId del token
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo de la solicitud está vacío" };
            return;
        }

        const body = await request.body.json();

        // Validar datos requeridos
        if (!body.idCategoria || !body.nombre || !body.descripcion) {
            response.status = 400;
            response.body = { success: false, message: "Faltan datos requeridos (idCategoria, nombre y descripción)" };
            return;
        }

        // Crear con userId del token
        const categoriaData = {
            idCategoria: body.idCategoria,
            nombre: body.nombre.trim(),
            descripcion: body.descripcion.trim(),
            idUsuario: userId // Agregar userId para verificar permisos
        };

        const objCategoria = new Categoria(categoriaData);
        const result = await objCategoria.ActualizarCategoria();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.categoria
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ ELIMINAR CATEGORÍA (Solo si tengo permisos)
export const deleteCategoria = async (ctx: any) => {
    const { response, request } = ctx;
    
    try {
        // Extraer userId del token
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        const contentLength = request.headers.get("Content-Length");
        
        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "El ID de la categoría es requerido para eliminarla" };
            return;
        }

        const body = await request.body.json();
        
        if (!body.idCategoria) {
            response.status = 400;
            response.body = { success: false, message: "El ID de la categoría es requerido para eliminarla" };
            return;
        }

        // Crear con userId del token
        const categoriaData = {
            idCategoria: body.idCategoria,
            nombre: "",
            descripcion: "",
            idUsuario: userId // Agregar userId para verificar permisos
        };

        const objCategoria = new Categoria(categoriaData);
        const result = await objCategoria.EliminarCategoria();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.categoria
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ VERIFICAR PERMISOS SOBRE UNA CATEGORÍA
export const getPermisosCategoria = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        // Extraer userId del token
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        // Obtener idCategoria de los params
        const url = new URL(request.url);
        const idCategoria = parseInt(url.searchParams.get('idCategoria') || '0');

        if (!idCategoria) {
            response.status = 400;
            response.body = { success: false, message: "ID de categoría requerido" };
            return;
        }

        const objCategoria = new Categoria();
        const permisos = await objCategoria.VerificarPermisos(idCategoria, userId);
        
        response.status = 200;
        response.body = {
            success: true,
            data: permisos,
            message: "Permisos verificados correctamente"
        };

    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al verificar permisos",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};