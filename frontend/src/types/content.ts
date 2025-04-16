// 팝업 관련 타입
export interface EventPopup {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface PopupFormData {
  title: string;
  description: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  imageFile?: File;
}

// 슬라이드 관련 타입
export interface SlideFormData {
  title: string;
  description: string;
  link: string;
  order: number;
  image: File | null;
}

// 인물 소개 관련 타입
export interface TestimonialFormData {
  name: string;
  position: string;
  description: string;
  career: string;
  order: number;
  image: File | null;
} 