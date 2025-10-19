import { Router } from "express";
import { createProject, addProjectMember, getProjectById, getProjects, updateProject, updateMemberRole, deleteProject, projectMembers, removeMember } from "../controllers/project.controllers.js";
import { createProjectValidator, addMemeberToProjectValidator } from "../validators/index.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { AvailableUserRole,UserRolesEnum } from "../utils/constants.js";

const router = Router()

router.use(verifyJWT)

router.route("/").get(getProjects)

router.route("/").post(createProjectValidator(),validate,createProject)

router.route("/:projectId").get(validateProjectPermission(AvailableUserRole),getProjectById)

router.route("/:projectId").put(validateProjectPermission([UserRolesEnum.ADMIN]), createProjectValidator(),validate,updateProject)

router.route("/:projectId").delete(validateProjectPermission([UserRolesEnum.ADMIN]),deleteProject)

router.route("/:projectId/member").get(projectMembers)

router.route("/:projectId/member").post(validateProjectPermission([UserRolesEnum.ADMIN]), addMemeberToProjectValidator(), validate, addProjectMember)

router.route("/:projectId/member/:userId").put(validateProjectPermission([UserRolesEnum.ADMIN]),updateMemberRole)

router.route("/:projectId/member/:userId").delete(validateProjectPermission([UserRolesEnum.ADMIN]),removeMember)


export default router;