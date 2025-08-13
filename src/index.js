import dotenv from 'dotenv'
import {connectDB} from './db/index.js'
import app from './app.js'
import { createDefaultAdmin } from './utils/createDefaultAdmin.js'


dotenv.config()



const port = process.env.PORT || 5000 

connectDB()
    .then(async ()=>{
        await createDefaultAdmin();
        app.listen(port, ()=>{
            console.log(`Server is listening on the port : ${port}`)
        })
    })
    .catch((err)=>{
        console.log(`Cannot connect to the database: ${err}`)
    })
