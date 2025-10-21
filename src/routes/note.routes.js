import { Router } from "express";
import { 
    getProjectNotes,
    createNote,
    getNoteDetails,
    updateNote,
    deleteNote
} from "../controllers/note.controllers.js";
import { createNoteValidator } from "../validators/index.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { UserRolesEnum, AvailableUserRole } from "../utils/constants.js";

const router = Router()

router.use(verifyJWT)

router.route("/:projectId").get(validateProjectPermission(AvailableUserRole), getProjectNotes)

router
    .route("/:projectId")
    .post(validateProjectPermission([UserRolesEnum.ADMIN]), createNoteValidator(), validate, createNote)

router
    .route("/:projectId/n/:noteId")
    .get(validateProjectPermission(AvailableUserRole), getNoteDetails)

router
    .route("/:projectId/n/:noteId")
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateNote)

router
    .route("/:projectId/n/:noteId")
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteNote)

export default router