// deno-lint-ignore-file
import { Cuenta } from "../Models/CuentaModels.ts";

export const getCuenta = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        // Obtener userId de los query parameters
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Se requiere el parámetro userId"
            };
            return;
        }

        const objCuenta = new Cuenta();
        // Usar el nuevo método que filtra por usuario
        const listaCuentas = await objCuenta.SeleccionarCuentaPorUsuario(parseInt(userId));
        
        response.status = 200;
        response.body = {
            success: true,
            data: listaCuentas,
            count: listaCuentas.length
        };
    } catch (error) {
        console.error("Error en getCuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
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
            response.body = { 
                success: false, 
                message: "El cuerpo de la solicitud se encuentra vacío." 
            };
            return;
        }

        const body = await request.body.json();
        
        // Validar datos requeridos
        if (!body.nombre || !body.tipoCuenta || body.saldo === undefined || !body.estado || !body.idUsuario) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "Faltan datos requeridos (nombre, tipoCuenta, saldo, estado, idUsuario)" 
            };
            return;
        }

        // Validar tipos de datos
        const saldo = parseFloat(body.saldo);
        const idUsuario = parseInt(body.idUsuario);

        if (isNaN(saldo) || isNaN(idUsuario)) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "Los campos saldo e idUsuario deben ser números válidos" 
            };
            return;
        }

        const cuentaData = {
            idCuenta: null,
            nombre: body.nombre.trim(),
            tipoCuenta: body.tipoCuenta.trim(),
            saldo: saldo,
            estado: body.estado.trim(),
            idUsuario: idUsuario
        };

        const objCuenta = new Cuenta(cuentaData);
        const result = await objCuenta.InsertarCuenta();

        response.status = result.success ? 201 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.cuenta || null
        };

    } catch (error) {
        console.error("Error en postCuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

export const putCuenta = async (ctx: any) => {
    const { response, request, params } = ctx;

    try {
        // Obtener idCuenta de los parámetros de la URL
        const idCuenta = params?.id;
        
        if (!idCuenta) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "Se requiere el ID de la cuenta en la URL" 
            };
            return;
        }

        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "El cuerpo de la solicitud está vacío" 
            };
            return;
        }

        const body = await request.body.json();

        // Validar datos requeridos (idCuenta viene de params)
        if (!body.nombre || !body.tipoCuenta || body.saldo === undefined || !body.estado || !body.idUsuario) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "Faltan datos requeridos (nombre, tipoCuenta, saldo, estado, idUsuario)" 
            };
            return;
        }

        // Validar tipos de datos
        const saldo = parseFloat(body.saldo);
        const idUsuario = parseInt(body.idUsuario);
        const idCuentaNum = parseInt(idCuenta);

        if (isNaN(saldo) || isNaN(idUsuario) || isNaN(idCuentaNum)) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "Los campos numéricos deben ser válidos" 
            };
            return;
        }

        const cuentaData = {
            idCuenta: idCuentaNum,
            nombre: body.nombre.trim(),
            tipoCuenta: body.tipoCuenta.trim(),
            saldo: saldo,
            estado: body.estado.trim(),
            idUsuario: idUsuario
        };

        const objCuenta = new Cuenta(cuentaData);
        const result = await objCuenta.ActualizarCuenta();

        response.status = result.success ? 200 : 400;
        response.body = {
            success: result.success,
            message: result.message,
            data: result.cuenta || null
        };

    } catch (error) {
        console.error("Error en putCuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

export const deleteCuenta = async (ctx: any) => {
    const { response, params } = ctx;
    
    try {
        // Obtener idCuenta de los parámetros de la URL
        const idCuenta = params?.id;
        
        if (!idCuenta) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "Se requiere el ID de la cuenta en la URL" 
            };
            return;
        }

        // Validar que el ID sea un número válido
        const idCuentaNum = parseInt(idCuenta);
        if (isNaN(idCuentaNum)) {
            response.status = 400;
            response.body = { 
                success: false, 
                message: "El ID de la cuenta debe ser un número válido" 
            };
            return;
        }

        const cuentaData = {
            idCuenta: idCuentaNum,
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
            data: result.cuenta || null
        };

    } catch (error) {
        console.error("Error en deleteCuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// Función adicional para obtener todas las cuentas (sin filtro de usuario)
// Útil para administradores o reportes generales
export const getAllCuentas = async (ctx: any) => {
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
        console.error("Error en getAllCuentas:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};