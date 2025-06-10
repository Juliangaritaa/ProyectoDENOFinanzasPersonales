import { z } from "../Dependencies/Dependencies.ts";
import { conexion } from './Conexion.ts';

interface TransaccionData {
    idTransaccion: number | null;
    monto: number;
    fecha: Date;
    descripcion: string;
    idCategoria: number;
    idUsuario: number;
    idCuenta: number;
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
}