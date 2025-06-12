
import { conexion } from './Conexion.ts';

interface TransaccionData {
    idTransaccion: number | null;
    monto: number;
    fecha: Date;
    descripcion: string;
    idCategoria: number;
    idUsuario: number;
    idCuenta: number;
     idTipoTransaccion: number;
}

export class Transaccion {
    public _objTransaccion: TransaccionData | null;
    public _idTransaccion: number | null;

    constructor(objTransaccion: TransaccionData | null = null, idTransaccion: number | null = null){
        this._objTransaccion = objTransaccion;
        this._idTransaccion = idTransaccion;
    }

    public async SeleccionarTransaccion():Promise<TransaccionData[]>{
        try {
            const { rows: transaction } = await conexion.execute('SELECT * FROM transacciones');
            return transaction as TransaccionData[];
        } catch (error) {
            console.log("Error al obtener las transacciones: ", error);
            return[];
        }
    }

    public async InsertarTransaccion():Promise<{ success: boolean; message: string; transaccion?: Record<string, unknown>}>{
        try {
            if (!this._objTransaccion) {
                throw new Error("No se ha proporcionado un objeto válido");
            }

            const { 
                monto,
                fecha,
                descripcion,
                idCategoria,
                idUsuario,
                idCuenta,
                idTipoTransaccion
            } = this._objTransaccion;

            await conexion.execute("START TRANSACTION");
            const result = await conexion.execute(
    "INSERT INTO transacciones (monto, fecha, descripcion, idCategoria, idUsuario, idCuenta, idTipoTransaccion) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
        monto,
        fecha,
        descripcion,
        idCategoria,
        idUsuario,
        idCuenta,
        idTipoTransaccion // ✅ AGREGAR ESTA LÍNEA
    ]
);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [transaccion] = await conexion.query(
                    "SELECT * FROM transacciones WHERE idTransaccion = LAST_INSERT_ID()",
                );
                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message: "Transaccion realizada correctamente.",
                    transaccion: transaccion
                };
            } else {
                throw new Error("No se pudo realizar la transaccion.");
            }

        } catch (error: any) {
            console.error("Error al insertar la transaccion: ", error);
            return{
                success:false,
                message: error.message || "Error interno del servidor"
            };
        }
    }
}