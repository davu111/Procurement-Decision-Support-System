export interface EmployeeLike {
  username?: string | null;
}

export const isCurrentUserEmployee = (
  employee: EmployeeLike,
  currentUsername?: string | null,
): boolean => {
  const normalizedEmployeeUsername = employee.username?.trim().toLowerCase();
  const normalizedCurrentUsername = currentUsername?.trim().toLowerCase();

  return Boolean(
    normalizedEmployeeUsername &&
    normalizedCurrentUsername &&
    normalizedEmployeeUsername === normalizedCurrentUsername,
  );
};
