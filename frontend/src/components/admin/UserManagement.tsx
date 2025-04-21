import { useState, useEffect } from 'react';
import { getUsersList, toggleUserAdminRole, deleteUserById, User } from '../../api';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const usersData = await getUsersList();
      setUsers(usersData);
    } catch (err: any) {
      console.error('사용자 데이터 로드 오류:', err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('사용자 데이터를 불러오는 중 오류가 발생했습니다. 권한을 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      const response = await toggleUserAdminRole(userId);
      setUsers(users.map(user => 
        user._id === userId ? {...user, isAdmin: !user.isAdmin} : user
      ));
      
      let successMessage = '관리자 권한이 변경되었습니다.';
      if (response.message) {
        successMessage = response.message;
      }
      
      alert(successMessage);
    } catch (err: any) {
      console.error('관리자 권한 변경 오류:', err);
      
      let errorMessage = '관리자 권한을 변경하는 중 오류가 발생했습니다.';
      if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
    
    try {
      await deleteUserById(userId);
      setUsers(users.filter(user => user._id !== userId));
      alert('사용자가 삭제되었습니다.');
    } catch (err: any) {
      console.error('사용자 삭제 오류:', err);
      
      let errorMessage = '사용자를 삭제하는 중 오류가 발생했습니다.';
      if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
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
        <span className="ml-3 text-gray-600">사용자 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
        <div className="text-red-500 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
        <button 
          onClick={fetchUsers} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">사용자 관리</h3>
        <button 
          onClick={fetchUsers}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>
      
      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            등록된 사용자가 없습니다.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">이름</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">이메일</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">가입일</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">최근 로그인</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">상태</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate">{user.displayName}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 truncate">{user.email}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          관리자
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          일반
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleAdmin(user._id)}
                        className="mr-1 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {user.isAdmin ? '관리자 해제' : '관리자 지정'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
            총 {users.length}명의 사용자가 있습니다
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 