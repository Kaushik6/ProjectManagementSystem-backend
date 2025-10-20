import {User} from "../models/user.models.js"
import { ProjectMember } from "../models/projectMember.models.js"
import {Project} from "../models/project.models.js"
import {Task} from "../models/task.models.js"
import { SubTask } from "../models/subtask.models.js"
import {ApiResponse} from "../utils/api-response.js"
import {ApiError} from "../utils/api-error.js"
import {asyncHandler} from "../utils/async-handler.js"
import mongoose from "mongoose"
import { AvailableUserRole, UserRolesEnum, TaskStatusEnum, AvailableTaskStatues} from "../utils/constants.js"

const getProjectTask = asyncHandler(async(req, res) => {
    const {projectId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400,"Project not found")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember){
        throw new ApiError(400,"You are not authorized to check the tasks")
    }

    if(!Object.values(AvailableUserRole).includes(projectMember.role)){
        throw new ApiError(400, "Invalid role")
    }

    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("assignedTo", "username fullname avatar")
      .populate("assignedBy", "username fullname avatar")
      .sort({createdAt: -1})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tasks,
                "Tasks fetched successfully"
            )
        )

})

const createTask = asyncHandler(async(req, res) => {
    const {projectId} = req.params
    const { title, description, assignedTo, status, attachements} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "Invalid project Name")
    }

    const projectMember = await ProjectMember.findOne(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    )

    if(!projectMember || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(projectMember.role)){
        throw new ApiError(400, "You are not authirized to add task")
    }

    if(!title){
        throw new ApiError(400, "Title is required")
    }

    const existUser = await User.findById(assignedTo)

    if(!existUser){
        throw new ApiError(400, "User does not exist")
    }

    if(status && !Object.values(AvailableTaskStatues).includes(status)){
        throw new ApiError(400, "Status is invalid")
    }

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        status,
        attachements
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                task,
                "Task created Successfully"
            )
        )
})


const getTaskDetails = asyncHandler(async(req, res) => {
    const {projectId, taskId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400,"Project not found")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember){
        throw new ApiError(400,"You are not authorized to check the tasks")
    }

    if(!Object.values(AvailableUserRole).includes(projectMember.role)){
        throw new ApiError(400, "Invalid role")
    }

    const task = await Task.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .populate("project", "name")

    if(!task){
        throw new ApiError(403, "Task not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                task,
                "Task detail fetched successfully"
            )
        )
})

const updateTask = asyncHandler(async(req, res) => {
    const {projectId, taskId} = req.params
    const { title, description, assignedTo, status, attachments} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "Invalid project Name")
    }

    const projectMember = await ProjectMember.findOne(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    )

    if(!projectMember || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(projectMember.role)){
        throw new ApiError(400, "You are not authirized to add task")
    }

    const task = await Task.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId)
    })

    if(!task){
        throw new ApiError(400, "Task not found")
    }

    if(title !== undefined) task.title = title
    if(description !== undefined) task.description = description
    if(assignedTo !== undefined){
        const assignedUser = await User.findById(assignedTo)
        if(!assignedUser){
            throw new ApiError(400, "Assigned User does not exit")
        }
        task.assignedTo = assignedTo
    }
    if(status !== undefined){
        if(!Object.values(AvailableTaskStatues).includes(status)){
            throw new ApiError(400, "Invalid Status")
        }
        task.status = status
    }
    if(attachments !== undefined) task.attachments = attachments

    const updatedTask = await task.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTask,
                "Task updated successfully"
            )
        )
})


const deleteTask = asyncHandler(async(req, res) => {
    const {projectId, taskId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "Invalid project Name")
    }

    const projectMember = await ProjectMember.findOne(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    )

    if(!projectMember || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(projectMember.role)){
        throw new ApiError(400, "You are not authirized to add task")
    }

    const task = await Task.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId)
    })

    if(!task){
        throw new ApiError(400, "Task not found")
    }

    await Task.findByIdAndDelete(task._id)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Task deleted successfully"
            )
        )
})

const createSubTask = asyncHandler(async(req, res) => {
    const {projectId, taskId} = req.params
    const {title} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "Invalid project Name")
    }

    const projectMember = await ProjectMember.findOne(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    )

    if(!projectMember || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(projectMember.role)){
        throw new ApiError(400, "You are not authirized to add task")
    }

    const parentTask = await Task.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId)
    })

    if(!parentTask){
        throw new ApiError(400, "Task not found")
    }

    const subTaskCreate = await SubTask.create({
        title,
        task: new mongoose.Types.ObjectId(taskId),
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subTaskCreate,
                "Subtask created successfully"
            )
        )
})


const updateSubTask = asyncHandler(async(req, res) => {
    const {projectId, subTaskId} = req.params
    const {title, isCompleted} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "Invalid project Name")
    }

    const projectMember = await ProjectMember.findOne(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    )

    if(!projectMember || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(projectMember.role)){
        throw new ApiError(400, "You are not authirized to add task")
    }

    const subTask = await SubTask.findOne({
        _id: new mongoose.Types.ObjectId(subTaskId)
    })

    if(!subTask){
        throw new ApiError(400, "SubTask does not exist")
    }

    if(title !== undefined) subTask.title = title
    if(isCompleted !== undefined) subTask.isCompleted = isCompleted

    const updatedSubtask = await subTask.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedSubtask,
                "Subtask updated successfully"
            )
        )
})


const deleteSubTask = asyncHandler(async(req, res) => {
    const {projectId, subTaskId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "Invalid project Name")
    }

    const projectMember = await ProjectMember.findOne(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    )

    if(!projectMember || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(projectMember.role)){
        throw new ApiError(400, "You are not authirized to add task")
    }

    const subTask = await SubTask.findOne({
        _id: new mongoose.Types.ObjectId(subTaskId)
    })

    if(!subTask){
        throw new ApiError(400, "SubTask does not exist")
    }

    await SubTask.findByIdAndDelete(subTask._id)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "SubTask deleted Successfully"
            )
        )
})



export {
    createTask,
    getProjectTask,
    getTaskDetails,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask
}