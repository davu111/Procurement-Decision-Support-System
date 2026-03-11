import Keycloak from 'keycloak-js';

// Cấu hình Keycloak instance
const keycloakConfig = {
  url: 'http://localhost:8181',
  realm: 'supermarket-management-system',
  clientId: 'react-client',
};

// Tạo instance với cấu hình  
const keycloak = new Keycloak(keycloakConfig);

// Thêm flag để kiểm tra trạng thái
keycloak._isInitialized = false;

// Override hàm init để tránh khởi tạo nhiều lần
const originalInit = keycloak.init;
keycloak.init = function(initOptions) {
  if (this._isInitialized) {
    console.warn('Keycloak already initialized, skipping...');
    return Promise.resolve(this.authenticated);
  }
  
  this._isInitialized = true;
  return originalInit.call(this, initOptions);
};

export default keycloak;