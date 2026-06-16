export const setAuthData = (token: string, user: any) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
};

export const getAuthData = () => {
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("authUser");
  return { 
    token, 
    user: userStr ? JSON.parse(userStr) : null 
  };
};

export const clearAuthData = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
};

// Keeping this for the API client interceptor
export const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};