import { useState } from "react";
import {
  getEventPopups,
  createEventPopup,
  updateEventPopup,
  deleteEventPopup,
  getImageSlides,
  createImageSlide,
  updateImageSlide,
  deleteImageSlide,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../api/content";

interface PopupFormData {
  title: string;
  description: string;
  link: string;
  startDate: Date | null;
  endDate: Date | null;
  image: File | null;
}

interface SlideFormData {
  title: string;
  description: string;
  link: string;
  order: number;
  image: File | null;
}

interface TestimonialFormData {
  name: string;
  position: string;
  description: string;
  career: string;
  order: number;
  image: File | null;
}

export const useContentManagement = () => {
  const [activeTab, setActiveTab] = useState("popup");
  const [popupImages, setPopupImages] = useState<any[]>([]);
  const [slideImages, setSlideImages] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [popupFormData, setPopupFormData] = useState<PopupFormData>({
    title: "",
    description: "",
    link: "",
    startDate: null,
    endDate: null,
    image: null,
  });
  const [slideFormData, setSlideFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    link: "",
    order: 0,
    image: null,
  });
  const [testimonialFormData, setTestimonialFormData] = useState<TestimonialFormData>({
    name: "",
    position: "",
    description: "",
    career: "",
    order: 0,
    image: null,
  });

  const fetchImages = async () => {
    try {
      const [popups, slides, testimonialData] = await Promise.all([
        getEventPopups(),
        getImageSlides(),
        getTestimonials(),
      ]);
      setPopupImages(popups);
      setSlideImages(slides);
      setTestimonials(testimonialData);
    } catch (error) {
      console.error("이미지 데이터 로드 실패:", error);
    }
  };

  const handlePopupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPopupFormData({ ...popupFormData, image: e.target.files[0] });
    }
  };

  const handleSlideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSlideFormData({ ...slideFormData, image: e.target.files[0] });
    }
  };

  const handleTestimonialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTestimonialFormData({ ...testimonialFormData, image: e.target.files[0] });
    }
  };

  const handlePopupImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupFormData.image) {
      alert("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", popupFormData.image);
      formData.append("title", popupFormData.title);
      formData.append("description", popupFormData.description);
      formData.append("link", popupFormData.link);
      if (popupFormData.startDate) {
        formData.append("startDate", popupFormData.startDate.toISOString());
      }
      if (popupFormData.endDate) {
        formData.append("endDate", popupFormData.endDate.toISOString());
      }

      await createEventPopup(formData);
      setPopupFormData({
        title: "",
        description: "",
        link: "",
        startDate: null,
        endDate: null,
        image: null,
      });
      fetchImages();
    } catch (error) {
      console.error("팝업 이미지 추가 실패:", error);
      alert("팝업 이미지 추가에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSlideImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFormData.image) {
      alert("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", slideFormData.image);
      formData.append("title", slideFormData.title);
      formData.append("description", slideFormData.description);
      formData.append("link", slideFormData.link);
      formData.append("order", slideFormData.order.toString());

      await createImageSlide(formData);
      setSlideFormData({
        title: "",
        description: "",
        link: "",
        order: 0,
        image: null,
      });
      fetchImages();
    } catch (error) {
      console.error("슬라이드 이미지 추가 실패:", error);
      alert("슬라이드 이미지 추가에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialFormData.image) {
      alert("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", testimonialFormData.image);
      formData.append("name", testimonialFormData.name);
      formData.append("position", testimonialFormData.position);
      formData.append("description", testimonialFormData.description);
      formData.append("career", testimonialFormData.career);
      formData.append("order", testimonialFormData.order.toString());

      await createTestimonial(formData);
      setTestimonialFormData({
        name: "",
        position: "",
        description: "",
        career: "",
        order: 0,
        image: null,
      });
      fetchImages();
    } catch (error) {
      console.error("인물 소개 추가 실패:", error);
      alert("인물 소개 추가에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePopupImage = async (id: string) => {
    if (window.confirm("이 팝업을 삭제하시겠습니까?")) {
      try {
        await deleteEventPopup(id);
        fetchImages();
      } catch (error) {
        console.error("팝업 삭제 실패:", error);
        alert("팝업 삭제에 실패했습니다.");
      }
    }
  };

  const handleDeleteSlideImage = async (id: string) => {
    if (window.confirm("이 슬라이드를 삭제하시겠습니까?")) {
      try {
        await deleteImageSlide(id);
        fetchImages();
      } catch (error) {
        console.error("슬라이드 삭제 실패:", error);
        alert("슬라이드 삭제에 실패했습니다.");
      }
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (window.confirm("이 인물 소개를 삭제하시겠습니까?")) {
      try {
        await deleteTestimonial(id);
        fetchImages();
      } catch (error) {
        console.error("인물 소개 삭제 실패:", error);
        alert("인물 소개 삭제에 실패했습니다.");
      }
    }
  };

  const handleToggleActive = async (id: string, isPopup: boolean, currentStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append("isActive", (!currentStatus).toString());
      
      if (isPopup) {
        await updateEventPopup(id, formData);
      } else if (activeTab === "slide") {
        await updateImageSlide(id, formData);
      } else {
        await updateTestimonial(id, formData);
      }
      fetchImages();
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  return {
    activeTab,
    setActiveTab,
    popupImages,
    slideImages,
    testimonials,
    isUploading,
    popupFormData,
    setPopupFormData,
    slideFormData,
    setSlideFormData,
    testimonialFormData,
    setTestimonialFormData,
    fetchImages,
    handlePopupFileChange,
    handleSlideFileChange,
    handleTestimonialFileChange,
    handlePopupImageSubmit,
    handleSlideImageSubmit,
    handleTestimonialSubmit,
    handleDeletePopupImage,
    handleDeleteSlideImage,
    handleDeleteTestimonial,
    handleToggleActive,
  };
}; 