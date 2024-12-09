
import axios from 'axios';
import { config } from 'process';

// const apiURL = 'http://localhost:3001';
const apiURL =  'http://3.129.240.110'

const api = axios.create({
  baseURL: apiURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("authToken");

    if (token) {
      config.headers["X-Authorization"] = token;
    } else {
      console.log("No token found in localStorage.");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const fetchQueryResults = async (inputs: { name: string; version: string }[]) => {
  try {
    const response = await api.post(`/api/packages`, inputs, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching query results:", error);
    throw error;
  }
};

export const fetchRegexResults = async (regexPattern: string) => {
  try {
    const response = await api.post(`/api/package/byRegEx`, { RegEx: regexPattern }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  
  }
};

export const resetPackage = async () => {
    try {
        const response = await api.delete(`/api/reset`);
        return response.data;
    } catch (error) {
        console.error("Error deleting package:", error);
        throw error;
    }
};

export const getPackageByID = async (id: string) => {
    try {
        const response = await api.get(`$/api/package/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching package by ID:", error);
        throw error;
    }
};

export const updatePackageByID = async (id: string, requestPayload: any) => {
  try {
    const response = await api.post(`/api/package/${id}`, requestPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating package by ID:", error);
    throw error; 
  }
};

export const getCostByID = async (id: string, dependency: boolean) => {
    try{
        const response = await api.get(`${apiURL}/api/package/${id}/cost?dependency=${dependency}`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching cost by ID:", error);
    }
}
export const deletePackageByID = async (id: string) => {
    try {
      console.log("Request URL:", `${apiURL}/api/package/${id}`);
      const response = await api.delete(`${apiURL}/api/package/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting package:", error);
    }
};

export const uploadPackage = async (data: { 
  Name: string; 
  Version: string; 
  JSProgram?: string; 
  URL?: string; 
  Content?: string; 
  debloat: boolean; }) => {
    const payload = {
      Name: data.Name,
      Version: data.Version,
      debloat: data.debloat, // Include debloat as a boolean
      ...(data.JSProgram ? { JSProgram: data.JSProgram } : {}),
      ...(data.URL ? { URL: data.URL } : {}),
      ...(data.Content ? { Content: data.Content } : {}),
    };
  try {
    const response = await api.post(`${apiURL}/api/package`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error uploading package:", error);
    throw new Error(error.response.data.description);
  }
};

  
export const getRatingByID = async (id: string) => {
    try{
        const response = await api.get(`/api/package/${id}/rate`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching rating by ID:", error);
    }
};

export const createToken = async (name : string, password: string, isAdmin : boolean) => {
    try{
      const sanitizedPassword = password.replace(/\\/g, "");
        const payload = {
            User: {
                name,
                isAdmin
            },
            Secret:{
                password: sanitizedPassword,
            },
        };
        
        const response = await axios.put(`${apiURL}/api/authenticate`, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if(response.status === 200){
        return response.data;
        }
    }
    catch(error:any){
      if (error.response) {
        console.error("Error response:", error.response);
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        throw new Error(error.response.data.description);
      }
    }
};

export const getPackageHistoryByName = async (name: string) => {
    try{
        const response = await api.get(`${apiURL}/api/package/byName/${name}`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching package history by name:", error);
    }
};

export const deletePackageById = async (name: string) => {
    try{
        const response = await api.delete(`${apiURL}/api/package/${name}`);
        return response.data;
    }
    catch(error){
        console.error("Error deleting package by name:", error);
    }
}

export const registerUser = async (userData: { name: string; isAdmin: boolean; password: string }) => {
  try {
    const requestBody = {
      User: {
        name: userData.name,
        isAdmin: userData.isAdmin,
      },
      Secret: {
        password: userData.password,
      },
    };
    const response = await api.post(`/api/register`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error registering user:", error);
    throw error.response?.data || error.message;
  }
};