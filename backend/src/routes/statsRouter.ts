import express from "express";
import Visitor from "../models/Visitor";
import Contact from "../models/Contact";
import { isAdmin } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/visitors", async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }

    const today = new Date().toISOString().split("T")[0];

    const todayStats = await Visitor.findOne({ date: today });

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

router.get("/dashboard/summary", async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }

    const today = new Date().toISOString().split("T")[0];

    const [todayVisitors, unreadContacts, usersList] = await Promise.all([
      Visitor.findOne({ date: today }),
      Contact.countDocuments({ isRead: false }),
      req.app.locals.User ? req.app.locals.User.find() : [],
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
