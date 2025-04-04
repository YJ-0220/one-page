import { useState } from 'react';
import UserManagement from '../components/UserManagement';
import ContactManagement from '../components/ContactManagement';
import ContentManagement from '../components/ContentManagement';
import LoginForm from '../components/LoginForm';

interface AdminPageProps {
  onLogin: (username: string) => void;
  isLoggedIn: boolean;
}

const AdminPage = ({ onLogin, isLoggedIn }: AdminPageProps) => {
  const [activeTab, setActiveTab] = useState('대시보드');

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-24 mb-10">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">관리자 로그인</h2>
            <p className="text-blue-100 text-sm">계속하려면 로그인해주세요</p>
          </div>
          <div className="px-6 py-6">
            <LoginForm 
              onLogin={onLogin} 
              onClose={() => {}} 
            />
          </div>
        </div>
      </div>
    );
  }

  // 탭 목록
  const tabs = [
    { id: '대시보드', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: '사용자 관리', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: '문의 관리', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: '콘텐츠 관리', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: '통계', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  // 현재 활성화된 탭에 따라 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case '대시보드':
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">총 사용자</p>
                    <p className="text-xl font-semibold text-gray-700">327</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">오늘 방문자</p>
                    <p className="text-xl font-semibold text-gray-700">24</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">새 문의</p>
                    <p className="text-xl font-semibold text-gray-700">5</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">최근 활동</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <tr key={item} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-06-{10 + item}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">새 게시물 작성</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
                최근 5개의 활동이 표시됩니다
              </div>
            </div>
          </div>
        );
      case '사용자 관리':
        return <UserManagement />;
      case '문의 관리':
        return <ContactManagement />;
      case '콘텐츠 관리':
        return <ContentManagement />;
      case '통계':
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm m-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">통계</h3>
            <p className="text-gray-500 text-center">통계 기능은 현재 개발 중입니다.<br />곧 사용하실 수 있습니다.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-full pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pt-24 pb-12">
      <div className="flex flex-col lg:flex-row">
        {/* 사이드바 네비게이션 */}
        <div className="lg:w-56 w-full flex-shrink-0 mb-6 lg:mb-0">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden sticky top-24">
            <div className="px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">관리자 대시보드</h2>
            </div>
            <div className="py-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                  </svg>
                  {tab.id}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 메인 콘텐츠 */}
        <div className="lg:flex-1 w-full flex justify-center">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden w-full max-w-4xl">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 