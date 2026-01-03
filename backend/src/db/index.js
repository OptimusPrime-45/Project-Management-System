import mongoose from "mongoose";
import { User } from "../models/user.models.js";

const ensureSuperAdmin = async () => {
    try {
        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({ 
            email: "neerajpandey8698552285@gmail.com" 
        });

        if (!existingSuperAdmin) {
            // Create super admin user
            await User.create({
                username: "neeraj",
                email: "neerajpandey8698552285@gmail.com",
                password: "neeraj123",
                fullname: "Neeraj Pandey",
                isSuperAdmin: true,
                isEmailVerified: true,
                avatar: {
                    url: "https://placehold.co/200x200",
                    localPath: "",
                }
            });
            console.log("✅ Super admin created successfully");
        } else if (!existingSuperAdmin.isSuperAdmin) {
            // Ensure existing user is marked as super admin
            existingSuperAdmin.isSuperAdmin = true;
            existingSuperAdmin.isEmailVerified = true;
            await existingSuperAdmin.save();
            console.log("✅ Super admin privileges updated");
        }
    } catch (error) {
        console.error("❌ Error ensuring super admin:", error.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected successfully");
        
        // Ensure super admin exists
        await ensureSuperAdmin();
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
}

export default connectDB;