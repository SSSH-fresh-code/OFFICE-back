import { ValidationArguments } from 'class-validator';

export const legnthValidationMessage = (
  validationArguments: ValidationArguments,
) => {
  const c = validationArguments.constraints;
  if (c.length === 2) {
    if (c[0] === c[1]) return `${validationArguments.property}의 길이가 올바르지 않습니다.`
    return `${validationArguments.property}의 길이를 ${c[0]}~${c[1]} 이내로 작성해주세요.`;
  } else {
    return `${validationArguments.property}의 길이를 ${c[0]}이상으로 작성해주세요`;
  }
};
