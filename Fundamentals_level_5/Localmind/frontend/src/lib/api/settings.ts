/**
 * Settings API Service
 * Educational Note: Handles all API key management operations with the backend.
 * This service provides methods for CRUD operations on API keys stored in .env.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface ApiKey {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'storage' | 'utility';
  required?: boolean;
  value: string;
  is_set: boolean;
}

export interface ApiKeyUpdate {
  id: string;
  value: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
}

class SettingsAPI {
  /**
   * Get all API keys from the backend
   * Educational Note: Returns masked values for security
   */
  async getApiKeys(): Promise<ApiKey[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/api-keys`);
      return response.data.api_keys;
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  }

  /**
   * Update multiple API keys
   * Educational Note: This triggers a backend .env update and potential Flask reload
   */
  async updateApiKeys(apiKeys: ApiKeyUpdate[]): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/settings/api-keys`, {
        api_keys: apiKeys
      });
    } catch (error) {
      console.error('Error updating API keys:', error);
      throw error;
    }
  }

  /**
   * Delete a specific API key
   * Educational Note: Removes the key from .env file
   */
  async deleteApiKey(keyId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/settings/api-keys/${keyId}`);
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  /**
   * Validate an API key
   * Educational Note: Tests if an API key works by making a test request
   */
  async validateApiKey(keyId: string, value: string): Promise<ValidationResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/api-keys/validate`, {
        key_id: keyId,
        value: value
      });
      return {
        valid: response.data.valid,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return {
        valid: false,
        message: 'Validation failed'
      };
    }
  }
}

export const settingsAPI = new SettingsAPI();