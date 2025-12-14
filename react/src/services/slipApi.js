import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 5000,
});

const createSlip = async (payload) => {
  return api.post("/slips", payload);
};

const getSlips = async () => {
  return api.get("/slips");
};

export default { createSlip, getSlips };
