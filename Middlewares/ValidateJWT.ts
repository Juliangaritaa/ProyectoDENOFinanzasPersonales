import { VerificarTokenAcceso } from "../Helpers/Jwt.ts";
import { Context,Next } from "https://deno.land/x/oak@v17.1.3/mod.ts";


//Middleware para proteger las rutas

export async function authMiddlware(ctx:Context,next:Next){

    const authHeader = ctx.request.headers.get("Authorization");

    if(!authHeader){
        ctx.response.status = 401;
        ctx.response.body = {error: "NO ESTA AUTORIZADO"}
        return;

    }

    const token = authHeader.split(" ")[1];
    const usuario = await VerificarTokenAcceso(token);

    if(!usuario){
        ctx.response.status = 401;
        ctx.response.body = {error:"TOKEN INVALIDO"}
        return;
    }

    ctx.state.user = usuario;
    await next()




}