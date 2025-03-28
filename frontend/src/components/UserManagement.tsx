import { useState, useEffect } from 'react';
import axios from 'axios';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true
});

interface User {
  _id: string;
  userId: string;  // 랜덤 생성된 사용자 ID
  displayName: string;
  email: string;
  photo: string;
  isAdmin: boolean;
  createdAt?: string;
  lastLogin?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('사용자 목록을 불러오는데 실패했습니다.');
      console.error('사용자 목록 불러오기 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 목록 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 사용자 관리자 권한 토글
  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!userId) {
      setError('유효하지 않은 사용자입니다.');
      return;
    }

    try {
      await api.patch(`/api/admin/users/${userId}`, {
        isAdmin: !currentStatus
      });
      
      // 로컬 상태 업데이트
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isAdmin: !currentStatus } : user
      ));
    } catch (err) {
      setError('권한 변경에 실패했습니다.');
      console.error('권한 변경 오류:', err);
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId: string) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        await api.delete(`/api/admin/users/${userId}`);
        // 로컬 상태 업데이트
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        setError('사용자 삭제에 실패했습니다.');
        console.error('사용자 삭제 오류:', err);
      }
    }
  };

  // 사용자 정보 편집
  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await api.put(`/api/admin/users/${editingUser._id}`, editingUser);
      
      // 로컬 상태 업데이트
      setUsers(users.map(user => 
        user._id === editingUser._id ? editingUser : user
      ));
      
      // 편집 모드 종료
      setEditingUser(null);
    } catch (err) {
      setError('사용자 정보 업데이트에 실패했습니다.');
      console.error('사용자 업데이트 오류:', err);
    }
  };

  // 검색 필터링된 사용자 목록
  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-4">로딩 중...</div>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">사용자 관리</h3>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* 검색 필드 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색"
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* 사용자 편집 폼 */}
        {editingUser && (
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <h4 className="font-medium mb-2">사용자 정보 편집</h4>
            <form onSubmit={updateUser}>
              <div className="mb-2">
                <label className="block text-sm font-medium">이름</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">이메일</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  className="mr-2"
                  checked={editingUser.isAdmin}
                  onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
                />
                <label htmlFor="isAdmin" className="text-sm">관리자 권한</label>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  저장
                </button>
                <button
                  type="button"
                  className="bg-gray-300 px-3 py-1 rounded"
                  onClick={() => setEditingUser(null)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 사용자 목록 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={`${user._id}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photo && (
                          <img 
                            src={user.photo} 
                            alt={user.displayName} 
                            className="h-8 w-8 rounded-full mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isAdmin 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.isAdmin ? '관리자' : '일반 사용자'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        onClick={() => setEditingUser(user)}
                      >
                        편집
                      </button>
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        onClick={() => toggleAdmin(user._id, user.isAdmin)}
                      >
                        {user.isAdmin ? '권한 해제' : '권한 부여'}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => deleteUser(user._id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 