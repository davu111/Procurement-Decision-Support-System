import inventoryApi from "./axiosConfig";

export interface RoleResponse {
  id: string;
  roleName: string;
  description?: string;
}

export const roleApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: RoleResponse[] }>("/roles")
      .then((r) => r.data),

  getById: (id: string) =>
    inventoryApi
      .get<never, { data: RoleResponse }>(`/roles/${id}`)
      .then((r) => r.data),
};

export default roleApi;
