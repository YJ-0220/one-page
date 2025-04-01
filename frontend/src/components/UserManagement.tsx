import { useState, useEffect } from 'react';
import { getUsersList, toggleUserAdminRole, deleteUserById, User } from '../api';

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
    } catch (err) {
      console.error('사용자 데이터 로드 오류:', err);
      setError('사용자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      const response = await toggleUserAdminRole(userId);
      // 사용자 목록 업데이트
      setUsers(users.map(user => 
        user._id === userId ? {...user, isAdmin: !user.isAdmin} : user
      ));
      
      let errorMessage = '관리자 권한이 변경되었습니다.';
      if (response.message) {
        errorMessage = response.message;
      }
      
      alert(errorMessage);
    } catch (err) {
      console.error('관리자 권한 변경 오류:', err);
      
      let errorMessage = '관리자 권한을 변경하는 중 오류가 발생했습니다.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
    
    try {
      await deleteUserById(userId);
      // 사용자 목록에서 삭제된 유저 제거
      setUsers(users.filter(user => user._id !== userId));
      alert('사용자가 삭제되었습니다.');
    } catch (err) {
      console.error('사용자 삭제 오류:', err);
      alert('사용자를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">사용자 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchUsers} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">사용자 관리</h3>
      
      {users.length === 0 ? (
        <p className="text-gray-500">등록된 사용자가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">이름</th>
                <th className="py-2 px-4 border">이메일</th>
                <th className="py-2 px-4 border">가입일</th>
                <th className="py-2 px-4 border">최근 로그인</th>
                <th className="py-2 px-4 border">상태</th>
                <th className="py-2 px-4 border">액션</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b">
                  <td className="py-2 px-4 border">{user.displayName}</td>
                  <td className="py-2 px-4 border">{user.email}</td>
                  <td className="py-2 px-4 border">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-2 px-4 border">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {user.isAdmin ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">관리자</span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded">일반</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    <button
                      onClick={() => handleToggleAdmin(user._id)}
                      className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {user.isAdmin ? '관리자 해제' : '관리자 지정'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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
  );
};

export default UserManagement; 