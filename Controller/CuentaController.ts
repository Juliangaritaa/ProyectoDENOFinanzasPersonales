// deno-lint-ignore-file
import { Cuenta } from "../Models/CuentaModels.ts";

export const getCuenta = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objCuenta = new Cuenta();
        const listaCuentas = await objCuenta.SeleccionarCuenta();
        response.status = 200;
        response.body = {
            success: true,
            data: listaCuentas,
            count: listaCuentas.length
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

export const postCuenta = async (ctx: any) => {
    const { response, request } = ctx;
    
    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "El cuerpo de la solicitud se encuentra vacío." };
            return;
        }

        const body = await request.body.json();
        
        // Validar datos requeridos
        if (!body.nombre || !body.tipoCuenta || body.saldo === undefined || !body.estado || !body.idUsuario) {
            response.status = 400;
            response.body = { success: false, message: "Faltan datos requeridos (nombre, tipoCuenta, saldo, estado, idUsuario)" };
            return;
        }

        const cuentaData = {
            idCuenta: null,
            nombre: body.nombre.trim(),
            tipoCuenta: body.tipoCuenta.trim(),
            saldo: parseFloat(body.saldo), // Convertir a número
            estado: body.estado.trim(),
            idUsuario: parseInt(body.idUsuario) // Asegurar que sea número
        };

        const objCuenta = new Cuenta(cuentaData);
        const result = await objCuenta.InsertarCuenta();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.cuenta
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

export const putCuenta = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo de la solicitud está vacío" };
            return;
        }

        const body = await request.body.json();

        // Validar datos requeridos
        if (!body.idCuenta || !body.nombre || !body.tipoCuenta || body.saldo === undefined || !body.estado || !body.idUsuario) {
            response.status = 400;
            response.body = { success: false, message: "Faltan datos requeridos (idCuenta, nombre, tipoCuenta, saldo, estado, idUsuario)" };
            return;
        }

        const cuentaData = {
            idCuenta: parseInt(body.idCuenta),
            nombre: body.nombre.trim(),
            tipoCuenta: body.tipoCuenta.trim(),
            saldo: parseFloat(body.saldo),
            estado: body.estado.trim(),
            idUsuario: parseInt(body.idUsuario)
        };

        const objCuenta = new Cuenta(cuentaData);
        const result = await objCuenta.ActualizarCuenta();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.cuenta
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

export const deleteCuenta = async (ctx: any) => {
    const { response, request } = ctx;
    
    try {
        const contentLength = request.headers.get("Content-Length");
        
        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "El ID de la cuenta es requerido para eliminarla" };
            return;
        }

        const body = await request.body.json();
        
        if (!body.idCuenta) {
            response.status = 400;
            response.body = { success: false, message: "El ID de la cuenta es requerido para eliminarla" };
            return;
        }

        const cuentaData = {
            idCuenta: parseInt(body.idCuenta),
            nombre: "",
            tipoCuenta: "",
            saldo: 0,
            estado: "",
            idUsuario: 0
        };

        const objCuenta = new Cuenta(cuentaData);
        const result = await objCuenta.EliminarCuenta();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.cuenta
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