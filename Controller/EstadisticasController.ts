import { conexion } from "../Models/Conexion.ts";
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

// ✅ OBTENER ESTADÍSTICAS FINANCIERAS DEL USUARIO
export const getEstadisticasFinancieras = async (ctx: any) => {
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
        const periodo = url.searchParams.get('periodo') || 'mensual'; // mensual, anual, total
        
        // Calcular fechas según el período
        let fechaInicio: string;
        let fechaFin: string;
        const ahora = new Date();
        
        switch (periodo) {
            case 'mensual':
                fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
                fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];
                break;
            case 'anual':
                fechaInicio = new Date(ahora.getFullYear(), 0, 1).toISOString().split('T')[0];
                fechaFin = new Date(ahora.getFullYear(), 11, 31).toISOString().split('T')[0];
                break;
            case 'total':
            default:
                fechaInicio = '2000-01-01'; // Fecha muy antigua
                fechaFin = new Date().toISOString().split('T')[0];
                break;
        }

        // Consulta para obtener ingresos totales
        const ingresosResult = await conexion.query(`
            SELECT COALESCE(SUM(t.monto), 0) as totalIngresos
            FROM transacciones t
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            WHERE t.idUsuario = ? 
            AND tt.descripcion = 'Ingreso'
            AND t.fecha >= ? 
            AND t.fecha <= ?
        `, [userId, fechaInicio, fechaFin]);

        // Consulta para obtener gastos totales
        const gastosResult = await conexion.query(`
            SELECT COALESCE(SUM(t.monto), 0) as totalGastos
            FROM transacciones t
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            WHERE t.idUsuario = ? 
            AND tt.descripcion = 'Gasto'
            AND t.fecha >= ? 
            AND t.fecha <= ?
        `, [userId, fechaInicio, fechaFin]);

        // Consulta para obtener el saldo total de las cuentas
        const saldoTotalResult = await conexion.query(`
            SELECT COALESCE(SUM(saldo), 0) as saldoTotal
            FROM cuenta 
            WHERE idUsuario = ? AND estado = 'activo'
        `, [userId]);

        // Estadísticas del período anterior para comparación
        let fechaInicioAnterior: string;
        let fechaFinAnterior: string;
        
        switch (periodo) {
            case 'mensual':
                const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
                fechaInicioAnterior = mesAnterior.toISOString().split('T')[0];
                fechaFinAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0).toISOString().split('T')[0];
                break;
            case 'anual':
                fechaInicioAnterior = new Date(ahora.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                fechaFinAnterior = new Date(ahora.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                break;
            default:
                fechaInicioAnterior = fechaInicio;
                fechaFinAnterior = fechaFin;
                break;
        }

        // Ingresos período anterior
        const ingresosAnteriorResult = await conexion.query(`
            SELECT COALESCE(SUM(t.monto), 0) as totalIngresos
            FROM transacciones t
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            WHERE t.idUsuario = ? 
            AND tt.descripcion = 'Ingreso'
            AND t.fecha >= ? 
            AND t.fecha <= ?
        `, [userId, fechaInicioAnterior, fechaFinAnterior]);

        // Gastos período anterior
        const gastosAnteriorResult = await conexion.query(`
            SELECT COALESCE(SUM(t.monto), 0) as totalGastos
            FROM transacciones t
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            WHERE t.idUsuario = ? 
            AND tt.descripcion = 'Gasto'
            AND t.fecha >= ? 
            AND t.fecha <= ?
        `, [userId, fechaInicioAnterior, fechaFinAnterior]);

        // Extraer valores
        const totalIngresos = parseFloat(ingresosResult[0]?.totalIngresos || 0);
        const totalGastos = parseFloat(gastosResult[0]?.totalGastos || 0);
        const saldoTotal = parseFloat(saldoTotalResult[0]?.saldoTotal || 0);
        const balance = totalIngresos - totalGastos;

        const ingresosAnterior = parseFloat(ingresosAnteriorResult[0]?.totalIngresos || 0);
        const gastosAnterior = parseFloat(gastosAnteriorResult[0]?.totalGastos || 0);

        // Calcular porcentajes de cambio
        const calcularPorcentajeCambio = (actual: number, anterior: number): number => {
            if (anterior === 0) return actual > 0 ? 100 : 0;
            return ((actual - anterior) / anterior) * 100;
        };

        const porcentajeIngresos = calcularPorcentajeCambio(totalIngresos, ingresosAnterior);
        const porcentajeGastos = calcularPorcentajeCambio(totalGastos, gastosAnterior);

        // Obtener transacciones recientes
        const transaccionesRecientesResult = await conexion.query(`
            SELECT 
                t.monto,
                t.fecha,
                t.descripcion,
                c.nombre as categoria,
                tt.descripcion as tipo,
                cu.nombre as cuenta
            FROM transacciones t
            INNER JOIN categoria c ON t.idCategoria = c.idCategoria
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            INNER JOIN cuenta cu ON t.idCuenta = cu.idCuenta
            WHERE t.idUsuario = ?
            ORDER BY t.fecha DESC, t.idTransaccion DESC
            LIMIT 5
        `, [userId]);

        // Gastos por categoría del período
        const gastosPorCategoriaResult = await conexion.query(`
            SELECT 
                c.nombre as categoria,
                SUM(t.monto) as total,
                COUNT(t.idTransaccion) as transacciones
            FROM transacciones t
            INNER JOIN categoria c ON t.idCategoria = c.idCategoria
            INNER JOIN tipotransacciones tt ON t.idTipoTransaccion = tt.idTipoTransaccion
            WHERE t.idUsuario = ? 
            AND tt.descripcion = 'Gasto'
            AND t.fecha >= ? 
            AND t.fecha <= ?
            GROUP BY c.idCategoria, c.nombre
            ORDER BY total DESC
            LIMIT 5
        `, [userId, fechaInicio, fechaFin]);

        response.status = 200;
        response.body = {
            success: true,
            data: {
                periodo: periodo,
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                ingresos: {
                    total: totalIngresos,
                    porcentajeCambio: Math.round(porcentajeIngresos * 100) / 100,
                    anterior: ingresosAnterior
                },
                gastos: {
                    total: totalGastos,
                    porcentajeCambio: Math.round(porcentajeGastos * 100) / 100,
                    anterior: gastosAnterior
                },
                balance: {
                    actual: balance,
                    saldoTotal: saldoTotal,
                    disponible: saldoTotal
                },
                transaccionesRecientes: transaccionesRecientesResult || [],
                gastosPorCategoria: gastosPorCategoriaResult || []
            },
            message: `Estadísticas ${periodo} obtenidas correctamente`
        };

    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// ✅ OBTENER RESUMEN DE CUENTAS
export const getResumenCuentas = async (ctx: any) => {
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

        // Obtener resumen de cuentas
        const cuentasResult = await conexion.query(`
            SELECT 
                COUNT(*) as totalCuentas,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as cuentasActivas,
                COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as cuentasInactivas,
                COALESCE(SUM(CASE WHEN estado = 'activo' THEN saldo ELSE 0 END), 0) as saldoTotalActivo,
                COALESCE(SUM(saldo), 0) as saldoTotalGeneral,
                COALESCE(AVG(CASE WHEN estado = 'activo' THEN saldo END), 0) as promedioSaldoActivo
            FROM cuenta 
            WHERE idUsuario = ?
        `, [userId]);

        // Cuenta con mayor saldo
        const cuentaMayorSaldoResult = await conexion.query(`
            SELECT nombre, saldo, tipoCuenta
            FROM cuenta 
            WHERE idUsuario = ? AND estado = 'activo'
            ORDER BY saldo DESC
            LIMIT 1
        `, [userId]);

        // Cuenta con menor saldo (pero activa)
        const cuentaMenorSaldoResult = await conexion.query(`
            SELECT nombre, saldo, tipoCuenta
            FROM cuenta 
            WHERE idUsuario = ? AND estado = 'activo'
            ORDER BY saldo ASC
            LIMIT 1
        `, [userId]);

        response.status = 200;
        response.body = {
            success: true,
            data: {
                resumenGeneral: cuentasResult[0] || {},
                cuentaMayorSaldo: cuentaMayorSaldoResult[0] || null,
                cuentaMenorSaldo: cuentaMenorSaldoResult[0] || null
            },
            message: "Resumen de cuentas obtenido correctamente"
        };

    } catch (error) {
        console.error("Error al obtener resumen de cuentas:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        };
    }
};