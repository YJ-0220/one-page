import express from 'express';
import { upload } from '../config/multer';
import EventPopup from '../models/EventPopup';
import { Request, Response } from 'express';

const router = express.Router();

// 이벤트 팝업 생성
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('이벤트 팝업 생성 요청:', req.body);
    console.log('업로드된 파일:', req.file);

    const { title, description, link, startDate, endDate } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ message: '이미지는 필수입니다.' });
    }

    const eventPopup = new EventPopup({
      title,
      description,
      link,
      imageUrl,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    await eventPopup.save();
    console.log('생성된 이벤트 팝업:', eventPopup);
    res.status(201).json(eventPopup);
  } catch (error: any) {
    console.error('이벤트 팝업 생성 에러:', error);
    res.status(500).json({ message: '이벤트 팝업 생성에 실패했습니다.', error: error.message });
  }
});

// 이벤트 팝업 목록 조회
router.get('/', async (req, res) => {
  try {
    console.log('이벤트 팝업 목록 조회 요청');
    const eventPopups = await EventPopup.find().sort({ createdAt: -1 });
    console.log('조회된 이벤트 팝업 수:', eventPopups.length);
    res.json(eventPopups);
  } catch (error: any) {
    console.error('이벤트 팝업 조회 에러:', error);
    res.status(500).json({ message: '이벤트 팝업 조회에 실패했습니다.', error: error.message });
  }
});

// 활성화된 이벤트 팝업 조회
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const eventPopups = await EventPopup.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });
    res.json(eventPopups);
  } catch (error: any) {
    console.error('활성 이벤트 팝업 조회 에러:', error);
    res.status(500).json({ message: '활성 이벤트 팝업 조회에 실패했습니다.', error: error.message });
  }
});

// 이벤트 팝업 수정
router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, link, startDate, endDate, isActive } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const eventPopup = await EventPopup.findById(id);
    if (!eventPopup) {
      return res.status(404).json({ message: '이벤트 팝업을 찾을 수 없습니다.' });
    }

    const updateData: any = {
      title,
      description,
      link,
      startDate: startDate ? new Date(startDate) : eventPopup.startDate,
      endDate: endDate ? new Date(endDate) : eventPopup.endDate,
      isActive,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const updatedEventPopup = await EventPopup.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(updatedEventPopup);
  } catch (error: any) {
    console.error('이벤트 팝업 수정 에러:', error);
    res.status(500).json({ message: '이벤트 팝업 수정에 실패했습니다.', error: error.message });
  }
});

// 이벤트 팝업 삭제
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventPopup = await EventPopup.findById(id);

    if (!eventPopup) {
      return res.status(404).json({ message: '이벤트 팝업을 찾을 수 없습니다.' });
    }

    await EventPopup.findByIdAndDelete(id);
    res.json({ message: '이벤트 팝업이 삭제되었습니다.' });
  } catch (error: any) {
    console.error('이벤트 팝업 삭제 에러:', error);
    res.status(500).json({ message: '이벤트 팝업 삭제에 실패했습니다.', error: error.message });
  }
});

export default router; 