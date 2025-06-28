/**
 * Authentication API Module
 * 
 * Handles all authentication-related API operations including
 * login, logout, token refresh, password management, and user registration.
 */

import { apiClient } from '../api-client';
import { 
  ApiResponse, 
  AuthTokenResponse, 
  LoginRequest, 
  UserRegistrationRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  User 
} from '../../types/api';

export class AuthApi {
  /**
   * Login with username and password
   */
  static async login(credentials: LoginRequest): Promise<ApiResponse<AuthTokenResponse>> {
    return apiClient.login(credentials);
  }

  /**
   * Register a new user account
   */
  static async register(userData: UserRegistrationRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/connector/api/user-registration', userData);
  }

  /**
   * Logout and revoke tokens
   */
  static async logout(): Promise<void> {
    return apiClient.logout();
  }

  /**
   * Request password reset
   */
  static async forgotPassword(data: PasswordResetRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/connector/api/forget-password', data);
  }

  /**
   * Update user password
   */
  static async updatePassword(data: PasswordUpdateRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/connector/api/update-password', data);
  }

  /**
   * Get current logged-in user details
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.getCurrentUser();
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<void> {
    return apiClient.refreshAccessToken();
  }

  /**
   * Check if user is currently authenticated
   */
  static get isAuthenticated(): boolean {
    return apiClient.isAuthenticated;
  }
}

export default AuthApi;
