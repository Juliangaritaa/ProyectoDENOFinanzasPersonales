import { conexion } from './Conexion.ts';
import { z } from "../Dependencies/Dependencies.ts";

interface CuentaData {
    idCuenta: number | null;
    nombre: string;
    tipoCuenta: string;
    saldo: number; // Cambié de string a number
    estado: string;
    idUsuario: number;
}

export class Cuenta {
    public _objCuenta: CuentaData | null;
    public _idCuenta: number | null;

    constructor(objCuenta: CuentaData | null = null, idCuenta: number | null = null) {
        this._objCuenta = objCuenta;
        this._idCuenta = idCuenta;
    }

    public async SeleccionarCuenta(): Promise<CuentaData[]> {
        try {
            const { rows: cuenta } = await conexion.execute('SELECT idCuenta, nombre, tipoCuenta, saldo, estado, idUsuario FROM cuenta ORDER BY nombre');
            return cuenta as CuentaData[];
        } catch (error) {
            console.error("Error al obtener cuentas:", error);
            return [];
        }
    }

    public async InsertarCuenta(): Promise<{ success: boolean; message: string; cuenta?: Record<string, unknown> }> {
        try {
            if (!this._objCuenta) {
                throw new Error("No se ha proporcionado un objeto de cuenta válido");
            }

            const { nombre, tipoCuenta, saldo, estado, idUsuario } = this._objCuenta;
            
            if (!nombre || !tipoCuenta || saldo === undefined || !estado || !idUsuario) {
                throw new Error("Faltan campos requeridos (nombre, tipoCuenta, saldo, estado, idUsuario)");
            }

            // Verificar si la cuenta ya existe para el usuario
            const cuentaResult = await conexion.query('SELECT idCuenta FROM cuenta WHERE nombre = ? AND idUsuario = ?', [nombre, idUsuario]);
            if (cuentaResult && cuentaResult.length > 0) {
                return { success: false, message: "Ya existe una cuenta con ese nombre para este usuario" };
            }

            await conexion.execute("START TRANSACTION");
            
            const result = await conexion.execute(
                'INSERT INTO cuenta (nombre, tipoCuenta, saldo, estado, idUsuario) VALUES (?, ?, ?, ?, ?)',
                [nombre, tipoCuenta, saldo, estado, idUsuario]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const cuentaResult = await conexion.query('SELECT * FROM cuenta WHERE idCuenta = LAST_INSERT_ID()');
                const cuenta = cuentaResult[0];
                await conexion.execute("COMMIT");
                return { 
                    success: true, 
                    message: "Cuenta registrada correctamente", 
                    cuenta: cuenta 
                };
            } else {
                throw new Error("No fue posible registrar la cuenta");
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

    public async ActualizarCuenta(): Promise<{ success: boolean; message: string; cuenta?: Record<string, unknown> }> {
        try {
            if (!this._objCuenta) {
                throw new Error("No se ha proporcionado un objeto de cuenta válido");
            }

            const { idCuenta, nombre, tipoCuenta, saldo, estado, idUsuario } = this._objCuenta;

            if (!idCuenta) {
                throw new Error("Se requiere el ID de la cuenta para actualizarla");
            }

            if (!nombre || !tipoCuenta || saldo === undefined || !estado || !idUsuario) {
                throw new Error("Faltan campos requeridos para actualizar la cuenta");
            }

            // Verificar si otra cuenta ya tiene ese nombre
            const cuentaResult = await conexion.query('SELECT idCuenta FROM cuenta WHERE nombre = ? AND idUsuario = ? AND idCuenta != ?', [nombre, idUsuario, idCuenta]);
            if (cuentaResult && cuentaResult.length > 0) {
                return { success: false, message: "Ya existe otra cuenta con ese nombre para este usuario" };
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(
                'UPDATE cuenta SET nombre = ?, tipoCuenta = ?, saldo = ?, estado = ?, idUsuario = ? WHERE idCuenta = ?',
                [nombre, tipoCuenta, saldo, estado, idUsuario, idCuenta]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const cuentaResult = await conexion.query('SELECT * FROM cuenta WHERE idCuenta = ?', [idCuenta]);
                const cuenta = cuentaResult[0];
                await conexion.execute("COMMIT");
                return { 
                    success: true, 
                    message: "Cuenta actualizada correctamente", 
                    cuenta: cuenta 
                };
            } else {
                throw new Error("No fue posible actualizar la cuenta");
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

    public async EliminarCuenta(): Promise<{ success: boolean; message: string; cuenta?: Record<string, unknown> }> {
        try {
            if (!this._objCuenta || !this._objCuenta.idCuenta) {
                throw new Error("No se ha proporcionado un ID de cuenta válido");
            }

            const idCuenta = this._objCuenta.idCuenta;

            await conexion.execute("START TRANSACTION");

            // Verificar si la cuenta existe
            const cuentaResult = await conexion.query('SELECT * FROM cuenta WHERE idCuenta = ?', [idCuenta]);
            if (!cuentaResult || cuentaResult.length === 0) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "La cuenta no existe" };
            }
            const cuentaExistente = cuentaResult[0];

            // Verificar si hay transacciones asociadas a esta cuenta
            const transaccionesResult = await conexion.query('SELECT COUNT(*) as count FROM transacciones WHERE idCuenta = ?', [idCuenta]);
            if (transaccionesResult && transaccionesResult.length > 0 && transaccionesResult[0].count > 0) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "No se puede eliminar la cuenta porque tiene transacciones asociadas" };
            }

            const result = await conexion.execute('DELETE FROM cuenta WHERE idCuenta = ?', [idCuenta]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return { 
                    success: true, 
                    message: "Cuenta eliminada correctamente", 
                    cuenta: cuentaExistente 
                };
            } else {
                await conexion.execute("ROLLBACK");
                throw new Error("No fue posible eliminar la cuenta");
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
    public async SeleccionarCuentaPorUsuario(idUsuario: number): Promise<CuentaData[]> {
    try {
        const { rows: cuenta } = await conexion.execute(
            'SELECT idCuenta, nombre, tipoCuenta, saldo, estado, idUsuario FROM cuenta WHERE idUsuario = ? ORDER BY nombre', 
            [idUsuario]
        );
        return cuenta as CuentaData[];
    } catch (error) {
        console.error("Error al obtener cuentas por usuario:", error);
        return [];
    }
}
}
