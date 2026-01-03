import mongoose, { Types } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const updateOwnProfile = asyncHandler(async (req, res) => {
// Get username, fullname, avatar from request
// User can only update their own profile (req.user._id)

// Cannot change:
//   - email (requires verification)
//   - password (use change password endpoint)
//   - isSuperAdmin (only super admin can modify)

// Update allowed fields
// Return updated user

    const userId = req.user._id;
    const { username, fullname, avatar } = req.body;

    // Validate input
    if (!username && !fullname && !avatar) {
        throw new ApiError(400, "At least one field (username, fullname, or avatar) is required to update");
    }

    // Check if username is already taken by another user
    if (username) {
        const existingUser = await User.findOne({
            username: username.toLowerCase(),
            _id: { $ne: userId } // Exclude current user
        });

        if (existingUser) {
            throw new ApiError(409, "Username is already taken");
        }
    }

    // Prepare update object with only provided fields
    const updateFields = {};
    if (username !== undefined) updateFields.username = username.toLowerCase();
    if (fullname !== undefined) updateFields.fullname = fullname;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Profile updated successfully")
        )
})

const getOwnProjects = asyncHandler(async (req, res) => {
// Get projects where user is a member
// For each project, include user's role
// Return project list

    const userId = req.user._id;

    const ownProjects = await mongoose.model("ProjectMember").aggregate([
        {
            $match: { user: new Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projectDetails",
            }
        },
        { $unwind: "$projectDetails" },
        {
            $project: {
                _id: "$projectDetails._id",
                name: "$projectDetails.name",
                description: "$projectDetails.description",
                createdBy: "$projectDetails.createdBy",
                createdAt: "$projectDetails.createdAt",
                role: "$role"
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, ownProjects, "User's projects fetched successfully")
        )
})

const searchUsers = asyncHandler(async (req, res) => {
    // Search for users by email or username
    // Exclude super admins from results
    // Optional: exclude users already in a specific project
    
    const { query, projectId } = req.query;
    
    if (!query || query.trim() === "") {
        throw new ApiError(400, "Search query is required");
    }
    
    // Build search criteria
    const searchRegex = new RegExp(query.trim(), "i");
    const searchCriteria = {
        $or: [
            { email: searchRegex },
            { username: searchRegex },
            { fullname: searchRegex }
        ],
        isSuperAdmin: { $ne: true } // Exclude super admins
    };
    
    // Find users matching search
    let users = await User.find(searchCriteria)
        .select("username email fullname avatar isEmailVerified")
        .limit(10);
    
    // If projectId is provided, exclude users already in that project
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
        const ProjectMember = mongoose.model("ProjectMember");
        const existingMembers = await ProjectMember.find({ project: projectId })
            .select("user");
        
        const existingUserIds = existingMembers.map(m => m.user.toString());
        users = users.filter(user => !existingUserIds.includes(user._id.toString()));
    }
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, users, "Users found successfully")
        );
});

export {
    updateOwnProfile,
    getOwnProjects,
    searchUsers
};