import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";
import { ApiResponse } from "../utils/api-response.js";

const checkProjectAccess = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user._id;
    const requiredRole = req.requiredRole; // Optional role requirement

    // Set projectId on request for controllers to access
    req.projectId = projectId;

    // Check if user is super admin
    if (req.user.isSuperAdmin) {
        req.projectAccess = { isSuperAdmin: true, role: "super_admin" };
        return next();
    }

    // Find project membership for regular users
    const membership = await ProjectMember.findOne({
        user: userId,
        project: projectId
    }).populate("user project");

    if (!membership) {
        throw new ApiError(403, "You don't have access to this project");
    }

    // Check if specific role is required
    if (requiredRole && membership.role !== requiredRole) {
        throw new ApiError(403, `Access denied. Required role: ${requiredRole}`);
    }

    req.projectAccess = { 
        isSuperAdmin: false, 
        role: membership.role,
        membership 
    };
    
    next();
});

export { checkProjectAccess };