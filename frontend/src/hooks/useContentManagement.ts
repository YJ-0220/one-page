import { useState, useEffect } from "react";
import {
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
  getEventPopups,
} from "../api/content";
import {
  EventPopup,
  PopupFormData,
  SlideFormData,
  TestimonialFormData,
} from "../types/content";

export const useContentManagement = () => {
  const [activeTab, setActiveTab] = useState("popup");
  const [slideImages, setSlideImages] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 팝업 관련 상태
  const [popups, setPopups] = useState<EventPopup[]>([]);
  const [currentPopup, setCurrentPopup] = useState<EventPopup | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [popupFormData, setPopupFormData] = useState<PopupFormData>({
    title: "",
    description: "",
    link: "",
    startDate: "",
    endDate: "",
    imageFile: undefined,
  });

  const [slideFormData, setSlideFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    link: "",
    order: 0,
    image: null,
  });

  const [testimonialFormData, setTestimonialFormData] =
    useState<TestimonialFormData>({
      name: "",
      position: "",
      description: "",
      career: "",
      order: 0,
      image: null,
    });

  // 팝업 데이터 가져오기
  const fetchPopups = async (showAll: boolean = false) => {
    try {
      const dontShowUntil = localStorage.getItem("popupDontShowUntil");
      if (!showAll && dontShowUntil) {
        const dontShowDate = new Date(dontShowUntil);
        const now = new Date();
        if (now < dontShowDate) {
          return;
        }
      }

      const data = await getEventPopups();

      if (showAll) {
        setPopups(data);
        return;
      }

      const now = new Date();
      const activePopups = data.filter((popup: EventPopup) => {
        if (!popup.isActive) return false;

        const startDate = popup.startDate ? new Date(popup.startDate) : null;
        const endDate = popup.endDate ? new Date(popup.endDate) : null;

        const isAfterStart = !startDate || now >= startDate;
        const isBeforeEnd = !endDate || now <= endDate;

        return isAfterStart && isBeforeEnd;
      });

      if (activePopups.length > 0) {
        setPopups(activePopups);
        setCurrentPopup(activePopups[0]);
        setIsPopupOpen(true);
      }
    } catch (error) {
      alert("팝업 데이터 로딩에 실패했습니다.");
    }
  };

  // 팝업 닫기
  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  // 오늘 다시 보지 않기
  const handleDontShowToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    localStorage.setItem("popupDontShowUntil", today.toISOString());
    setIsPopupOpen(false);
  };

  // 다음 팝업으로 이동
  const handleNextPopup = () => {
    if (currentPopup && popups.length > 1) {
      const currentIndex = popups.findIndex(
        (popup) => popup._id === currentPopup._id
      );
      const nextIndex = (currentIndex + 1) % popups.length;
      setCurrentPopup(popups[nextIndex]);
    }
  };

  const fetchImages = async () => {
    try {
      const [slides, testimonialData] = await Promise.all([
        getImageSlides(),
        getTestimonials(),
      ]);
      setSlideImages(slides);
      setTestimonials(testimonialData);
      await fetchPopups(true);
    } catch (error) {
      console.error("이미지 데이터 로드 실패:", error);
    }
  };

  const handlePopupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPopupFormData({ ...popupFormData, imageFile: e.target.files[0] });
    }
  };

  const handleSlideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSlideFormData({ ...slideFormData, image: e.target.files[0] });
    }
  };

  const handleTestimonialFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setTestimonialFormData({
        ...testimonialFormData,
        image: e.target.files[0],
      });
    }
  };

  const handlePopupImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupFormData.imageFile) {
      alert("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", popupFormData.imageFile);
      formData.append("title", popupFormData.title);
      formData.append("description", popupFormData.description);
      formData.append("link", popupFormData.link || "");
      if (popupFormData.startDate) {
        formData.append("startDate", popupFormData.startDate);
      }
      if (popupFormData.endDate) {
        formData.append("endDate", popupFormData.endDate);
      }

      await createEventPopup(formData);
      setPopupFormData({
        title: "",
        description: "",
        link: "",
        startDate: "",
        endDate: "",
        imageFile: undefined,
      });
      fetchImages();
    } catch (error) {
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
        alert("인물 소개 삭제에 실패했습니다.");
      }
    }
  };

  const handleToggleActive = async (
    id: string,
    isPopup: boolean,
    currentStatus: boolean
  ) => {
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
      alert("상태 변경에 실패했습니다.");
    }
  };

  // 컴포넌트 마운트 시 팝업 데이터 가져오기
  useEffect(() => {
    fetchPopups();
  }, []);

  return {
    activeTab,
    setActiveTab,
    popups,
    currentPopup,
    isPopupOpen,
    handleClosePopup,
    handleDontShowToday,
    handleNextPopup,
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
    fetchPopups,
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
