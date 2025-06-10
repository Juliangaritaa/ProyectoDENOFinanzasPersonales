// deno-lint-ignore-file
import { Usuario } from '../Models/UserModels.ts';

export const getUsuario = async(ctx:any)=>{
    const {response} = ctx;

    try{
        const objUsuario = new Usuario();
        const listaUsuario = await objUsuario.SeleccionarUsuario();
        response.status = 200;
        response.body = {
            success:true,
            data:listaUsuario,
            count: listaUsuario.length
        }
    }catch(error){
        response.status = 400;
        response.body = {
            success:false,
            message:"Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        }
    }
};

export const postUsuario = async(ctx:any)=>{
    const {response,request} = ctx;
    try{
       const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = {success:false, message:"El cuerpo de la solicitud se encuentra vacío."};
            return;
        }
        
        const body = await request.body.json();
        const UsuarioData = {
            idUsuario: null,
            nombre: body.nombre,
            apellido: body.apellido,
            telefono:body.telefono,
            direccion:body.direccion,
            email: body.email,
            password: body.password
        }
        
        const objUsuario = new Usuario(UsuarioData)
        const result = await objUsuario.InsertarUsuario();
        
        // ✅ Mantener estructura original para compatibilidad con frontend
        response.status = 200;
        response.body = {
            success: result.success,
            body: result
        };

    }catch(error){
        response.status = 400;
        response.body = {
            success:false,
            message:"Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        }
    }
};

export const putUsuario = async(ctx: any)=>{
    const {response,request} = ctx;

    try{
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = {success: false, message: "Cuerpo de la solicitud está vacío"};
            return;
        }

        const body = await request.body.json();
        const UsuarioData = {
            idUsuario: body.idUsuario,
            nombre: body.nombre,
            apellido: body.apellido,
            telefono:body.telefono,
            direccion:body.direccion,
            email: body.email,
            password: body.password
        }

        const objUsuario = new Usuario(UsuarioData);
        const result = await objUsuario.ActualizarUsuario();
        
        // ✅ Mantener estructura original para compatibilidad con frontend
        response.status = 200;
        response.body = {
            success: result.success,
            body: result
        };

    }catch(error){
        response.status = 400;
        response.body = {
            success:false,
            message:"Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        }
    }
};

export const deleteUsuario = async (ctx: any) => {
    const { response, request } = ctx;
    try {
        const contentLength = request.headers.get("Content-Length");
        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, message: "El ID del usuario es requerido para eliminarlo" };
            return;
        }

        const body = await request.body.json();
        if (!body.idUsuario) {
            response.status = 400;
            response.body = { success: false, message: "El ID del usuario es requerido para eliminarlo" };
            return;
        }

        const UsuarioData = {
            idUsuario: body.idUsuario,
            nombre: "",
            apellido: "",
            telefono:"",
            direccion:"",
            email: "",
            password: ""
        };
        
        const objUsuario = new Usuario(UsuarioData);
        const result = await objUsuario.EliminarUsuario();

        // ✅ Mantener estructura original para compatibilidad con frontend
        response.status = 200;
        response.body = {
            success: result.success,
            body: result
        };
        
    } catch (error) {
        response.status = 400;
        response.body = {
            success: false,
            message: "Error al procesar la solicitud",
            error: error instanceof Error ? error.message : String(error)
        }
    }
};