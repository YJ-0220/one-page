import express from "express";
import Visitor from "../models/Visitor";
import Contact from "../models/Contact";
import { isAdmin } from "../middleware/authMiddleware";

const router = express.Router();

//방문자 통계 조회 API
router.get("/visitors", async (req, res) => {
  try {
    // 관리자 권한 확인
    if (!(await isAdmin(req))) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    //오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    //오늘 방문자 수 조회
    const todayStats = await Visitor.findOne({ date: today });

    // 총 방문자 수 계산 (모든 날짜의 방문자 수 합)
    const totalStats = await Visitor.aggregate([
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    res.json({
      today: todayStats ? todayStats.count : 0,
      total: totalStats.length > 0 ? totalStats[0].total : 0,
    });
  } catch (error) {
    console.error("방문자 통계 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 대시보드 요약 정보 API
router.get("/dashboard/summary", async (req, res) => {
  try {
    // 관리자 권한 확인
    if (!(await isAdmin(req))) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    // 병렬로 데이터 요청
    const [todayVisitors, unreadContacts, usersList] = await Promise.all([
      Visitor.findOne({ date: today }),
      Contact.countDocuments({ isRead: false }),
      // User 모델 접근이 가능한 경우 사용
      req.app.locals.User ? req.app.locals.User.find() : []
    ]);

    res.json({
      todayVisitors: todayVisitors ? todayVisitors.count : 0,
      totalUsers: Array.isArray(usersList) ? usersList.length : 0,
      unreadContacts: unreadContacts,
    });
  } catch (error) {
    console.error("대시보드 요약 정보 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
