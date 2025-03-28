import { useState, useEffect } from 'react';
import axios from 'axios';

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // 문의 목록 가져오기
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/contacts', {
        withCredentials: true
      });
      setContacts(response.data);
      setError('');
    } catch (err) {
      setError('문의 목록을 불러오는데 실패했습니다.');
      console.error('문의 목록 불러오기 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 문의 목록 로드
  useEffect(() => {
    fetchContacts();
  }, []);

  // 문의 읽음 표시
  const markAsRead = async (contactId: string) => {
    try {
      await axios.patch(`/api/admin/contacts/${contactId}`, {
        isRead: true
      }, {
        withCredentials: true
      });
      
      // 로컬 상태 업데이트
      setContacts(contacts.map(contact => 
        contact.id === contactId ? { ...contact, isRead: true } : contact
      ));
      
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact({ ...selectedContact, isRead: true });
      }
    } catch (err) {
      console.error('문의 상태 업데이트 오류:', err);
    }
  };

  // 날짜 형식화
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) return <div className="flex justify-center p-4">로딩 중...</div>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">문의 관리</h3>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row">
          {/* 문의 목록 */}
          <div className="w-full md:w-1/3 md:border-r md:pr-4">
            {contacts.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                아직 문의가 없습니다.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-96">
                {contacts.map((contact, index) => (
                  <div 
                    key={`${contact.id}-${index}`}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                    } ${!contact.isRead ? 'font-semibold' : ''}`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{contact.name}</span>
                      {!contact.isRead && (
                        <span className="bg-blue-500 rounded-full w-2 h-2"></span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {contact.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(contact.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 문의 내용 상세 */}
          <div className="w-full md:w-2/3 md:pl-4 mt-4 md:mt-0">
            {selectedContact ? (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">{selectedContact.name}님의 문의</h4>
                  {!selectedContact.isRead && (
                    <button
                      onClick={() => markAsRead(selectedContact.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      읽음 표시
                    </button>
                  )}
                </div>
                
                <div className="mb-2">
                  <span className="text-gray-500 text-sm">이메일:</span>
                  <a 
                    href={`mailto:${selectedContact.email}`}
                    className="ml-2 text-blue-500 text-sm"
                  >
                    {selectedContact.email}
                  </a>
                </div>
                
                <div className="mb-2">
                  <span className="text-gray-500 text-sm">접수일시:</span>
                  <span className="ml-2 text-sm">{formatDate(selectedContact.createdAt)}</span>
                </div>
                
                <div className="mt-4">
                  <span className="text-gray-500 text-sm block mb-1">문의 내용:</span>
                  <div className="border rounded p-3 bg-gray-50 whitespace-pre-wrap">
                    {selectedContact.message}
                  </div>
                </div>
                
                <div className="mt-4">
                  <a 
                    href={`mailto:${selectedContact.email}`}
                    className="inline-block bg-blue-500 text-white px-3 py-2 rounded text-sm"
                  >
                    이메일로 답변하기
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 p-8">
                좌측 목록에서 문의를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactManagement; 