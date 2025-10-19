import { User } from "../models/user.models.js"
import { Project } from "../models/project.models.js"
import { ProjectMember } from "../models/projectMember.models.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiResponse } from "../utils/api-response.js"
import { ApiError } from "../utils/api-error.js"
import mongoose from "mongoose"
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js"

const getProjects = asyncHandler(async(req, res) => {
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectmembers"
                        }
                    },
                    {
                        $addFields: {
                            members: {
                                size: "$projectmembers"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$project"
        },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1,
                _id: 0,
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            projects,
            "Project fetched Successfully"
        ))
})

const createProject = asyncHandler(async(req, res) => {
    const {name, description} = req.body

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                project,
                "Project created successfully"
            )
        )
})

const getProjectById = asyncHandler(async(req, res) =>{
    const { projectId } = req.params
    
    const project = await Project.findById(projectId)

    if(!project) {
        throw new ApiError(400, "Project Not Found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            project,
            "Project fetched successfully"
        ))
})

const updateProject = asyncHandler(async(req, res) =>{
    const { name, description } = req.body
    const { projectId } = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(404, "Project not found")
    }

    const member = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!member || member.role !== UserRolesEnum.ADMIN){
        throw new ApiError(403, "You are not authorized to update this project")
    }

    project.name = name
    project.description = description

    const updatedProject = await project.save({validateBeforeSave: false})
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedProject,
                "Your Project updated successfully"
            )
        )
})

const deleteProject = asyncHandler(async(req, res) => {
    const { projectId } = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(404, "Project not found")
    }

    const member = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!member || member.role !== UserRolesEnum.ADMIN){
        throw new ApiError(403, "You are not authorized to delete this project")
    }

    await ProjectMember.deleteMany({
        project: new mongoose.Types.ObjectId(projectId)
    })

    await Project.findByIdAndDelete(projectId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Project Deleted Successfully"
            )
        )
})

const projectMembers = asyncHandler(async(req, res) => {
    const projectId = req.params

    const project = await Project.findById(projectId)

    if(!project){
        new ApiError(404, "Project not found")
    }

    const projectmember = await ProjectMember.findById({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectmember){
        new ApiError(403, "You are not authorized to see the project memeber")
    }

    const member = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$user", 0]
                }
            }
        },
        {
            $project: {
                _id: 0,
                user: 1,
                project: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                member,
                "Project member fetched"
            )
        )
})

const addProjectMember = asyncHandler(async(req, res) => {
    const projectId = req.params
    const {userId, role} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(404, "Project not found")
    }

    const checkAdminUser = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!checkAdminUser || checkAdminUser.role !== UserRolesEnum.ADMIN ){
        throw new ApiError(403, "You are not authorized to add member")
    }

    const userExit = await User.findById(userId)

    if(!userExit){
        throw new ApiError(404, "User not found")
    }

    const alreadyMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    if(alreadyMember){
        throw new ApiError(400, "User is already a memeber of this project")
    }

    if(!Object.values(AvailableUserRole).includes(role)){
        throw new ApiError(400, "Invalid Role")
    }

    const addmember = await ProjectMember.create({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
        role,
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {},
                "Member added Successfully"
            )
        )
})

const updateMemberRole = asyncHandler(async(req, res) => {
    const {projectId,userId} = req.params
    const { role } = req.body

    if(!Object.values(AvailableUserRole).includes(role)){
        throw new ApiError(400, "Invalid Role")
    }

    const existProjectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    if(!existProjectMember){
        throw new ApiError(404, "Project member not found")
    }

    const checkAdminUser = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!checkAdminUser || checkAdminUser.role !== UserRolesEnum.ADMIN){
        throw new ApiError(404, "You are not authorized to update role")
    }

    existProjectMember.role = role
    await existProjectMember.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                existProjectMember,
                "Role updated successfully"
            )
        )
})

const removeMember = asyncHandler(async(req, res) =>{
    const {projectId,userId} = req.params

    const existProjectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    if(!existProjectMember){
        throw new ApiError(404, "Project member not found")
    }

    const checkAdminUser = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!checkAdminUser || checkAdminUser.role !== UserRolesEnum.ADMIN){
        throw new ApiError(404, "You are not authorized to delete member details")
    }

    if(existProjectMember.role === UserRolesEnum.ADMIN){
        throw new ApiError(404, "You cannot delete admin details")
    }

    await ProjectMember.deleteOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Member deleted successfully"
            )
        )
})

export {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    projectMembers,
    addProjectMember,
    updateMemberRole,
    removeMember
}