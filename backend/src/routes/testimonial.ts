import express from 'express';
import { upload } from '../config/multer';
import Testimonial from '../models/Testimonial';

const router = express.Router();

// 인물 소개 생성
router.post('/', upload.single('image'), async (req: any, res) => {
  try {
    console.log('인물 소개 생성 요청:', req.body);
    console.log('업로드된 파일:', req.file);

    const { name, position, description, career, order } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ message: '이미지는 필수입니다.' });
    }

    const testimonial = new Testimonial({
      name,
      position,
      imageUrl,
      description,
      career: career || '',
      order: order ? parseInt(order) : 0,
      isActive: true
    });

    console.log('저장할 데이터:', testimonial);

    await testimonial.save();
    console.log('저장된 인물 소개:', testimonial);
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
router.put('/:id', upload.single('image'), async (req: any, res) => {
  try {
    console.log('인물 소개 수정 요청:', req.body);
    console.log('업로드된 파일:', req.file);

    const { id } = req.params;
    const { name, position, description, career, order, isActive } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: '인물 소개를 찾을 수 없습니다.' });
    }

    const updateData: any = {
      name,
      position,
      description,
      career: career || testimonial.career,
      order: order ? parseInt(order) : testimonial.order,
      isActive: isActive !== undefined ? isActive : testimonial.isActive
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    console.log('업데이트할 데이터:', updateData);

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    console.log('업데이트된 인물 소개:', updatedTestimonial);
    res.json(updatedTestimonial);
  } catch (error: any) {
    console.error('인물 소개 수정 에러:', error);
    res.status(500).json({ message: '인물 소개 수정에 실패했습니다.', error: error.message });
  }
});

// 인물 소개 삭제
router.delete('/:id', async (req, res) => {
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