import { useState } from 'react';
import axios from 'axios';

interface EditProfileFormProps {
  onClose: () => void;
  userId: string | null;
  username: string | null;
}

const EditProfileForm = ({ onClose, userId }: EditProfileFormProps) => {
  const [newUserId, setNewUserId] = useState(userId || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ID 변경이 요청된 경우 검증
    if (newUserId !== userId) {
      if (newUserId.length < 4) {
        setError('ID는 최소 4자 이상이어야 합니다.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(newUserId)) {
        setError('ID는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.');
        return;
      }
    }

    // 비밀번호 변경이 요청된 경우에만 비밀번호 검증
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      if (!currentPassword) {
        setError('비밀번호 변경을 위해서는 현재 비밀번호를 입력해주세요.');
        return;
      }
    }

    try {
      setLoading(true);
      await axios.put(
        `/api/user/${userId}`,
        {
          newUserId: newUserId !== userId ? newUserId : undefined,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        },
        {
          withCredentials: true,
        }
      );

      setSuccess('회원정보가 성공적으로 수정되었습니다.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('회원정보 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          ID
        </label>
        <input
          type="text"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="새로운 ID 입력"
        />
        <p className="mt-1 text-sm text-gray-500">
          영문, 숫자, 언더스코어(_)만 사용 가능합니다.
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">비밀번호 변경 (선택사항)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="비밀번호 변경 시에만 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="비밀번호 변경 시에만 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="비밀번호 변경 시에만 입력"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? '수정 중...' : '수정하기'}
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm; 