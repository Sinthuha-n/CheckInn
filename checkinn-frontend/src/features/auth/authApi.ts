import { apiRequest } from '../../services/apiClient'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../../types/api'

export const authApi = {
  login(request: LoginRequest) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: request,
    })
  },

  register(request: RegisterRequest) {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: request,
    })
  },
}
