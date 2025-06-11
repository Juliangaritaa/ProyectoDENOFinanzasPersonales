import { CrearToken,VerificarTokenAcceso } from "../Helpers/Jwt.ts";
import { iniciarSesion } from "../Models/LoginModels.ts";

export const posUserLogin = async(ctx:any) => {

    const {request,response} = ctx;

    try{

        const contentLength = request.headers.get("Content-Length");
        //Verificamos si el cuerpo de la solicitud contiene informacion
        if(contentLength === "0"){
            response.status = 400;
            response.body = {success:false, msg:"Cuerpo de la solicitud vacio"};
            return;
        }

        const body = await request.body.json();

        //Validar si tenemos email y contraseña
        if(!body.email || !body.password){
            response.status = 400;
            response.body  = {success:false,msg:"Faltan datos (email o contraseña)"};
            return;
        }

        const result = await iniciarSesion(body.email,body.password);

        if(result.success){
            const token = await CrearToken(result.data.idUsuario.toString());
            response.status = 200;
            response.body = {
                success:true,
                accessToken:token,
                data:`${result.data.nombre} ${result.data.apellido}`,
                userId: result.data.idUsuario, // ✅ AGREGADO: ID del usuario
                userInfo: {
                    id: result.data.idUsuario,
                    nombre: result.data.nombre,
                    apellido: result.data.apellido,
                    email: result.data.email
                }
            };
        }else{
            response.status = 401;
            response.body = {
                success:false,
                msg:"Credenciales incorrectas"
            }
        }

    }catch(error){

        response.status = 500;
        response.body={success:false,msg:"Error interno del servidor: " + error};

    }
}