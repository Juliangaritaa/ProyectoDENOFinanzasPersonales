// Models/CategoriaModels.ts - SIN SP (Solución temporal)

import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencies.ts";

interface CategoriaData {
    idCategoria: number | null;
    nombre: string;
    descripcion: string;
    veces_usada?: number;
    ultima_vez_usada?: string;
}

interface PermisoCategoria {
    puedo_editar: number;
    puedo_eliminar: number;
    razon: string;
}

export class Categoria {
    public _objCategoria: CategoriaData | null;
    public _idCategoria: number | null;

    constructor(objCategoria: CategoriaData | null = null, idCategoria: number | null = null) {
        this._objCategoria = objCategoria;
        this._idCategoria = idCategoria;
    }

    // ✅ VER TODAS LAS CATEGORÍAS DISPONIBLES (Global)
    public async SeleccionarCategoria(): Promise<CategoriaData[]> {
        try {
            const { rows: categorias } = await conexion.execute(
                'SELECT idCategoria, nombre, descripcion FROM categoria ORDER BY nombre'
            );
            return categorias as CategoriaData[];
        } catch (error) {
            console.error("Error al obtener categorías disponibles:", error);
            return [];
        }
    }

    // ✅ VER MIS CATEGORÍAS USADAS (Privado)
    public async SeleccionarMisCategorias(idUsuario: number): Promise<CategoriaData[]> {
        try {
            if (!idUsuario) {
                throw new Error("ID de usuario requerido");
            }

            const { rows: categorias } = await conexion.execute(`
                SELECT DISTINCT 
                    c.idCategoria,
                    c.nombre,
                    c.descripcion,
                    COUNT(t.idTransaccion) as veces_usada,
                    MAX(t.fecha) as ultima_vez_usada
                FROM categoria c
                INNER JOIN transacciones t ON c.idCategoria = t.idCategoria
                WHERE t.idUsuario = ?
                GROUP BY c.idCategoria, c.nombre, c.descripcion
                ORDER BY veces_usada DESC, c.nombre ASC
            `, [idUsuario]);
            
            return categorias as CategoriaData[];
        } catch (error) {
            console.error("Error al obtener mis categorías:", error);
            return [];
        }
    }

    // ✅ CREAR CATEGORÍA (Híbrido inteligente)
    public async InsertarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria) {
                throw new Error("No se ha proporcionado un objeto de categoría válido");
            }

            const { nombre, descripcion } = this._objCategoria;
            
            if (!nombre || !descripcion) {
                throw new Error("Faltan campos requeridos (nombre y descripción)");
            }

            const idUsuario = (this._objCategoria as any).idUsuario;
            if (!idUsuario) {
                throw new Error("ID de usuario requerido");
            }

            await conexion.execute("START TRANSACTION");

            try {
                // Verificar si la categoría ya existe globalmente
                const existeResult = await conexion.query(
                    'SELECT idCategoria FROM categoria WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))', 
                    [nombre]
                );

                if (existeResult && existeResult.length > 0) {
                    // La categoría ya existe, devolver la existente
                    const categoriaExistente = await conexion.query(
                        'SELECT * FROM categoria WHERE idCategoria = ?', 
                        [existeResult[0].idCategoria]
                    );
                    
                    await conexion.execute("COMMIT");
                    return { 
                        success: true, 
                        message: "Categoría ya existía, ahora puedes usarla",
                        categoria: categoriaExistente[0] 
                    };
                } else {
                    // Crear nueva categoría global
                    const result = await conexion.execute(
                        'INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)',
                        [nombre.trim(), descripcion.trim()]
                    );

                    if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                        const categoriaResult = await conexion.query('SELECT * FROM categoria WHERE idCategoria = LAST_INSERT_ID()');
                        const categoria = categoriaResult[0];
                        await conexion.execute("COMMIT");
                        return { 
                            success: true, 
                            message: "Nueva categoría creada y disponible para todos", 
                            categoria: categoria 
                        };
                    } else {
                        throw new Error("No fue posible crear la categoría");
                    }
                }
            } catch (error) {
                await conexion.execute("ROLLBACK");
                throw error;
            }
        } catch (error) {
            console.error("Error al insertar categoría:", error);
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: error instanceof Error ? error.message : "Error interno del servidor" };
            }
        }
    }

    // ✅ ACTUALIZAR CATEGORÍA (Solo si puedo)
    public async ActualizarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria) {
                throw new Error("No se ha proporcionado un objeto de categoría válido");
            }

            const { idCategoria, nombre, descripcion } = this._objCategoria;
            const idUsuario = (this._objCategoria as any).idUsuario;

            if (!idCategoria || !nombre || !descripcion || !idUsuario) {
                throw new Error("Faltan campos requeridos para actualizar la categoría");
            }

            await conexion.execute("START TRANSACTION");

            try {
                // Verificar que YO uso esta categoría
                const yoLaUso = await conexion.query(
                    'SELECT COUNT(*) as count FROM transacciones WHERE idCategoria = ? AND idUsuario = ?',
                    [idCategoria, idUsuario]
                );

                if (!yoLaUso || yoLaUso[0].count === 0) {
                    await conexion.execute("ROLLBACK");
                    return { success: false, message: "No puedes editar una categoría que no has usado" };
                }

                // Verificar si otros usuarios también la usan
                const otrosUsuarios = await conexion.query(
                    'SELECT COUNT(DISTINCT idUsuario) as count FROM transacciones WHERE idCategoria = ? AND idUsuario != ?',
                    [idCategoria, idUsuario]
                );

                if (otrosUsuarios && otrosUsuarios[0].count > 0) {
                    await conexion.execute("ROLLBACK");
                    return { success: false, message: "No puedes editar esta categoría porque otros usuarios también la usan" };
                }

                // Solo YO la uso, puedo editarla
                const result = await conexion.execute(
                    'UPDATE categoria SET nombre = ?, descripcion = ? WHERE idCategoria = ?',
                    [nombre.trim(), descripcion.trim(), idCategoria]
                );

                if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                    const categoriaResult = await conexion.query('SELECT * FROM categoria WHERE idCategoria = ?', [idCategoria]);
                    const categoria = categoriaResult[0];
                    await conexion.execute("COMMIT");
                    return { 
                        success: true, 
                        message: "Categoría actualizada correctamente", 
                        categoria: categoria 
                    };
                } else {
                    throw new Error("No fue posible actualizar la categoría");
                }
            } catch (error) {
                await conexion.execute("ROLLBACK");
                throw error;
            }
        } catch (error) {
            console.error("Error al actualizar categoría:", error);
            return { success: false, message: error instanceof Error ? error.message : "Error interno del servidor" };
        }
    }

    // ✅ ELIMINAR CATEGORÍA (Solo si puedo)
    public async EliminarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria || !this._objCategoria.idCategoria) {
                throw new Error("No se ha proporcionado un ID de categoría válido");
            }

            const { idCategoria } = this._objCategoria;
            const idUsuario = (this._objCategoria as any).idUsuario;

            if (!idUsuario) {
                throw new Error("ID de usuario requerido");
            }

            await conexion.execute("START TRANSACTION");

            try {
                // Verificar que la categoría existe
                const categoriaResult = await conexion.query('SELECT * FROM categoria WHERE idCategoria = ?', [idCategoria]);
                if (!categoriaResult || categoriaResult.length === 0) {
                    await conexion.execute("ROLLBACK");
                    return { success: false, message: "La categoría no existe" };
                }
                const categoriaExistente = categoriaResult[0];

                // Verificar que YO uso esta categoría
                const yoLaUso = await conexion.query(
                    'SELECT COUNT(*) as count FROM transacciones WHERE idCategoria = ? AND idUsuario = ?',
                    [idCategoria, idUsuario]
                );

                if (!yoLaUso || yoLaUso[0].count === 0) {
                    await conexion.execute("ROLLBACK");
                    return { success: false, message: "No puedes eliminar una categoría que no has usado" };
                }

                // Verificar si tengo transacciones con esta categoría
                const misTransacciones = await conexion.query(
                    'SELECT COUNT(*) as count FROM transacciones WHERE idCategoria = ? AND idUsuario = ?',
                    [idCategoria, idUsuario]
                );

                if (misTransacciones && misTransacciones[0].count > 0) {
                    await conexion.execute("ROLLBACK");
                    return { success: false, message: "No puedes eliminar la categoría porque tienes transacciones asociadas" };
                }

                // Verificar si otros usuarios la usan
                const otrosUsuarios = await conexion.query(
                    'SELECT COUNT(DISTINCT idUsuario) as count FROM transacciones WHERE idCategoria = ? AND idUsuario != ?',
                    [idCategoria, idUsuario]
                );

                if (otrosUsuarios && otrosUsuarios[0].count > 0) {
                    await conexion.execute("ROLLBACK");
                    return { success: false, message: "No puedes eliminar esta categoría porque otros usuarios también la usan" };
                }

                // Solo YO la uso y sin transacciones, puedo eliminarla
                const result = await conexion.execute('DELETE FROM categoria WHERE idCategoria = ?', [idCategoria]);

                if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                    await conexion.execute("COMMIT");
                    return { 
                        success: true, 
                        message: "Categoría eliminada correctamente", 
                        categoria: categoriaExistente 
                    };
                } else {
                    await conexion.execute("ROLLBACK");
                    throw new Error("No fue posible eliminar la categoría");
                }
            } catch (error) {
                await conexion.execute("ROLLBACK");
                throw error;
            }
        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            return { success: false, message: error instanceof Error ? error.message : "Error interno del servidor" };
        }
    }

    // ✅ VERIFICAR PERMISOS SOBRE UNA CATEGORÍA
    public async VerificarPermisos(idCategoria: number, idUsuario: number): Promise<PermisoCategoria> {
        try {
            // Verificar que YO uso esta categoría
            const yoLaUso = await conexion.query(
                'SELECT COUNT(*) as count FROM transacciones WHERE idCategoria = ? AND idUsuario = ?',
                [idCategoria, idUsuario]
            );

            // Verificar si otros usuarios la usan
            const otrosUsuarios = await conexion.query(
                'SELECT COUNT(DISTINCT idUsuario) as count FROM transacciones WHERE idCategoria = ? AND idUsuario != ?',
                [idCategoria, idUsuario]
            );

            // Verificar mis transacciones
            const misTransacciones = await conexion.query(
                'SELECT COUNT(*) as count FROM transacciones WHERE idCategoria = ? AND idUsuario = ?',
                [idCategoria, idUsuario]
            );

            const yoLaUsoCount = yoLaUso ? yoLaUso[0].count : 0;
            const otrosUsuariosCount = otrosUsuarios ? otrosUsuarios[0].count : 0;
            const misTransaccionesCount = misTransacciones ? misTransacciones[0].count : 0;

            if (yoLaUsoCount === 0) {
                return {
                    puedo_editar: 0,
                    puedo_eliminar: 0,
                    razon: 'No has usado esta categoría'
                };
            } else if (otrosUsuariosCount > 0) {
                return {
                    puedo_editar: 0,
                    puedo_eliminar: 0,
                    razon: 'Otros usuarios también usan esta categoría'
                };
            } else if (misTransaccionesCount > 0) {
                return {
                    puedo_editar: 1,
                    puedo_eliminar: 0,
                    razon: 'Puedes editar pero no eliminar (tienes transacciones)'
                };
            } else {
                return {
                    puedo_editar: 1,
                    puedo_eliminar: 1,
                    razon: 'Puedes editar y eliminar (solo tú la usas)'
                };
            }
        } catch (error) {
            console.error("Error al verificar permisos:", error);
            return { puedo_editar: 0, puedo_eliminar: 0, razon: "Error al verificar permisos" };
        }
    }
}