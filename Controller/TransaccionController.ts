// Controller/TransaccionController.ts - ARCHIVO COMPLETO ACTUALIZADO
import { conexion } from "../Models/Conexion.ts";
import { Transaccion } from "../Models/TransaccionModels.ts";
import { VerificarTokenAcceso } from "../Helpers/Jwt.ts";

// Helper para extraer userId del token
const getUserIdFromToken = async (authHeader: string | null): Promise<number | null> => {
    if (!authHeader) return null;
    
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    
    try {
        const payload = await VerificarTokenAcceso(token);
        return payload ? parseInt(payload.sub as string) : null;
    } catch (error) {
        console.error('Error verificando token:', error);
        return null;
    }
};

// ✅ FUNCIÓN ORIGINAL (mantener para compatibilidad)
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
            success:false,
            msg:"Error al procesar tu solicitud",
            errors: error.message
        };
    }
};

// ✅ FUNCIÓN ORIGINAL ACTUALIZADA
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

// ✅ NUEVAS FUNCIONES PARA FILTROS Y CONSULTAS
export const getTransaccionesConFiltros = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        // Extraer userId del token
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        // Obtener parámetros de consulta
        const url = new URL(request.url);
        const fechaInicio = url.searchParams.get('fechaInicio');
        const fechaFin = url.searchParams.get('fechaFin');
        const idCategoria = url.searchParams.get('idCategoria');
        const idTipoTransaccion = url.searchParams.get('idTipoTransaccion');
        const montoMin = url.searchParams.get('montoMin');
        const montoMax = url.searchParams.get('montoMax');
        const idCuenta = url.searchParams.get('idCuenta');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const orderBy = url.searchParams.get('orderBy') || 'fecha';
        const orderDirection = url.searchParams.get('orderDirection') || 'DESC';

        // Construir query dinámicamente
        let query = `
            SELECT 
                t.idTransaccion,
                t.monto,
                t.fecha,
                t.descripcion,
                c.nombre as categoria,
                c.idCategoria,
                tt.descripcion as tipoTransaccion,
                tt.idTipoTransaccion,
                cu.nombre as cuenta,
                cu.idCuenta
            FROM transacciones t
            INNER JOIN categoria c ON t.idCategoria = c.idCategoria
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            INNER JOIN cuenta cu ON t.idCuenta = cu.idCuenta
            WHERE t.idUsuario = ?
        `;

        const params: any[] = [userId];

        // Agregar filtros dinámicamente
        if (fechaInicio) {
            query += ` AND t.fecha >= ?`;
            params.push(fechaInicio);
        }

        if (fechaFin) {
            query += ` AND t.fecha <= ?`;
            params.push(fechaFin);
        }

        if (idCategoria) {
            query += ` AND t.idCategoria = ?`;
            params.push(parseInt(idCategoria));
        }

        if (idTipoTransaccion) {
            query += ` AND t.idTipoTransaccion = ?`;
            params.push(parseInt(idTipoTransaccion));
        }

        if (idCuenta) {
            query += ` AND t.idCuenta = ?`;
            params.push(parseInt(idCuenta));
        }

        if (montoMin) {
            query += ` AND t.monto >= ?`;
            params.push(parseFloat(montoMin));
        }

        if (montoMax) {
            query += ` AND t.monto <= ?`;
            params.push(parseFloat(montoMax));
        }

        // Agregar ordenamiento
        const validOrderFields = ['fecha', 'monto', 'categoria', 'tipoTransaccion', 'cuenta'];
        const validDirections = ['ASC', 'DESC'];
        
        const finalOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'fecha';
        const finalDirection = validDirections.includes(orderDirection.toUpperCase()) ? orderDirection.toUpperCase() : 'DESC';
        
        if (finalOrderBy === 'categoria') {
            query += ` ORDER BY c.nombre ${finalDirection}`;
        } else if (finalOrderBy === 'tipoTransaccion') {
            query += ` ORDER BY tt.descripcion ${finalDirection}`;
        } else if (finalOrderBy === 'cuenta') {
            query += ` ORDER BY cu.nombre ${finalDirection}`;
        } else {
            query += ` ORDER BY t.${finalOrderBy} ${finalDirection}`;
        }

        // Query para contar total (sin LIMIT)
        const countQuery = query.replace(
            `SELECT 
                t.idTransaccion,
                t.monto,
                t.fecha,
                t.descripcion,
                c.nombre as categoria,
                c.idCategoria,
                tt.descripcion as tipoTransaccion,
                tt.idTipoTransaccion,
                cu.nombre as cuenta,
                cu.idCuenta`,
            'SELECT COUNT(*) as total'
        ).split('ORDER BY')[0]; // Remover ORDER BY del count

        // Agregar paginación al query principal
        const offset = (page - 1) * limit;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // Ejecutar ambas queries
        const [transacciones, countResult] = await Promise.all([
            conexion.query(query, params),
            conexion.query(countQuery, params.slice(0, -2)) // Sin limit y offset para el count
        ]);

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        // Obtener estadísticas de los filtros aplicados
        const estadisticasQuery = `
            SELECT 
                COUNT(*) as totalTransacciones,
                SUM(CASE WHEN tt.descripcion = 'Ingreso' THEN t.monto ELSE 0 END) as totalIngresos,
                SUM(CASE WHEN tt.descripcion = 'Gasto' THEN t.monto ELSE 0 END) as totalGastos,
                SUM(CASE WHEN tt.descripcion = 'Ingreso' THEN t.monto ELSE -t.monto END) as balance
            FROM transacciones t
            INNER JOIN categoria c ON t.idCategoria = c.idCategoria
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            INNER JOIN cuenta cu ON t.idCuenta = cu.idCuenta
            WHERE t.idUsuario = ?
        ` + query.split('WHERE t.idUsuario = ?')[1].split('ORDER BY')[0];

        const estadisticasResult = await conexion.query(
            estadisticasQuery, 
            params.slice(0, -2) // Sin limit y offset
        );

        response.status = 200;
        response.body = {
            success: true,
            data: {
                transacciones: transacciones || [],
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalRecords: total,
                    limit: limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                estadisticas: estadisticasResult[0] || {
                    totalTransacciones: 0,
                    totalIngresos: 0,
                    totalGastos: 0,
                    balance: 0
                },
                filtrosAplicados: {
                    fechaInicio,
                    fechaFin,
                    idCategoria,
                    idTipoTransaccion,
                    idCuenta,
                    montoMin,
                    montoMax,
                    orderBy: finalOrderBy,
                    orderDirection: finalDirection
                }
            },
            message: `${transacciones?.length || 0} transacciones encontradas`
        };

    } catch (error) {
        console.error("Error al obtener transacciones con filtros:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ OBTENER RESUMEN POR CATEGORÍA
export const getResumenPorCategoria = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        const url = new URL(request.url);
        const fechaInicio = url.searchParams.get('fechaInicio');
        const fechaFin = url.searchParams.get('fechaFin');
        const idTipoTransaccion = url.searchParams.get('idTipoTransaccion');

        let query = `
            SELECT 
                c.idCategoria,
                c.nombre as categoria,
                tt.descripcion as tipoTransaccion,
                COUNT(t.idTransaccion) as cantidadTransacciones,
                SUM(t.monto) as totalMonto,
                AVG(t.monto) as promedioMonto,
                MIN(t.monto) as montoMinimo,
                MAX(t.monto) as montoMaximo,
                MIN(t.fecha) as fechaPrimera,
                MAX(t.fecha) as fechaUltima
            FROM transacciones t
            INNER JOIN categoria c ON t.idCategoria = c.idCategoria
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            WHERE t.idUsuario = ?
        `;

        const params: any[] = [userId];

        if (fechaInicio) {
            query += ` AND t.fecha >= ?`;
            params.push(fechaInicio);
        }

        if (fechaFin) {
            query += ` AND t.fecha <= ?`;
            params.push(fechaFin);
        }

        if (idTipoTransaccion) {
            query += ` AND t.idTipoTransaccion = ?`;
            params.push(parseInt(idTipoTransaccion));
        }

        query += `
            GROUP BY c.idCategoria, c.nombre, tt.descripcion
            ORDER BY totalMonto DESC
        `;

        const resumen = await conexion.query(query, params);

        response.status = 200;
        response.body = {
            success: true,
            data: resumen || [],
            message: "Resumen por categoría obtenido correctamente"
        };

    } catch (error) {
        console.error("Error al obtener resumen por categoría:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ OBTENER TRANSACCIONES RECIENTES
export const getTransaccionesRecientes = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await getUserIdFromToken(authHeader);
        
        if (!userId) {
            response.status = 401;
            response.body = {
                success: false,
                message: "Token inválido o no proporcionado"
            };
            return;
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '5');

        const query = `
            SELECT 
                t.idTransaccion,
                t.monto,
                t.fecha,
                t.descripcion,
                c.nombre as categoria,
                tt.descripcion as tipoTransaccion,
                cu.nombre as cuenta
            FROM transacciones t
            INNER JOIN categoria c ON t.idCategoria = c.idCategoria
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            INNER JOIN cuenta cu ON t.idCuenta = cu.idCuenta
            WHERE t.idUsuario = ?
            ORDER BY t.fecha DESC, t.idTransaccion DESC
            LIMIT ?
        `;

        const transacciones = await conexion.query(query, [userId, limit]);

        response.status = 200;
        response.body = {
            success: true,
            data: transacciones || [],
            message: `${transacciones?.length || 0} transacciones recientes obtenidas`
        };

    } catch (error) {
        console.error("Error al obtener transacciones recientes:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};