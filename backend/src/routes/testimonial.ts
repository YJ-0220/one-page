import express from 'express';
import { upload } from '../config/multer';
import { isAuthenticated } from '../middleware/auth';
import Testimonial from '../models/Testimonial';

const router = express.Router();

// 인물 소개 생성
router.post('/', isAuthenticated, upload.single('image'), async (req: any, res) => {
  try {
    const { name, position, company, description, career, order } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ message: '이미지는 필수입니다.' });
    }

    const testimonial = new Testimonial({
      name,
      position,
      company,
      imageUrl,
      description,
      career: career ? JSON.parse(career) : [],
      order: order ? parseInt(order) : 0,
    });

    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error: any) {
    console.error('인물 소개 생성 에러:', error);
    res.status(500).json({ message: '인물 소개 생성에 실패했습니다.', error: error.message });
  }
});

// 인물 소개 목록 조회
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (error: any) {
    console.error('인물 소개 조회 에러:', error);
    res.status(500).json({ message: '인물 소개 조회에 실패했습니다.', error: error.message });
  }
});

// 활성화된 인물 소개 조회
router.get('/active', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (error: any) {
    console.error('활성 인물 소개 조회 에러:', error);
    res.status(500).json({ message: '활성 인물 소개 조회에 실패했습니다.', error: error.message });
  }
});

// 인물 소개 수정
router.put('/:id', isAuthenticated, upload.single('image'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, position, company, description, career, order, isActive } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: '인물 소개를 찾을 수 없습니다.' });
    }

    const updateData: any = {
      name,
      position,
      company,
      description,
      career: career ? JSON.parse(career) : testimonial.career,
      order: order ? parseInt(order) : testimonial.order,
      isActive,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(updatedTestimonial);
  } catch (error: any) {
    console.error('인물 소개 수정 에러:', error);
    res.status(500).json({ message: '인물 소개 수정에 실패했습니다.', error: error.message });
  }
});

// 인물 소개 삭제
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: '인물 소개를 찾을 수 없습니다.' });
    }

    await Testimonial.findByIdAndDelete(id);
    res.json({ message: '인물 소개가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('인물 소개 삭제 에러:', error);
    res.status(500).json({ message: '인물 소개 삭제에 실패했습니다.', error: error.message });
  }
});

export default router; 