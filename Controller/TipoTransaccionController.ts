// deno-lint-ignore-file
import { TipoTransaccion } from '../Models/TipoTransaccionModels.ts';

// ✅ VER TODOS LOS TIPOS DE TRANSACCIÓN DISPONIBLES (Solo Gasto e Ingreso)
export const getTipoTransaccion = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objTipoTransaccion = new TipoTransaccion();
        
        // Inicializar tipos base si no existen
        await objTipoTransaccion.InicializarTiposBase();
        
        // Obtener tipos disponibles
        const listaTipos = await objTipoTransaccion.SeleccionarTipoTransaccion();
        
        response.status = 200;
        response.body = {
            success: true,
            data: listaTipos,
            count: listaTipos.length,
            message: "Tipos de transacción disponibles (Gasto e Ingreso)"
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