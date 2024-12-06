
import axios from 'axios';

const apiURL = 'http://localhost:3000';
// const apiURL =  'http://3.129.240.110'

export const fetchQueryResults = async (inputs: { name: string; version: string }[]) => {
  try {
    const response = await axios.post(`${apiURL}/api/packages`, inputs, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching query results:", error);
  }
};

export const fetchRegexResults = async (regexPattern: string) => {
  try {
    const response = await axios.post(`${apiURL}/api/package/byRegex`, { RegEx: regexPattern }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching regex results:", error);
  
  }
};

export const resetPackage = async () => {
    try {
        const response = await axios.delete(`${apiURL}/api/reset`);
        return response.data;
    } catch (error) {
        console.error("Error deleting package:", error);
    }
};

export const getPackageByID = async (id: string) => {
    try {
        const response = await axios.get(`${apiURL}/api/package/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching package by ID:", error);
    }
};

export const updatePackageByID = async (id: string, requestPayload: any) => {
  try {
    const response = await axios.post(`${apiURL}/api/package/${id}`, requestPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating package by ID:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error; // Re-throw the error for higher-level handling
  }
};

export const getCostByID = async (id: string, dependency: boolean) => {
    try{
        const response = await axios.get(`${apiURL}/api/package/${id}/cost?dependency=${dependency}`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching cost by ID:", error);
    }
}
export const deletePackageByID = async (id: string) => {
    try {
      console.log("Request URL:", `${apiURL}/api/package/${id}`);
      const response = await axios.delete(`${apiURL}/api/package/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting package:", error);
    }
};

export const uploadPackage = async (data: { JSProgram: string; URL?: string; Content?: string }) => {
  const payload = {
    JSProgram: data.JSProgram,
    ...(data.URL ? { URL: data.URL } : { Content: data.Content }),
  };

  try {
    const response = await axios.post(`${apiURL}/api/package`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error uploading package:", error);
    throw error.response ? error.response.data : error;
  }
};

  
export const getRatingByID = async (id: string) => {
    try{
        const response = await axios.get(`${apiURL}/api/package/${id}/rate`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching rating by ID:", error);
    }
};

export const createToken = async (name : string, password: string, isAdmin : boolean) => {
    try{
        const payload = {
            User: {
                name,
                isAdmin
            },
            Secret:{
                password
            },
        };
        console.log("Payload being sent:", payload);
        const response = await axios.put(`${apiURL}/api/authenticate`, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log("API response:", response.data);
        return response.data;
    }
    catch(error){
        console.error("Error creating token:", error);
    }
};

export const getPackageHistoryByName = async (name: string) => {
    try{
        const response = await axios.get(`${apiURL}/api/package/byName/${name}`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching package history by name:", error);
    }
};

export const deletePackageById = async (name: string) => {
    try{
        const response = await axios.delete(`${apiURL}/api/package/${name}`);
        return response.data;
    }
    catch(error){
        console.error("Error deleting package by name:", error);
    }
}

export const registerUser = async (userData: { name: string; isadmin: boolean; password: string }) => {
  try {
    const requestBody = {
      User: {
        name: userData.name,
        isadmin: userData.isadmin,
      },
      Secret: {
        password: userData.password,
      },
    };
    const response = await axios.post(`${apiURL}/api/register`, requestBody, {
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