import { useState, useEffect } from "react";
import {
  getContactsList,
  markContactAsRead,
  deleteContact,
  Contact,
} from "../../api";

const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);

    try {
      const contactsData = await getContactsList();
      setContacts(contactsData);
    } catch (err: any) {
      console.error("문의 데이터 로드 오류:", err);
      if (err.message) {
        setError(err.message);
      } else {
        setError(
          "문의 데이터를 불러오는 중 오류가 발생했습니다. 권한을 확인해주세요."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (contactId: string) => {
    try {
      await markContactAsRead(contactId);
      // 문의 목록 업데이트
      setContacts(
        contacts.map((contact) =>
          contact._id === contactId ? { ...contact, isRead: true } : contact
        )
      );

      // 선택된 문의 정보도 업데이트
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({ ...selectedContact, isRead: true });
      }
    } catch (err: any) {
      console.error("읽음 표시 오류:", err);
      let errorMessage = "문의를 읽음으로 표시하는 중 오류가 발생했습니다.";
      if (err.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("정말 이 문의를 삭제하시겠습니까?")) return;

    setIsDeleting(true);

    try {
      await deleteContact(contactId);

      // 문의 목록에서 삭제
      setContacts(contacts.filter((contact) => contact._id !== contactId));

      // 선택된 문의가 삭제된 경우 선택 해제
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(null);
        setShowModal(false);
      }

      alert("문의가 삭제되었습니다.");
    } catch (err: any) {
      console.error("문의 삭제 오류:", err);
      let errorMessage = "문의를 삭제하는 중 오류가 발생했습니다.";
      if (err.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openMessageModal = (contact: Contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
        </div>
        <span className="ml-3 text-gray-600">문의 데이터를 불러오는 중...</span>
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
          onClick={fetchContacts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const unreadCount = contacts.filter((contact) => !contact.isRead).length;

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h3 className="text-xl font-semibold text-gray-800">문의 관리</h3>
          {unreadCount > 0 && (
            <span className="ml-3 px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              새 문의 {unreadCount}개
            </span>
          )}
        </div>
        <button
          onClick={fetchContacts}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          새로고침
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500 flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            문의가 없습니다.
          </div>
              </div>
            ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    이름
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    이메일
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    메시지
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    상태
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !contact.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate">
                      {contact.name}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 truncate">
                      {contact.email}
                    </td>
                    <td
                      className="px-3 py-3 text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                      onClick={() => openMessageModal(contact)}
                    >
                      <div className="line-clamp-2 group">
                        <span className="group-hover:underline">
                          {contact.message}
                        </span>
                        <span className="text-blue-500 ml-1 group-hover:underline text-xs font-medium">
                          (자세히 보기)
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      {contact.isRead ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          읽음
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          새 문의
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleMarkAsRead(contact._id)}
                        className={`mr-1 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md ${
                          contact.isRead
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {contact.isRead ? "읽음 상태" : "읽음 표시"}
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
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
            총 {contacts.length}건의 문의가 있습니다
          </div>
        </div>
      )}

      {/* 메시지 내용 모달 */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  {selectedContact.name}님의 문의
                  {!selectedContact.isRead && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">{selectedContact.email}</p>
                </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
                </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    작성일:{" "}
                    {new Date(selectedContact.createdAt).toLocaleString()}
                </div>
                  <div>
                    {selectedContact.isRead ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        읽음
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        새 문의
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-gray-700">문의 내용</h4>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-gray-800">
                  {selectedContact.message}
                </div>
              </div>
              </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2 bg-gray-50">
              {!selectedContact.isRead && (
                <button
                  onClick={() => handleMarkAsRead(selectedContact._id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  읽음으로 표시
                </button>
              )}
              <button
                onClick={() => handleDeleteContact(selectedContact._id)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                삭제
              </button>
              <button
                onClick={closeModal}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement; 
