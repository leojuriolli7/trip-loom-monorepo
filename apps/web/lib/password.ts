const validateLength = (password: string) => password.length >= 8;
const validateNumber = (password: string) => /\d/.test(password);
const validateSpecialCharacter = (password: string) =>
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

export const passwordRequirements = [
  { label: "At least 8 characters", validate: validateLength },
  { label: "At least 1 number", validate: validateNumber },
  { label: "At least 1 special character", validate: validateSpecialCharacter },
] as const;

export { validateLength, validateNumber, validateSpecialCharacter };
