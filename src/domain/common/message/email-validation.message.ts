import { ValidationArguments } from 'class-validator';

export const emailValidationMessage = (
  validationArguments: ValidationArguments,
) => {
  return `${validationArguments.property}은 이메일 양식으로 입력해주세요.`;
};
