import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencies.ts";

interface CategoriaData {
    idCategoria: number | null;
    nombre: string;
    descripcion: string;
}

export class Categoria {
    public _objCategoria: CategoriaData | null;
    public _idCategoria: number | null;

    constructor(objCategoria: CategoriaData | null = null, idCategoria: number | null = null) {
        this._objCategoria = objCategoria;
        this._idCategoria = idCategoria;
    }

    public async SeleccionarCategoria(): Promise<CategoriaData[]> {
        try {
            const { rows: categorias } = await conexion.execute('SELECT idCategoria, nombre, descripcion FROM categoria ORDER BY nombre');
            return categorias as CategoriaData[];
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            return [];
        }
    }

    public async InsertarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria) {
                throw new Error("No se ha proporcionado un objeto de categoría válido");
            }

            const { nombre, descripcion } = this._objCategoria;
            
            if (!nombre || !descripcion) {
                throw new Error("Faltan campos requeridos (nombre y descripción)");
            }

            // Verificar si la categoría ya existe
            const [categoriaExistente] = await conexion.query('SELECT idCategoria FROM categoria WHERE nombre = ?', [nombre]);
            if (categoriaExistente) {
                return { success: false, message: "Ya existe una categoría con ese nombre" };
            }

            await conexion.execute("START TRANSACTION");
            
            const result = await conexion.execute(
                'INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)',
                [nombre, descripcion]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [categoria] = await conexion.query('SELECT * FROM categoria WHERE idCategoria = LAST_INSERT_ID()');
                await conexion.execute("COMMIT");
                return { 
                    success: true, 
                    message: "Categoría creada correctamente", 
                    categoria: categoria 
                };
            } else {
                throw new Error("No fue posible crear la categoría");
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: error instanceof Error ? error.message : "Error interno del servidor" };
            }
        }
    }

    public async ActualizarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria) {
                throw new Error("No se ha proporcionado un objeto de categoría válido");
            }

            const { idCategoria, nombre, descripcion } = this._objCategoria;

            if (!idCategoria) {
                throw new Error("Se requiere el ID de la categoría para actualizarla");
            }

            if (!nombre || !descripcion) {
                throw new Error("Faltan campos requeridos para actualizar la categoría");
            }

            // Verificar si otra categoría ya tiene ese nombre
            const [categoriaExistente] = await conexion.query('SELECT idCategoria FROM categoria WHERE nombre = ? AND idCategoria != ?', [nombre, idCategoria]);
            if (categoriaExistente) {
                return { success: false, message: "Ya existe otra categoría con ese nombre" };
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(
                'UPDATE categoria SET nombre = ?, descripcion = ? WHERE idCategoria = ?',
                [nombre, descripcion, idCategoria]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [categoria] = await conexion.query('SELECT * FROM categoria WHERE idCategoria = ?', [idCategoria]);
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
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: error instanceof Error ? error.message : "Error interno del servidor" };
            }
        }
    }

    public async EliminarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria || !this._objCategoria.idCategoria) {
                throw new Error("No se ha proporcionado un ID de categoría válido");
            }

            const idCategoria = this._objCategoria.idCategoria;

            await conexion.execute("START TRANSACTION");

            // Verificar si la categoría existe
            const [categoriaExistente] = await conexion.query('SELECT * FROM categoria WHERE idCategoria = ?', [idCategoria]);
            if (!categoriaExistente) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "La categoría no existe" };
            }

            // Verificar si hay transacciones asociadas a esta categoría
            const [transaccionesAsociadas] = await conexion.query('SELECT COUNT(*) as count FROM transacciones WHERE idCategoria = ?', [idCategoria]);
            if (transaccionesAsociadas && transaccionesAsociadas.count > 0) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "No se puede eliminar la categoría porque tiene transacciones asociadas" };
            }

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
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: error instanceof Error ? error.message : "Error interno del servidor" };
            }
        }
    }
}