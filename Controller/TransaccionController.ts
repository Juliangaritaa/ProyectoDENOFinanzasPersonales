// deno-lint-ignore-file

import { Transaccion } from "../Models/TransaccionModel.ts";

export const getTransaccion = async(ctx: any) => {
    console.log("GET / Transaccion fue llamado");  
    const { response, request } = ctx; 
    try {
        const objTransaccion = new Transaccion();
        const listaTransaccion = await objTransaccion.SeleccionarTransaccion();
        response.status = 200;
        response.body = {
            success:true,
            data: listaTransaccion
        };
    } catch (error) {
        console.error("Error en get transacciones", error);
        response.status = 400;
        response.body = {
            success:true,
            msg:"Error al procesar tu solicitud",
            errors: error.message
        };
    }
}