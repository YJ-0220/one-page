import { useState, useEffect } from 'react';
import { getContactsList, markContactAsRead, deleteContact, Contact } from '../api';

const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const contactsData = await getContactsList();
      setContacts(contactsData);
    } catch (err) {
      console.error('문의 데이터 로드 오류:', err);
      setError('문의 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (contactId: string) => {
    try {
      await markContactAsRead(contactId);
      // 문의 목록 업데이트
      setContacts(contacts.map(contact => 
        contact._id === contactId ? {...contact, isRead: true} : contact
      ));
      
      // 선택된 문의 정보도 업데이트
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({...selectedContact, isRead: true});
      }
    } catch (err) {
      console.error('문의 상태 업데이트 오류:', err);
      alert('문의 상태를 업데이트하는 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('정말 이 문의를 삭제하시겠습니까?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await deleteContact(contactId);
      
      // 문의 목록에서 삭제
      setContacts(contacts.filter(contact => contact._id !== contactId));
      
      // 선택된 문의가 삭제된 경우 선택 해제
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(null);
      }
      
      alert('문의가 삭제되었습니다.');
    } catch (err) {
      console.error('문의 삭제 오류:', err);
      alert('문의를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const showContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    // 자동 읽음 처리 제거
  };

  if (loading) {
    return <div className="p-6 text-center">문의 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchContacts} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const unreadCount = contacts.filter(contact => !contact.isRead).length;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        문의 관리 
        {unreadCount > 0 && (
          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
            새 문의 {unreadCount}개
          </span>
        )}
      </h3>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* 문의 목록 */}
        <div className="md:w-1/2 lg:w-2/5">
          {contacts.length === 0 ? (
            <p className="text-gray-500">접수된 문의가 없습니다.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              <ul className="divide-y">
                {contacts.map(contact => (
                  <li 
                    key={contact._id} 
                    className={`${!contact.isRead ? 'bg-blue-50' : ''} 
                               ${selectedContact?._id === contact._id ? 'bg-gray-100' : ''}
                               hover:bg-gray-50 cursor-pointer group`}
                    onClick={() => showContactDetail(contact)}
                  >
                    <div className="p-4 relative">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium flex items-center">
                          {contact.name}
                          {!contact.isRead && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!contact.isRead && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지
                                handleMarkAsRead(contact._id);
                              }}
                              className="px-2 py-0.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="읽음으로 표시"
                            >
                              읽음
                            </button>
                          )}
                          <div className="text-sm text-gray-500">
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{contact.email}</div>
                      <div className="text-sm text-gray-500 truncate mt-1">{contact.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* 문의 상세 내용 */}
        <div className="md:w-1/2 lg:w-3/5">
          {selectedContact ? (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">{selectedContact.name}님의 문의</h4>
                <div className="flex items-center">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    selectedContact.isRead 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedContact.isRead ? '읽음' : '새 문의'}
                  </span>
                  
                  {!selectedContact.isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(selectedContact._id)}
                      className="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      읽음 표시
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteContact(selectedContact._id)}
                    disabled={isDeleting}
                    className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:bg-red-300"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">보낸 날짜: {new Date(selectedContact.createdAt).toLocaleString()}</p>
                <p className="text-sm text-gray-500">이메일: {selectedContact.email}</p>
              </div>
              
              <div className="border-t pt-4">
                <h5 className="font-medium mb-2">문의 내용</h5>
                <p className="whitespace-pre-wrap">{selectedContact.message}</p>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-center h-64 text-gray-500">
              좌측 목록에서 문의를 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactManagement; 