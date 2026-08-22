import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/parse`;

export async function analyzeEmail(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
      // Note: Don't set Content-Type header manually when using FormData,
      // the browser will automatically set it with the correct boundary
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Connection Error:", error);
    throw error;
  }
}
