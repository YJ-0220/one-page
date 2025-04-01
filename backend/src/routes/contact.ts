import express from 'express';
import Contact from '../models/Contact';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = express.Router();

// 문의 전송 API
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  // 필수 필드 검증
  if (!name || !email || !message) {
    return res.status(400).json({ error: "모든 필드를 입력해주세요." });
  }

  try {
    // MongoDB에 문의 저장
    const contact = await Contact.create({
      name,
      email,
      message,
    });

    res.status(201).json({
      message: "문의가 성공적으로 전송되었습니다.",
      contact,
    });
  } catch (err) {
    console.error("문의 저장 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 관리자용 문의 목록 조회 API
router.get('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error("문의 조회 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 관리자용 문의 읽음 표시 API
router.patch('/admin/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    }

    res.json(contact);
  } catch (err) {
    console.error("문의 업데이트 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

export default router; 