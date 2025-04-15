import axios from 'axios';

const API_URL = 'http://localhost:3000';

// 인증 헤더 가져오기
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  };
};

// 이미지 URL을 백엔드 서버 URL로 변환하는 함수
export const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_URL}${url}`;
  return `${API_URL}/uploads/${url}`;
};

// 이벤트 팝업 API
export const getEventPopups = async () => {
  const response = await axios.get(`${API_URL}/event-popup`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl)
  }));
};

export const getActiveEventPopups = async () => {
  const response = await axios.get(`${API_URL}/event-popup/active`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl)
  }));
};

export const createEventPopup = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/event-popup`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl)
  };
};

export const updateEventPopup = async (id: string, formData: FormData) => {
  const response = await axios.put(`${API_URL}/event-popup/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl)
  };
};

export const deleteEventPopup = async (id: string) => {
  const response = await axios.delete(`${API_URL}/event-popup/${id}`);
  return response.data;
};

// 이미지 슬라이드 API
export const getImageSlides = async () => {
  const response = await axios.get(`${API_URL}/image-slide`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl)
  }));
};

export const getActiveImageSlides = async () => {
  const response = await axios.get(`${API_URL}/image-slide/active`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl)
  }));
};

export const createImageSlide = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/image-slide`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl)
  };
};

export const updateImageSlide = async (id: string, formData: FormData) => {
  const response = await axios.put(`${API_URL}/image-slide/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl)
  };
};

export const deleteImageSlide = async (id: string) => {
  const response = await axios.delete(`${API_URL}/image-slide/${id}`);
  return response.data;
};

// 인물 소개 API
export const getTestimonials = async () => {
  const response = await axios.get(`${API_URL}/testimonial`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl)
  }));
};

export const getActiveTestimonials = async () => {
  const response = await axios.get(`${API_URL}/testimonial/active`);
  return response.data.map((item: any) => ({
    ...item,
    imageUrl: getImageUrl(item.imageUrl)
  }));
};

export const createTestimonial = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/testimonial`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl)
  };
};

export const updateTestimonial = async (id: string, formData: FormData) => {
  const response = await axios.put(`${API_URL}/testimonial/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return {
    ...response.data,
    imageUrl: getImageUrl(response.data.imageUrl)
  };
};

export const deleteTestimonial = async (id: string) => {
  const response = await axios.delete(`${API_URL}/testimonial/${id}`);
  return response.data;
}; 