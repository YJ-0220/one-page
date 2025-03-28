import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import UserManagement from '@/components/UserManagement';
import ContactManagement from '@/components/ContactManagement';

interface AdminPageProps {
  onLogin: (username: string) => void;
  isLoggedIn: boolean;
}

const AdminPage = ({ onLogin, isLoggedIn }: AdminPageProps) => {
  const [activeTab, setActiveTab] = useState('대시보드');

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">관리자 페이지</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-12">
            <LoginForm 
              onLogin={onLogin} 
              onClose={() => {}} 
            />
          </div>
        </div>
      </div>
    );
  }

  // 현재 활성화된 탭에 따라 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case '대시보드':
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-indigo-500 text-sm font-semibold">방문자</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-gray-500">오늘</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-500 text-sm font-semibold">페이지뷰</p>
                <p className="text-2xl font-bold">5,678</p>
                <p className="text-xs text-gray-500">오늘</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-500 text-sm font-semibold">문의</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-gray-500">새 문의</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-500 text-sm font-semibold">수익</p>
                <p className="text-2xl font-bold">890만원</p>
                <p className="text-xs text-gray-500">이번 달</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
            <div className="border rounded-lg overflow-hidden">
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
                    <tr key={item}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-06-{10 + item}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">새 게시물 작성</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          완료
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case '사용자 관리':
        return <UserManagement />;
      case '문의 관리':
        return <ContactManagement />;
      case '콘텐츠 관리':
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">콘텐츠 관리</h3>
            <p className="text-gray-500">콘텐츠 관리 기능은 아직 구현 중입니다.</p>
          </div>
        );
      case '통계':
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">통계</h3>
            <p className="text-gray-500">통계 기능은 아직 구현 중입니다.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">관리자 대시보드</h2>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* 탭 네비게이션 */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['대시보드', '사용자 관리', '문의 관리', '콘텐츠 관리', '통계'].map((tab) => (
              <button
                key={tab}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* 탭 컨텐츠 */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminPage; 