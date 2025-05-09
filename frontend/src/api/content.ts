import axios from "axios";
import { EventPopup } from "../types/content";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  };
};

const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) return `${API_URL}${path}`;
  return `${API_URL}/uploads/${path}`;
};

export const getEventPopups = async (): Promise<EventPopup[]> => {
  const response = await axios.get(`${API_URL}/event-popup`);
  return response.data.map((item: any) => {
    const imageUrl = getImageUrl(item.imageUrl);
    return {
      ...item,
      imageUrl,
    };
  });
};

export const getActiveEventPopups = async (): Promise<EventPopup[]> => {
  const response = await axios.get(`${API_URL}/event-popup/active`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl),
  }));
};

export const createEventPopup = async (
  formData: FormData
): Promise<EventPopup> => {
  const response = await axios.post(`${API_URL}/event-popup`, formData, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl),
  };
};

export const updateEventPopup = async (
  id: string,
  formData: FormData
): Promise<EventPopup> => {
  const response = await axios.put(`${API_URL}/event-popup/${id}`, formData, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl),
  };
};

export const deleteEventPopup = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/event-popup/${id}`);
};

export const getImageSlides = async () => {
  const response = await axios.get(`${API_URL}/image-slide`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl),
  }));
};

export const getActiveImageSlides = async () => {
  const response = await axios.get(`${API_URL}/image-slide/active`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl),
  }));
};

export const createImageSlide = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/image-slide`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl),
  };
};

export const updateImageSlide = async (id: string, formData: FormData) => {
  const response = await axios.put(`${API_URL}/image-slide/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl),
  };
};

export const deleteImageSlide = async (id: string) => {
  const response = await axios.delete(`${API_URL}/image-slide/${id}`);
  return response.data;
};

export const getTestimonials = async () => {
  const response = await axios.get(`${API_URL}/testimonial`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl),
  }));
};

export const getActiveTestimonials = async () => {
  const response = await axios.get(`${API_URL}/testimonial/active`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl),
  }));
};

export const createTestimonial = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/testimonial`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl),
  };
};

export const updateTestimonial = async (id: string, formData: FormData) => {
  const response = await axios.put(`${API_URL}/testimonial/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl),
  };
};

export const deleteTestimonial = async (id: string) => {
  const response = await axios.delete(`${API_URL}/testimonial/${id}`);
  return response.data;
};
