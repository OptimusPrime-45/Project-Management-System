import api from "./axios.js";

export const getHealthcheck = async () => {
    const response = await api.get("/healthcheck");
    return response.data;
};
