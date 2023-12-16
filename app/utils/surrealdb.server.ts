import { error } from 'console'
import Surreal from 'surrealdb.js'

const surreal = {
    url: 'http://localhost:8000/rpc',
    namespace: 'test',
    database: 'test',
    username: 'root',
    password: 'root',
}
interface Parameters {
    [key: string]: any
}

export interface DatabaseResponse<T> {
    status: string
    detail?: string
    time: string
    result: T[]
}

interface Query {
    sql: string[]
    parameters?: Parameters
}
const db = new Surreal();
(async () => {
    return await db.connect(surreal.url, {
        namespace: surreal.namespace,
        database: surreal.database,
        auth: {
            username: surreal.username,
            password: surreal.password,
        },
        prepare: () => {
            console.log(`Connected to ${surreal.namespace}:${surreal.database}`)
        }
    })
})()


async function handleQuery<T>(query: Query) {
    try {
        const responses = await db.query(query.sql.join("\n"), query.parameters ?? {}) as T[][]
        // console.log(responses)
        return responses
    }
    catch (ex: any) {


        throw error({
            success: false,
            fatal: true,
            statusCode: 500,
            message: "Internal Server Error."
            // message: responses.find(r => r.status == 'ERR')?.result.toString() ?? "UNKNOWN ERROR."
        })
    }
}
export async function queryAll<T>(query: Query): Promise<{ response: T[]; success: boolean; }> {
    let response = await handleQuery<T>(query) 

    return {response: response[0], success: true}
}