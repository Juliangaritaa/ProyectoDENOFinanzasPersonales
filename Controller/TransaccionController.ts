// deno-lint-ignore-file

import { Transaccion } from "../Models/TransaccionModels.ts";

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
    } catch (error: any) {
        console.error("Error en get transacciones", error);
        response.status = 400;
        response.body = {
            success:true,
            msg:"Error al procesar tu solicitud",
            errors: error.message
        };
    }
};

export const postTransaccion = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");
        if (contentLength === "0") {
            response.status = 400;
            response.body = {
                success: false,
                msg: "Cuerpo de la solicitud vacío."
            };
        }

        const body = await request.body.json();
        const transData = {
            idTransaccion:null,
            monto: body.monto,
            fecha: body.fecha,
            descripcion: body.fecha,
            idCategoria: body.idCategoria,
            idUsuario: body.idUsuario,
            idCuenta: body.idCuenta,
        };

        const objTransaccion = new Transaccion(transData);
        const result = await objTransaccion.InsertarTransaccion();
        response.status = 200;
        response.body = {
            success:true,
            msg: "Error al procesar la solicitud"
        }
    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud" };        
    }
};