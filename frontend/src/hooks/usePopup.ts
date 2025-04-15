import { useState, useEffect } from 'react';
import { getEventPopups } from '../api/content';

interface EventPopup {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export const usePopup = () => {
  const [popups, setPopups] = useState<EventPopup[]>([]);
  const [currentPopup, setCurrentPopup] = useState<EventPopup | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchPopups = async (showAll: boolean = false) => {
    try {
      const dontShowUntil = localStorage.getItem('popupDontShowUntil');
      if (!showAll && dontShowUntil) {
        const dontShowDate = new Date(dontShowUntil);
        const now = new Date();
        if (now < dontShowDate) {
          return;
        }
      }

      const data = await getEventPopups();
      
      if (showAll) {
        setPopups(data);
        return;
      }

      const now = new Date();
      const activePopups = data.filter((popup: EventPopup) => {
        if (!popup.isActive) return false;
        
        const startDate = popup.startDate ? new Date(popup.startDate) : null;
        const endDate = popup.endDate ? new Date(popup.endDate) : null;
        
        const isAfterStart = !startDate || now >= startDate;
        const isBeforeEnd = !endDate || now <= endDate;
        
        return isAfterStart && isBeforeEnd;
      });
      
      if (activePopups.length > 0) {
        setPopups(activePopups);
        setCurrentPopup(activePopups[0]);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('팝업 데이터 로딩 실패:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    localStorage.setItem('popupDontShowUntil', today.toISOString());
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentPopup && popups.length > 1) {
      const currentIndex = popups.findIndex(popup => popup._id === currentPopup._id);
      const nextIndex = (currentIndex + 1) % popups.length;
      setCurrentPopup(popups[nextIndex]);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  return {
    popups,
    currentPopup,
    isOpen,
    handleClose,
    handleDontShowToday,
    handleNext,
    fetchPopups
  };
}; 