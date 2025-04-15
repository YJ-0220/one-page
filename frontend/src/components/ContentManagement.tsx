import React, { useEffect } from "react";
import { useContentManagement } from "../hooks/useContentManagement";

const ContentManagement: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    popups,
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
  } = useContentManagement();

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">컨텐츠 관리</h1>

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
              <h4 className="text-lg font-medium text-gray-800">이벤트 팝업 이미지 추가</h4>
            </div>
            <div className="p-6">
              <form onSubmit={handlePopupImageSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이미지 파일</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">팝업 제목</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">팝업 설명 (선택사항)</label>
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
              <h4 className="text-lg font-medium text-gray-800">이벤트 팝업 이미지 목록</h4>
            </div>
            {!popups || popups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">등록된 팝업 이미지가 없습니다.</div>
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
                    {popups.map((image) => (
                      <tr key={image._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-20 w-32 overflow-hidden rounded-md">
                            <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{image.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">{image.description || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(image._id, true, image.isActive)}
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              image.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {image.isActive ? "활성화됨" : "비활성화"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeletePopupImage(image._id)}
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
              <h4 className="text-lg font-medium text-gray-800">이미지 슬라이드 추가</h4>
            </div>
            <div className="p-6">
              <form onSubmit={handleSlideImageSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이미지 파일</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">슬라이드 제목</label>
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
              <h4 className="text-lg font-medium text-gray-800">이미지 슬라이드 목록</h4>
            </div>
            {slideImages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">등록된 슬라이드 이미지가 없습니다.</div>
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
                      <tr key={image._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-20 w-36 overflow-hidden rounded-md">
                            <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{image.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(image._id, false, image.isActive)}
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              image.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {image.isActive ? "활성화됨" : "비활성화"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteSlideImage(image._id)}
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
          <h3 className="text-xl font-semibold mb-4">인물 소개 관리</h3>
          <form onSubmit={handleTestimonialSubmit} className="mb-8">
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">이미지</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  value={testimonialFormData.name}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">직책</label>
                <input
                  type="text"
                  value={testimonialFormData.position}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      position: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={testimonialFormData.description}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                  required
                />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">경력</label>
                <textarea
                  value={testimonialFormData.career}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      career: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              인물 추가
            </button>
          </form>

          {/* 인물 소개 상세 목록 */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">인물 소개 상세 목록</h3>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((testimonial) => (
                <div key={testimonial._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 h-48 md:h-auto">
                      <img
                        src={testimonial.imageUrl}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 md:w-3/4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold">{testimonial.name}</h4>
                          <p className="text-gray-600">{testimonial.position}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          testimonial.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {testimonial.isActive ? "활성" : "비활성"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-700"><span className="font-semibold">설명:</span> {testimonial.description}</p>
                        <p className="text-gray-700"><span className="font-semibold">경력:</span> {testimonial.career}</p>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(testimonial._id, false, testimonial.isActive)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {testimonial.isActive ? "비활성화" : "활성화"}
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
