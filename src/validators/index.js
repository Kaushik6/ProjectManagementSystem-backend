import { body } from "express-validator";
import { AvailableTaskStatues, AvailableUserRole } from "../utils/constants.js";


const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be in lower case")
            .isLength({min: 3})
            .withMessage("Username must be at least 3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is requird"),
        body("fullName")
            .optional()
            .trim(),
    ]
}

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("Email is Invalid"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old Password is required"),
        body("newPassword")
            .notEmpty()
            .withMessage("New Password is required")
    ]
}

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid")
    ]
}

const createProjectValidator = () => {
    return [
        body("name")
            .notEmpty()
            .withMessage("Name is required"),
        body("description")
            .optional()
    ]
}

const addMemeberToProjectValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required"),
        body("role")
            .notEmpty()
            .withMessage("Role is required")
            .isIn(AvailableUserRole)
            .withMessage("Role is invalid")
    ]
}

const createTaskValidator = () => {
    return [
        body("title")
            .notEmpty()
            .withMessage("Title is required"),
        body("description")
            .optional(),
        body("status")
            .notEmpty()
            .withMessage("Status is required")
            .isIn(AvailableTaskStatues)
            .withMessage("Status is Invalid")
    ]
}

const createSubTaskValidator = () => {
    return [
        body("title")
            .notEmpty()
            .withMessage("Title is required")
    ]
}

const createNoteValidator = () => {
    return [
        body("content")
            .notEmpty()
            .withMessage("Content is required")
    ]
}


export { 
    userRegisterValidator, 
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
    createProjectValidator,
    addMemeberToProjectValidator,
    createTaskValidator,
    createSubTaskValidator,
    createNoteValidator
}