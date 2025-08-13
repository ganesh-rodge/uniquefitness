// utils/createDefaultAdmin.js
import { Admin } from "../models/admin.model.js";

export const createDefaultAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne();
        if (existingAdmin) {
            console.log("✅ Admin already exists");
            return;
        }

        await Admin.create({
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD // will be hashed by pre-save hook
        });

        console.log("✅ Default admin created successfully");
    } catch (error) {
        console.error("❌ Error creating default admin:", error);
    }
};
