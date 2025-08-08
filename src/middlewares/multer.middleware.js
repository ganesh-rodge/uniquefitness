import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary';

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/temp')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage
})