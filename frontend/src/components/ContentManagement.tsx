import { useState, useEffect } from "react";
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
} from "@/api/content";

// 콘텐츠 관리를 위한 타입 정의
interface ImageItem {
  id: number;
  imageUrl: string;
  title: string;
  description?: string;
  isActive: boolean;
  link?: string;
  order?: number;
  startDate?: Date;
  endDate?: Date;
}

interface TestimonialItem {
  id: number;
  name: string;
  position: string;
  company: string;
  imageUrl: string;
  description: string;
  career: string[];
  isActive: boolean;
  order: number;
}

const ContentManagement = () => {
  const [popupImages, setPopupImages] = useState<ImageItem[]>([]);
  const [slideImages, setSlideImages] = useState<ImageItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"popup" | "slide" | "testimonial">(
    "popup"
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [popupFormData, setPopupFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
    startDate: "",
    endDate: "",
    link: "",
  });
  const [slideFormData, setSlideFormData] = useState({
    title: "",
    file: null as File | null,
    link: "",
    order: 0,
  });
  const [testimonialFormData, setTestimonialFormData] = useState({
    name: "",
    position: "",
    company: "",
    description: "",
    career: "",
    file: null as File | null,
    order: 0,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);

    try {
      const [popupData, slideData, testimonialData] = await Promise.all([
        getEventPopups(),
        getImageSlides(),
        getTestimonials(),
      ]);

      setPopupImages(popupData);
      setSlideImages(slideData);
      setTestimonials(testimonialData);
    } catch (err: any) {
      console.error("이미지 데이터 로딩 오류:", err);
      setError("이미지 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePopupImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupFormData.file || !popupFormData.title) {
      alert("이미지와 제목을 입력해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", popupFormData.file);
      formData.append("title", popupFormData.title);
      if (popupFormData.description) {
        formData.append("description", popupFormData.description);
      }
      if (popupFormData.startDate) {
        formData.append("startDate", popupFormData.startDate);
      }
      if (popupFormData.endDate) {
        formData.append("endDate", popupFormData.endDate);
      }
      if (popupFormData.link) {
        formData.append("link", popupFormData.link);
      }

      await createEventPopup(formData);
      alert("팝업 이미지가 추가되었습니다.");
      setPopupFormData({
        title: "",
        description: "",
        file: null,
        startDate: "",
        endDate: "",
        link: "",
      });
      fetchImages();
    } catch (err) {
      console.error("팝업 이미지 업로드 오류:", err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSlideImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFormData.file || !slideFormData.title) {
      alert("이미지와 제목을 입력해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", slideFormData.file);
      formData.append("title", slideFormData.title);
      if (slideFormData.link) {
        formData.append("link", slideFormData.link);
      }
      formData.append("order", slideFormData.order.toString());

      await createImageSlide(formData);
      alert("슬라이드 이미지가 추가되었습니다.");
      setSlideFormData({
        title: "",
        file: null,
        link: "",
        order: 0,
      });
      fetchImages();
    } catch (err) {
      console.error("슬라이드 이미지 업로드 오류:", err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !testimonialFormData.file ||
      !testimonialFormData.name ||
      !testimonialFormData.position ||
      !testimonialFormData.company ||
      !testimonialFormData.description
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", testimonialFormData.file);
      formData.append("name", testimonialFormData.name);
      formData.append("position", testimonialFormData.position);
      formData.append("company", testimonialFormData.company);
      formData.append("description", testimonialFormData.description);
      formData.append("career", testimonialFormData.career);
      formData.append("order", testimonialFormData.order.toString());

      await createTestimonial(formData);
      alert("인물 소개가 추가되었습니다.");
      setTestimonialFormData({
        name: "",
        position: "",
        company: "",
        description: "",
        career: "",
        file: null,
        order: 0,
      });
      fetchImages();
    } catch (err) {
      console.error("인물 소개 업로드 오류:", err);
      alert("인물 소개 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePopupImage = async (id: number) => {
    if (!window.confirm("정말 이 팝업 이미지를 삭제하시겠습니까?")) return;

    try {
      await deleteEventPopup(id);
      setPopupImages(popupImages.filter((img) => img.id !== id));
      alert("팝업 이미지가 삭제되었습니다.");
    } catch (err) {
      console.error("팝업 이미지 삭제 오류:", err);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSlideImage = async (id: number) => {
    if (!window.confirm("정말 이 슬라이드 이미지를 삭제하시겠습니까?")) return;

    try {
      await deleteImageSlide(id);
      setSlideImages(slideImages.filter((img) => img.id !== id));
      alert("슬라이드 이미지가 삭제되었습니다.");
    } catch (err) {
      console.error("슬라이드 이미지 삭제 오류:", err);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!window.confirm("정말 이 인물 소개를 삭제하시겠습니까?")) return;

    try {
      await deleteTestimonial(id);
      setTestimonials(testimonials.filter((item) => item.id !== id));
      alert("인물 소개가 삭제되었습니다.");
    } catch (err) {
      console.error("인물 소개 삭제 오류:", err);
      alert("인물 소개 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async (
    id: number,
    isPopup: boolean,
    currentActive: boolean
  ) => {
    try {
      const newActive = !currentActive;
      const formData = new FormData();
      formData.append("isActive", newActive.toString());

      if (isPopup) {
        await updateEventPopup(id, formData);
        setPopupImages(
          popupImages.map((img) =>
            img.id === id ? { ...img, isActive: newActive } : img
          )
        );
      } else {
        await updateImageSlide(id, formData);
        setSlideImages(
          slideImages.map((img) =>
            img.id === id ? { ...img, isActive: newActive } : img
          )
        );
      }
    } catch (err) {
      console.error("이미지 상태 변경 오류:", err);
      alert("이미지 상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handlePopupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPopupFormData({
        ...popupFormData,
        file: e.target.files[0],
      });
    }
  };

  const handleSlideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSlideFormData({
        ...slideFormData,
        file: e.target.files[0],
      });
    }
  };

  const handleTestimonialFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setTestimonialFormData({
        ...testimonialFormData,
        file: e.target.files[0],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
        </div>
        <span className="ml-3 text-gray-600">
          콘텐츠 데이터를 불러오는 중...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
        <div className="text-red-500 mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
        <button
          onClick={fetchImages}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">콘텐츠 관리</h1>

      {/* 탭 메뉴 */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("popup")}
              className={`${
                activeTab === "popup"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              팝업 이미지
            </button>
            <button
              onClick={() => setActiveTab("slide")}
              className={`${
                activeTab === "slide"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              슬라이드 이미지
            </button>
            <button
              onClick={() => setActiveTab("testimonial")}
              className={`${
                activeTab === "testimonial"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              인물 소개
            </button>
          </nav>
        </div>
      </div>

      {/* 팝업 이미지 관리 */}
      {activeTab === "popup" && (
        <div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-800">
                이벤트 팝업 이미지 추가
              </h4>
            </div>
            <div className="p-6">
              <form onSubmit={handlePopupImageSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 파일
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePopupFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      팝업 제목
                    </label>
                    <input
                      type="text"
                      value={popupFormData.title}
                      onChange={(e) =>
                        setPopupFormData({
                          ...popupFormData,
                          title: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="팝업 제목을 입력하세요"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팝업 설명 (선택사항)
                  </label>
                  <textarea
                    value={popupFormData.description}
                    onChange={(e) =>
                      setPopupFormData({
                        ...popupFormData,
                        description: e.target.value,
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="팝업에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isUploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploading ? "업로드 중..." : "이미지 추가"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-800">
                이벤트 팝업 이미지 목록
              </h4>
            </div>
            {popupImages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                등록된 팝업 이미지가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이미지
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        설명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {popupImages.map((image) => (
                      <tr
                        key={image.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-20 w-32 overflow-hidden rounded-md">
                            <img
                              src={image.imageUrl}
                              alt={image.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {image.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {image.description || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleToggleActive(image.id, true, image.isActive)
                            }
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              image.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {image.isActive ? "활성화됨" : "비활성화"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeletePopupImage(image.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 슬라이드 이미지 관리 */}
      {activeTab === "slide" && (
        <div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-800">
                이미지 슬라이드 추가
              </h4>
            </div>
            <div className="p-6">
              <form onSubmit={handleSlideImageSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 파일
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlideFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      슬라이드 제목
                    </label>
                    <input
                      type="text"
                      value={slideFormData.title}
                      onChange={(e) =>
                        setSlideFormData({
                          ...slideFormData,
                          title: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="슬라이드 제목을 입력하세요"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isUploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploading ? "업로드 중..." : "이미지 추가"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-800">
                이미지 슬라이드 목록
              </h4>
            </div>
            {slideImages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                등록된 슬라이드 이미지가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이미지
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {slideImages.map((image) => (
                      <tr
                        key={image.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-20 w-36 overflow-hidden rounded-md">
                            <img
                              src={image.imageUrl}
                              alt={image.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {image.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleToggleActive(
                                image.id,
                                false,
                                image.isActive
                              )
                            }
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              image.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {image.isActive ? "활성화됨" : "비활성화"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteSlideImage(image.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 인물 소개 관리 */}
      {activeTab === "testimonial" && (
        <div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-800">
                인물 소개 추가
              </h4>
            </div>
            <div className="p-6">
              <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 파일
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTestimonialFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      value={testimonialFormData.name}
                      onChange={(e) =>
                        setTestimonialFormData({
                          ...testimonialFormData,
                          name: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="이름을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      직책
                    </label>
                    <input
                      type="text"
                      value={testimonialFormData.position}
                      onChange={(e) =>
                        setTestimonialFormData({
                          ...testimonialFormData,
                          position: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="직책을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사
                    </label>
                    <input
                      type="text"
                      value={testimonialFormData.company}
                      onChange={(e) =>
                        setTestimonialFormData({
                          ...testimonialFormData,
                          company: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="회사명을 입력하세요"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      소개
                    </label>
                    <textarea
                      value={testimonialFormData.description}
                      onChange={(e) =>
                        setTestimonialFormData({
                          ...testimonialFormData,
                          description: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="소개를 입력하세요"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      경력 (줄바꿈으로 구분)
                    </label>
                    <textarea
                      value={testimonialFormData.career}
                      onChange={(e) =>
                        setTestimonialFormData({
                          ...testimonialFormData,
                          career: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="경력을 입력하세요 (줄바꿈으로 구분)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      순서
                    </label>
                    <input
                      type="number"
                      value={testimonialFormData.order}
                      onChange={(e) =>
                        setTestimonialFormData({
                          ...testimonialFormData,
                          order: parseInt(e.target.value),
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="표시 순서"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isUploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploading ? "업로드 중..." : "인물 소개 추가"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-800">
                인물 소개 목록
              </h4>
            </div>
            <div className="p-6">
              {testimonials.length === 0 ? (
                <div className="text-center text-gray-500">
                  등록된 인물 소개가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이미지
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          직책/회사
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          경력
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {testimonials.map((testimonial) => (
                        <tr
                          key={testimonial.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-20 w-36 overflow-hidden rounded-md">
                              <img
                                src={testimonial.imageUrl}
                                alt={testimonial.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {testimonial.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {testimonial.position}, {testimonial.company}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="max-w-xs">
                              <ul className="list-disc list-inside">
                                {testimonial.career.map((item, index) => (
                                  <li
                                    key={`${testimonial.id}-career-${index}`}
                                    className="truncate"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleToggleActive(
                                  testimonial.id,
                                  false,
                                  testimonial.isActive
                                )
                              }
                              className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                                testimonial.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {testimonial.isActive ? "활성화됨" : "비활성화"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() =>
                                handleDeleteTestimonial(testimonial.id)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
