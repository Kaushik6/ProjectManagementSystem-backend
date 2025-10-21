import {User} from "../models/user.models.js"
import { ProjectMember } from "../models/projectMember.models.js"
import {Project} from "../models/project.models.js"
import { Note } from "../models/note.models.js"
import {ApiResponse} from "../utils/api-response.js"
import {ApiError} from "../utils/api-error.js"
import {asyncHandler} from "../utils/async-handler.js"
import mongoose from "mongoose"
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js"
import { validate } from "../middlewares/validator.middleware.js"

const getProjectNotes = asyncHandler(async(req, res) => {
    const { projectId } = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(403, "Project does not exist")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember || !Object.values(AvailableUserRole).includes(projectMember.role)){
        throw new ApiError(403, "You are not authorized to access the project notes")
    }

    const notes = await Note.find({
        project: new mongoose.Types.ObjectId(projectId)
    }).sort({ createdAt: -1 })


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                notes,
                "Project Notes fetched successfully"
            )
        )
})

const createNote = asyncHandler(async(req, res) => {
    const {projectId} = req.params
    const {content} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(403, "Project does not exist")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember || projectMember.role != UserRolesEnum.ADMIN ){
        throw new ApiError(403, "You are not authorized to create the project notes")
    }

    const notes = await Note.create({
        project: new mongoose.Types.ObjectId(projectId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        content
    })

    return res
        .status(200)
        .json(
            200,
            notes,
            "Note created Successfully"
        )

})

const getNoteDetails = asyncHandler(async(req, res) => {
    const {projectId, noteId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(403, "Project does not exist")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember || !Object.values(AvailableUserRole).includes(projectMember.role)){
        throw new ApiError(403, "You are not authorized to access the notes details")
    }

    const notes = await Note.findOne({
        _id: new mongoose.Types.ObjectId(noteId),
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("createdBy", "fullname email")
      .populate("project", "name")

    if(!notes){
        throw new ApiError(404, "Note not found")
    }

    return res
        .status(200)
        .json(
            200,
            notes,
            "Note Details fetched successfully"
        )

})

const updateNote = asyncHandler(async(req, res) => {
    const {projectId, noteId} = req.params
    const {content} = req.body

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(403, "Project does not exist")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember || projectMember.role != UserRolesEnum.ADMIN ){
        throw new ApiError(403, "You are not authorized to update the notes details")
    }

    const notes = await Note.findOne({
        _id: new mongoose.Types.ObjectId(noteId),
        project: new mongoose.Types.ObjectId(projectId)
    })

    if(!notes){
        throw new ApiError(404, "Note not found")
    }

    if(content !== undefined) notes.content = content

    const updatedNotes = await notes.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedNotes,
                "Notes updated successfully"
            )
        )
})

const deleteNote = asyncHandler(async(req, res) => {
    const {projectId, noteId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(403, "Project does not exist")
    }

    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!projectMember || projectMember.role != UserRolesEnum.ADMIN ){
        throw new ApiError(403, "You are not authorized to delete the notes")
    }

    const notes = await Note.findOne({
        _id: new mongoose.Types.ObjectId(noteId),
        project: new mongoose.Types.ObjectId(projectId)
    })

    if(!notes){
        throw new ApiError(404, "Note not found")
    }

    await Note.findByIdAndDelete(notes._id)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Notes deleted successfully"
            )
        )
})

export {
    getProjectNotes,
    createNote,
    getNoteDetails,
    updateNote,
    deleteNote
}