import inventoryApi from "./axiosConfig";

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | string;

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  username: string;
  roleName: string;
  status?: EmployeeStatus;
}

export interface EmployeeUpdateRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roleName?: string;
  status?: EmployeeStatus;
}

export interface EmployeeResponse {
  id: string;
  keycloakUserId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roleName?: string;
  initialPassword?: string;
  status?: EmployeeStatus;
}

export const employeeApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: EmployeeResponse[] }>("/employees")
      .then((r) => r.data),

  getById: (id: string) =>
    inventoryApi
      .get<never, { data: EmployeeResponse }>(`/employees/${id}`)
      .then((r) => r.data),

  create: (data: EmployeeRequest) =>
    inventoryApi
      .post<never, { data: EmployeeResponse }>("/employees/create", data)
      .then((r) => r.data),

  update: (id: string, data: EmployeeRequest) =>
    inventoryApi
      .put<never, { data: EmployeeResponse }>(`/employees/update/${id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    inventoryApi
      .patch<never, { data: boolean }>(`/employees/de-active/${id}`)
      .then((r) => r.data),

  activate: (id: string) =>
    inventoryApi
      .patch<never, { data: boolean }>(`/employees/active/${id}`)
      .then((r) => r.data),
};

export default employeeApi;
