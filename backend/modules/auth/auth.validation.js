import { body, validationResult } from 'express-validator';

import { ROLES, createAppError } from '../../utils/constants.js';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role')
    .isIn([ROLES.INSTRUCTOR, ROLES.LEARNER])
    .withMessage('Role must be instructor or learner'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const adminRegistrationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('adminToken').trim().notEmpty().withMessage('Admin registration token is required'),
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      createAppError(
        errors
          .array()
          .map((error) => error.msg)
          .join(', '),
        400
      )
    );
  }

  return next();
};
