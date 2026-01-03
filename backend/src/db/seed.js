import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.models.js";

dotenv.config();

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected for seeding");

        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({ 
            email: "neerajpandey8698552285@gmail.com" 
        });

        if (existingSuperAdmin) {
            console.log("⚠️  Super admin already exists");
            
            // Update to ensure isSuperAdmin is true and email is verified
            existingSuperAdmin.isSuperAdmin = true;
            existingSuperAdmin.isEmailVerified = true;
            existingSuperAdmin.username = "neeraj";
            await existingSuperAdmin.save();
            
            console.log("✅ Super admin updated successfully");
        } else {
            // Create super admin user
            const superAdmin = await User.create({
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
            console.log("📧 Email:", superAdmin.email);
            console.log("👤 Username:", superAdmin.username);
        }

        await mongoose.connection.close();
        console.log("✅ Database connection closed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding super admin:", error);
        process.exit(1);
    }
};

seedSuperAdmin();
