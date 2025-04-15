import express from 'express';
import { upload } from '../config/multer';
import ImageSlide from '../models/ImageSlide';
import { Request, Response } from 'express';

const router = express.Router();

// 이미지 슬라이드 생성
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('이미지 슬라이드 생성 요청:', req.body);
    console.log('업로드된 파일:', req.file);

    const { title, description, link, order } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ message: '이미지는 필수입니다.' });
    }

    const imageSlide = new ImageSlide({
      title,
      description,
      link,
      imageUrl,
      order: order ? parseInt(order) : 0,
    });

    await imageSlide.save();
    console.log('생성된 이미지 슬라이드:', imageSlide);
    res.status(201).json(imageSlide);
  } catch (error: any) {
    console.error('이미지 슬라이드 생성 에러:', error);
    res.status(500).json({ message: '이미지 슬라이드 생성에 실패했습니다.', error: error.message });
  }
});

// 이미지 슬라이드 목록 조회
router.get('/', async (req, res) => {
  try {
    console.log('이미지 슬라이드 목록 조회 요청');
    const imageSlides = await ImageSlide.find().sort({ order: 1, createdAt: -1 });
    console.log('조회된 이미지 슬라이드 수:', imageSlides.length);
    res.json(imageSlides);
  } catch (error: any) {
    console.error('이미지 슬라이드 조회 에러:', error);
    res.status(500).json({ message: '이미지 슬라이드 조회에 실패했습니다.', error: error.message });
  }
});

// 활성화된 이미지 슬라이드 조회
router.get('/active', async (req, res) => {
  try {
    const imageSlides = await ImageSlide.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(imageSlides);
  } catch (error: any) {
    console.error('활성 이미지 슬라이드 조회 에러:', error);
    res.status(500).json({ message: '활성 이미지 슬라이드 조회에 실패했습니다.', error: error.message });
  }
});

// 이미지 슬라이드 수정
router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, link, order, isActive } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const imageSlide = await ImageSlide.findById(id);
    if (!imageSlide) {
      return res.status(404).json({ message: '이미지 슬라이드를 찾을 수 없습니다.' });
    }

    const updateData: any = {
      title,
      description,
      link,
      order: order ? parseInt(order) : imageSlide.order,
      isActive,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const updatedImageSlide = await ImageSlide.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(updatedImageSlide);
  } catch (error: any) {
    console.error('이미지 슬라이드 수정 에러:', error);
    res.status(500).json({ message: '이미지 슬라이드 수정에 실패했습니다.', error: error.message });
  }
});

// 이미지 슬라이드 삭제
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imageSlide = await ImageSlide.findById(id);

    if (!imageSlide) {
      return res.status(404).json({ message: '이미지 슬라이드를 찾을 수 없습니다.' });
    }

    await ImageSlide.findByIdAndDelete(id);
    res.json({ message: '이미지 슬라이드가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('이미지 슬라이드 삭제 에러:', error);
    res.status(500).json({ message: '이미지 슬라이드 삭제에 실패했습니다.', error: error.message });
  }
});

export default router; 