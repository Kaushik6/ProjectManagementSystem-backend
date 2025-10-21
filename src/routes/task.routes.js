import { Router } from "express";
import { 
    createTask,
    getProjectTask,
    getTaskDetails,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask  
} from "../controllers/task.controllers.js";
import { createTaskValidator, createSubTaskValidator  } from "../validators/index.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { UserRolesEnum, AvailableUserRole } from "../utils/constants.js";

const router = Router()

router.use(verifyJWT)

router.route("/:projectId").get(validateProjectPermission(AvailableUserRole),getProjectTask)

router.route("/:projectId").post(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),createTaskValidator(),validate,createTask)

router.route("/:projectId/t/:taskId").get(validateProjectPermission(AvailableUserRole), getTaskDetails)

router.route("/:projectId/t/:taskId").put(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), updateTask)

router.route("/:projectId/t/:taskId").delete(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), deleteTask)

router.route("/:projectId/t/:taskId/subtasks").post(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),createSubTaskValidator(),validate,createSubTask)

router.route("/:projectId/st/:subTaskId").put(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),updateSubTask)

router.route("/:projectId/st/:subTaskId").delete(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),deleteSubTask)


export default router