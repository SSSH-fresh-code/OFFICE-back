import { ValidationArguments } from 'class-validator';

export const stringValidationMessage = (
  validationArguments: ValidationArguments,
) => {
  return `${validationArguments.property}의 값이 존재하지 않습니다.`;
};
