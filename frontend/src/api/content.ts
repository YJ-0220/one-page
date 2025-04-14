import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// 이벤트 팝업 API
export const getEventPopups = async () => {
  const response = await axios.get(`${API_URL}/api/event-popup`);
  return response.data.map((popup: any) => ({
    ...popup,
    imageUrl: getImageUrl(popup.imageUrl)
  }));
};

export const createEventPopup = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/api/event-popup`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateEventPopup = async (id: number, formData: FormData) => {
  const response = await axios.put(`${API_URL}/api/event-popup/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteEventPopup = async (id: number) => {
  const response = await axios.delete(`${API_URL}/api/event-popup/${id}`);
  return response.data;
};

// 이미지 슬라이드 API
export const getImageSlides = async () => {
  const response = await axios.get(`${API_URL}/api/image-slide`);
  return response.data.map((slide: any) => ({
    ...slide,
    imageUrl: getImageUrl(slide.imageUrl)
  }));
};

export const createImageSlide = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/api/image-slide`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateImageSlide = async (id: number, formData: FormData) => {
  const response = await axios.put(`${API_URL}/api/image-slide/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteImageSlide = async (id: number) => {
  const response = await axios.delete(`${API_URL}/api/image-slide/${id}`);
  return response.data;
};

// 인물 소개 API
export const getTestimonials = async () => {
  const response = await axios.get(`${API_URL}/api/testimonial`);
  return response.data.map((testimonial: any) => ({
    ...testimonial,
    imageUrl: getImageUrl(testimonial.imageUrl)
  }));
};

export const createTestimonial = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/api/testimonial`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateTestimonial = async (id: number, formData: FormData) => {
  const response = await axios.put(`${API_URL}/api/testimonial/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteTestimonial = async (id: number) => {
  const response = await axios.delete(`${API_URL}/api/testimonial/${id}`);
  return response.data;
};

// 이미지 URL을 백엔드 서버 URL로 변환하는 함수
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // URL이 /uploads로 시작하면 그대로 사용
  if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_URL}${url}`;
  // 그 외의 경우 /uploads/를 추가
  return `${import.meta.env.VITE_API_URL}/uploads/${url}`;
}; 