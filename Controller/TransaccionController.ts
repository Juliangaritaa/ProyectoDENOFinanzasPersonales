// deno-lint-ignore-file
import { conexion } from "../Models/Conexion.ts";
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

// Controller/TransaccionController.ts - Reemplaza el método postTransaccion
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
            return;
        }

        const body = await request.body.json();
        
        // Validar que la cuenta esté activa
        const cuentaResult = await conexion.query(
            'SELECT saldo, estado FROM cuenta WHERE idCuenta = ? AND idUsuario = ?',
            [body.idCuenta, body.idUsuario]
        );
        
        if (!cuentaResult || cuentaResult.length === 0) {
            response.status = 400;
            response.body = {
                success: false,
                msg: "La cuenta no existe o no te pertenece"
            };
            return;
        }
        
        if (cuentaResult[0].estado === 'inactivo') {
            response.status = 400;
            response.body = {
                success: false,
                msg: "No puedes realizar transacciones con una cuenta inactiva"
            };
            return;
        }

        const saldoActual = parseFloat(cuentaResult[0].saldo);
        const monto = parseFloat(body.monto);

        // Obtener tipo de transacción
        const tipoResult = await conexion.query(
            'SELECT descripcion FROM tipotransacciones WHERE idTipoTransaccion = ?',
            [body.idTipoTransaccion]
        );

        if (!tipoResult || tipoResult.length === 0) {
            response.status = 400;
            response.body = {
                success: false,
                msg: "Tipo de transacción no válido"
            };
            return;
        }

        const tipoTransaccion = tipoResult[0].descripcion;
        let nuevoSaldo = saldoActual;

        // Calcular nuevo saldo según el tipo
        if (tipoTransaccion === 'Gasto') {
            if (monto > saldoActual) {
                response.status = 400;
                response.body = {
                    success: false,
                    msg: "Saldo insuficiente para realizar este gasto"
                };
                return;
            }
            nuevoSaldo = saldoActual - monto;
        } else if (tipoTransaccion === 'Ingreso') {
            nuevoSaldo = saldoActual + monto;
        }

        await conexion.execute("START TRANSACTION");

        try {
            // Insertar la transacción
            const transData = {
                idTransaccion: null,
                monto: monto,
                fecha: body.fecha,
                descripcion: body.descripcion,
                idCategoria: body.idCategoria,
                idUsuario: body.idUsuario,
                idCuenta: body.idCuenta,
                idTipoTransaccion: body.idTipoTransaccion
            };

            const objTransaccion = new Transaccion(transData);
            const result = await objTransaccion.InsertarTransaccion();

            if (!result.success) {
                throw new Error(result.message || "Error al insertar transacción");
            }

            // Actualizar el saldo de la cuenta
            await conexion.execute(
                'UPDATE cuenta SET saldo = ? WHERE idCuenta = ? AND idUsuario = ?',
                [nuevoSaldo, body.idCuenta, body.idUsuario]
            );

            await conexion.execute("COMMIT");

            // Calcular porcentaje de cambio para alertas
            const porcentajeCambio = Math.abs((nuevoSaldo - saldoActual) / saldoActual) * 100;
            const esBajadaSignificativa = tipoTransaccion === 'Gasto' && porcentajeCambio >= 50;

            response.status = 200;
            response.body = {
                success: true,
                message: `${tipoTransaccion} registrado exitosamente`,
                data: {
                    transaccion: result.transaccion,
                    saldoAnterior: saldoActual,
                    saldoNuevo: nuevoSaldo,
                    cambio: tipoTransaccion === 'Gasto' ? -monto : monto,
                    porcentajeCambio: porcentajeCambio,
                    alertaBajadaSignificativa: esBajadaSignificativa
                }
            };

        } catch (error) {
            await conexion.execute("ROLLBACK");
            throw error;
        }

    } catch (error) {
        response.status = 400;
        response.body = { 
            success: false, 
            msg: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        };        
    }
};