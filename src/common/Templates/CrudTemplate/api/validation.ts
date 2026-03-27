// TODO: Replace MODULE_NAME token and update field rules to match your domain model.

import * as yup from 'yup';

import { MODULE_NAME_STATUS_OPTIONS, MODULE_NAMEStatus } from './types';

export const module_nameValidationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Name is required.')
    .max(255, 'Name must not exceed 255 characters.'),

  description: yup
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters.'),

  status: yup
    .mixed<MODULE_NAMEStatus | ''>()
    .required('Status is required.')
    .oneOf(MODULE_NAME_STATUS_OPTIONS, 'Select a valid status.'),

  isActive: yup.boolean().required(),

  // TODO: add / remove field rules to match MODULE_NAMEModel
});

export type MODULE_NAMEValidationSchema = yup.InferType<typeof module_nameValidationSchema>;
