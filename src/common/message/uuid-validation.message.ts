import { ValidationArguments } from 'class-validator';

export const uuidValidationMessage = (
  validationArguments: ValidationArguments,
) => {
  return `${validationArguments.property} 값이 올바르지 않습니다.`
};
