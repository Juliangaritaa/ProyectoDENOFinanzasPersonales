import { Client } from "../Dependencies/Dependencies.ts";

export const conexion = await new Client().connect({
    hostname: "localhost",
    username: "root",
    db: "finanzas",
    password: "root"
});