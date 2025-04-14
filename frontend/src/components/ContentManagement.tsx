import { useState, useEffect } from "react";

// 콘텐츠 관리를 위한 타입 정의
interface ImageItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  active: boolean;
}

// API 호출을 위한 임시 함수들 (실제 API와 연결 필요)
const fetchPopupImages = async (): Promise<ImageItem[]> => {
  // 여기에 실제 API 호출 코드 구현
  // 임시 데이터 반환
  return [
    {
      id: "1",
      url: "https://via.placeholder.com/800x400",
      title: "여름 이벤트",
      description: "여름 맞이 특별 할인 이벤트 진행 중!",
      active: true,
    },
    {
      id: "2",
      url: "https://via.placeholder.com/800x400",
      title: "신규 회원 혜택",
      description: "신규 가입 시 10% 할인 쿠폰 지급",
      active: false,
    },
  ];
};

const fetchSlideImages = async (): Promise<ImageItem[]> => {
  // 여기에 실제 API 호출 코드 구현
  // 임시 데이터 반환
  return [
    {
      id: "1",
      url: "https://via.placeholder.com/1200x600",
      title: "메인 슬라이드 1",
      active: true,
    },
    {
      id: "2",
      url: "https://via.placeholder.com/1200x600",
      title: "메인 슬라이드 2",
      active: true,
    },
    {
      id: "3",
      url: "https://via.placeholder.com/1200x600",
      title: "메인 슬라이드 3",
      active: true,
    },
  ];
};

const savePopupImage = async (image: FormData): Promise<boolean> => {
  // 실제 API 호출 구현
  console.log("팝업 이미지 저장:", image);
  return true;
};

const saveSlideImage = async (image: FormData): Promise<boolean> => {
  // 실제 API 호출 구현
  console.log("슬라이드 이미지 저장:", image);
  return true;
};

const deletePopupImage = async (id: string): Promise<boolean> => {
  // 실제 API 호출 구현
  console.log("팝업 이미지 삭제:", id);
  return true;
};

const deleteSlideImage = async (id: string): Promise<boolean> => {
  // 실제 API 호출 구현
  console.log("슬라이드 이미지 삭제:", id);
  return true;
};

const toggleImageActive = async (
  id: string,
  isPopup: boolean,
  active: boolean
): Promise<boolean> => {
  // 실제 API 호출 구현
  console.log(`${isPopup ? "팝업" : "슬라이드"} 이미지 상태 변경:`, id, active);
  return true;
};

const ContentManagement = () => {
  const [popupImages, setPopupImages] = useState<ImageItem[]>([]);
  const [slideImages, setSlideImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"popup" | "slide">("popup");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [popupFormData, setPopupFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });
  const [slideFormData, setSlideFormData] = useState({
    title: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);

    try {
      const [popupData, slideData] = await Promise.all([
        fetchPopupImages(),
        fetchSlideImages(),
      ]);

      setPopupImages(popupData);
      setSlideImages(slideData);
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
      formData.append("file", popupFormData.file);
      formData.append("title", popupFormData.title);
      if (popupFormData.description) {
        formData.append("description", popupFormData.description);
      }

      const result = await savePopupImage(formData);

      if (result) {
        alert("팝업 이미지가 추가되었습니다.");
        setPopupFormData({
          title: "",
          description: "",
          file: null,
        });
        // 목록 새로고침
        fetchImages();
      }
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
      formData.append("file", slideFormData.file);
      formData.append("title", slideFormData.title);

      const result = await saveSlideImage(formData);

      if (result) {
        alert("슬라이드 이미지가 추가되었습니다.");
        setSlideFormData({
          title: "",
          file: null,
        });
        // 목록 새로고침
        fetchImages();
      }
    } catch (err) {
      console.error("슬라이드 이미지 업로드 오류:", err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePopupImage = async (id: string) => {
    if (!window.confirm("정말 이 팝업 이미지를 삭제하시겠습니까?")) return;

    try {
      const result = await deletePopupImage(id);

      if (result) {
        setPopupImages(popupImages.filter((img) => img.id !== id));
        alert("팝업 이미지가 삭제되었습니다.");
      }
    } catch (err) {
      console.error("팝업 이미지 삭제 오류:", err);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSlideImage = async (id: string) => {
    if (!window.confirm("정말 이 슬라이드 이미지를 삭제하시겠습니까?")) return;

    try {
      const result = await deleteSlideImage(id);

      if (result) {
        setSlideImages(slideImages.filter((img) => img.id !== id));
        alert("슬라이드 이미지가 삭제되었습니다.");
      }
    } catch (err) {
      console.error("슬라이드 이미지 삭제 오류:", err);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async (
    id: string,
    isPopup: boolean,
    currentActive: boolean
  ) => {
    try {
      const newActive = !currentActive;
      const result = await toggleImageActive(id, isPopup, newActive);

      if (result) {
        if (isPopup) {
          setPopupImages(
            popupImages.map((img) =>
              img.id === id ? { ...img, active: newActive } : img
            )
          );
        } else {
          setSlideImages(
            slideImages.map((img) =>
              img.id === id ? { ...img, active: newActive } : img
            )
          );
        }
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
    <div className="p-6 w-full">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          콘텐츠 관리
        </h3>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <div className="flex -mb-px">
            <button
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === "popup"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("popup")}
            >
              이벤트 팝업 관리
            </button>
            <button
              className={`ml-4 py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === "slide"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("slide")}
            >
              이미지 슬라이드 관리
            </button>
          </div>
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
                              src={image.url}
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
                              handleToggleActive(image.id, true, image.active)
                            }
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              image.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {image.active ? "활성화됨" : "비활성화"}
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
                              src={image.url}
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
                              handleToggleActive(image.id, false, image.active)
                            }
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              image.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {image.active ? "활성화됨" : "비활성화"}
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
    </div>
  );
};

export default ContentManagement;
