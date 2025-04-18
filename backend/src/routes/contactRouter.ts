import express from "express";
import Contact from "../models/Contact";
import {
  isAdmin,
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

const router = express.Router();

// 읽지 않은 문의 수 조회 API
router.get("/unread-count", async (req, res) => {
  try {
    // 관리자 권한 확인
    if (!(await isAdmin(req))) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }

    const count = await Contact.countDocuments({ isRead: false });
    res.json({ count });
  } catch (error: any) {
    console.error("읽지 않은 문의 수 조회 오류:", error);
    res.status(500).json({
      message: "읽지 않은 문의 수 조회 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 문의 제출 API
router.post("/submit", async (req, res) => {
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
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 문의 목록 조회 API
router.get("/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 문의 읽음 표시 API
router.patch("/mark-read/:id", requireAuth, requireAdmin, async (req, res) => {
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
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 문의 삭제 API
router.delete("/delete/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    }

    res.json({
      message: "문의가 성공적으로 삭제되었습니다.",
      deletedId: contact._id,
    });
  } catch (err) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

export default router;
