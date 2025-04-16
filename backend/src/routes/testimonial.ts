import express from 'express';
import { upload } from '../config/multer';
import Testimonial from '../models/Testimonial';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 인물 소개 생성
router.post('/', upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const testimonial = new Testimonial({
      name: req.body.name,
      position: req.body.position,
      description: req.body.description,
      career: req.body.career,
      imageUrl: `/uploads/${req.file.filename}`,
      isActive: true,
    });

    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ error: '인물 소개 생성 중 오류가 발생했습니다.' });
  }
});

// 인물 소개 목록 조회
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (error: any) {
    res.status(500).json({ message: '인물 소개 조회에 실패했습니다.', error: error.message });
  }
});

// 활성화된 인물 소개 조회
router.get('/active', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (error: any) {
    res.status(500).json({ message: '활성 인물 소개 조회에 실패했습니다.', error: error.message });
  }
});

// 인물 소개 수정
router.put('/:id', upload.single('image'), async (req: any, res) => {
  try {
    const updateData: any = {
      name: req.body.name,
      position: req.body.position,
      description: req.body.description,
      career: req.body.career,
      isActive: req.body.isActive === 'true'
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedTestimonial) {
      return res.status(404).json({ error: '인물 소개를 찾을 수 없습니다.' });
    }

    res.json(updatedTestimonial);
  } catch (error) {
    res.status(500).json({ error: '인물 소개 수정 중 오류가 발생했습니다.' });
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

    // 이미지 파일 경로 가져오기
    const imagePath = testimonial.imageUrl;
    if (imagePath) {
      // 파일 시스템에서 이미지 파일 삭제
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      
      // 파일이 존재하는지 확인
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) {
            // 에러 발생 시 무시
          }
        });
      }
    }

    await Testimonial.findByIdAndDelete(id);
    res.json({ message: '인물 소개가 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ message: '인물 소개 삭제에 실패했습니다.', error: error.message });
  }
});

export default router; 