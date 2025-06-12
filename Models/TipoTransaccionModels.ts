import { conexion } from './Conexion.ts';

interface TipoTransaccionData {
    idTipoTransaccion: number | null;
    descripcion: string;
}

export class TipoTransaccion {
    public _objTipoTransaccion: TipoTransaccionData | null;
    public _idTipoTransaccion: number | null;

    constructor(objTipoTransaccion: TipoTransaccionData | null = null, idTipoTransaccion: number | null = null) {
        this._objTipoTransaccion = objTipoTransaccion;
        this._idTipoTransaccion = idTipoTransaccion;
    }

    // ✅ SELECCIONAR TODOS LOS TIPOS DE TRANSACCIÓN (Solo Gasto e Ingreso)
    public async SeleccionarTipoTransaccion(): Promise<TipoTransaccionData[]> {
        try {
            const { rows: tipos } = await conexion.execute(
                'SELECT idTipoTransaccion, descripcion FROM tipotransaccion ORDER BY descripcion'
            );
            return tipos as TipoTransaccionData[];
        } catch (error) {
            console.error("Error al obtener tipos de transacción:", error);
            return [];
        }
    }

    // ✅ INICIALIZAR TIPOS BASE (Gasto e Ingreso)
    public async InicializarTiposBase(): Promise<{ success: boolean; message: string }> {
        try {
            await conexion.execute("START TRANSACTION");

            // Verificar si ya existen los tipos base
            const tiposExistentes = await conexion.query(
                'SELECT descripcion FROM tipotransaccion WHERE descripcion IN (?, ?)',
                ['Gasto', 'Ingreso']
            );

            const tiposQueExisten = tiposExistentes.map((tipo: any) => tipo.descripcion);
            
            // Insertar solo los que no existen
            if (!tiposQueExisten.includes('Gasto')) {
                await conexion.execute(
                    'INSERT INTO tipotransaccion (descripcion) VALUES (?)',
                    ['Gasto']
                );
            }

            if (!tiposQueExisten.includes('Ingreso')) {
                await conexion.execute(
                    'INSERT INTO tipotransaccion (descripcion) VALUES (?)',
                    ['Ingreso']
                );
            }

            await conexion.execute("COMMIT");
            return { 
                success: true, 
                message: "Tipos de transacción base inicializados correctamente" 
            };

        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al inicializar tipos base:", error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : "Error interno del servidor" 
            };
        }
    }
}