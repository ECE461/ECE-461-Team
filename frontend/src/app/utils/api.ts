
import axios from 'axios';

const apiURL = 'http://localhost:3000';
// const apiURL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchQueryResults = async (inputs: { name: string; version: string }[]) => {
  try {
    const response = await axios.post(`${apiURL}/api/v1/packages`, inputs, {
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
    const response = await axios.post(`${apiURL}/api/v1/package/byRegex`, { RegEx: regexPattern }, {
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
        const response = await axios.delete(`${apiURL}/api/v1/reset`);
        return response.data;
    } catch (error) {
        console.error("Error deleting package:", error);
    }
};

export const getPackageByID = async (id: string) => {
    try {
        const response = await axios.get(`${apiURL}/api/v1/package/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching package by ID:", error);
    }
};

export const updatePackageByID = async (id: string, requestPayload: any) => {
  try {
    const response = await axios.post(`/package/${id}`, requestPayload, {
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

export const deletePackageByID = async (id: string) => {
    try {
      const response = await axios.delete(`${apiURL}/package/${id}`);
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
    const response = await axios.post(`${apiURL}/api/v1/package`, payload, {
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
        const response = await axios.get(`${apiURL}/api/v1/package/${id}/rate`);
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
        const response = await axios.put(`${apiURL}/api/v1/authenticate`, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
    catch(error){
        console.error("Error creating token:", error);
    }
};

export const getPackageHistoryByName = async (name: string) => {
    try{
        const response = await axios.get(`${apiURL}/api/v1/package/byName/${name}`);
        return response.data;
    }
    catch(error){
        console.error("Error fetching package history by name:", error);
    }
};

export const deletePackageByName = async (name: string) => {
    try{
        const response = await axios.delete(`${apiURL}/api/v1/package/byName/${name}`);
        return response.data;
    }
    catch(error){
        console.error("Error deleting package by name:", error);
    }
}