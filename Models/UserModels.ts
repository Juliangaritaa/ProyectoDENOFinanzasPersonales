import { conexion } from "../Models/Conexion.ts";
import { z } from "../Dependencies/Dependencies.ts";

interface UsuarioData{
    idUsuario:number|null;
    nombre:string;
    apellido:string;
    telefono:string;
    direccion:string;
    email:string;
    password:string;
}

export class Usuario{
    public _objUsuario: UsuarioData | null;
    public _idUsuario: number| null;

    constructor(objUsuario: UsuarioData | null = null, idUsuario:number | null = null){
        this._objUsuario = objUsuario;
        this._idUsuario = idUsuario;
    }

    public async SeleccionarUsuario():Promise<UsuarioData[]>{
        const {rows:usuario} = await conexion.execute('select idUsuario, nombre, apellido, telefono,direccion,email,password from usuario');
        return usuario as UsuarioData[];
    }

    public async InsertarUsuario():Promise<{ success:boolean;message:string;usuario?:Record<string,unknown>}>{

        try{

            if(!this._objUsuario){
                throw new Error("No se a proporcionado un objeto de usuario valido");
            }

            const {nombre, apellido,telefono,direccion, email, password} = this._objUsuario;
            if(!nombre || !apellido || !telefono ||!direccion|| !email || !password){
                throw new Error("Faltan campos requeridos para insertar la informacion");
            }

            await conexion.execute("START TRANSACTION");
           const result = await conexion.execute('insert into usuario (nombre, apellido, telefono, direccion, email, password) values (?, ?, ?, ?, ?, ?)', [
                nombre, 
                apellido,
                telefono,
                direccion,
                email,
                password
            ]);

            if(result && typeof result.affectedRows === "number" && result.affectedRows > 0){
                const [usuario] = await conexion.query('select * from usuario where idUsuario = LAST_INSERT_ID()',);
                await conexion.execute("COMMIT");
                return {success:true,message:"Cliente registrado correctamente",usuario:usuario};
            }else{
                throw new Error("No fue posible registrar al usuario");
            }
        }catch(error){
            await conexion.execute("ROLLBACK");
            if(error instanceof z.ZodError){
                return{success:false, message:error.message}
            }else{
                return{success:false,message:"Error interno del servidor"}
            }
        }

    }

    public async ActualizarUsuario(): Promise<{success: boolean; message:string; usuario?: Record<string, unknown>}>{
        try {
            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario valido")
            }

            const { idUsuario, nombre, apellido,telefono,direccion, email, password } = this._objUsuario;

            if (!idUsuario) {
                throw new Error("Se requiere el ID del usuario para actualizarlo");
            }

            if (!nombre || !apellido || !telefono ||!direccion || !email || !password) {
                throw new Error("Faltan campos requeridos para actualizar el usuario");
            } 

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(
                `UPDATE usuario SET nombre = ?, apellido = ?, telefono = ?,direccion = ? ,email = ?, password = ? WHERE idUsuario = ?`,[
                    nombre, apellido,telefono,direccion, email, password, idUsuario
                ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                
                const [usuario] = await conexion.query(
                    `SELECT * FROM usuario WHERE idUsuario = ?`,[idUsuario]
                );

                await conexion.execute("COMMIT");
                return{ success: true, message:"Cliente Actualizado correctamente",usuario:usuario};
            }else{

                throw new Error("No fue posible actualizar el usuario")
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            if (error instanceof z.ZodError) {
                return {success:false,message: error.message}
            }else{
                return {success: false, message:"Error interno del servidor"}
            }
        }
    }

     public async EliminarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
        try {
            if (!this._objUsuario || !this._objUsuario.idUsuario) {
                throw new Error("No se ha proporcionado un ID de usuario válido");
            }

            const idUsuario = this._objUsuario.idUsuario;

            await conexion.execute("START TRANSACTION");

            // Verificar si el usuario existe antes de eliminar
            const [UsuarioExistente] = await conexion.query('SELECT * FROM usuario WHERE idUsuario = ?', [idUsuario]);
            
            if (!UsuarioExistente) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "El usuario no existe" };
            }

            const result = await conexion.execute('DELETE FROM usuario WHERE idUsuario = ?', [idUsuario]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return { 
                    success: true, 
                    message: "Usuario eliminado correctamente", 
                    usuario: UsuarioExistente
                };
            } else {
                await conexion.execute("ROLLBACK");
                throw new Error("No fue posible eliminar el usuario");
            }

        } catch (error) {
            await conexion.execute("ROLLBACK");
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message };
            } else {
                return { success: false, message: "Error interno del servidor" };
            }
        }
    }
}