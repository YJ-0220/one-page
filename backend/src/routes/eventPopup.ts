import express from "express";
import { upload } from "../config/multer";
import EventPopup from "../models/EventPopup";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "이미지 파일이 필요합니다." });
      }

      const eventPopup = new EventPopup({
        title: req.body.title,
        description: req.body.description,
        imageUrl: `/uploads/${req.file.filename}`,
        link: req.body.link,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        isActive: true,
      });

      await eventPopup.save();
      res.status(201).json(eventPopup);
    } catch (error) {
      res
        .status(500)
        .json({ error: "이벤트 팝업 생성 중 오류가 발생했습니다." });
    }
  }
);

router.get("/", async (req: Request, res: Response) => {
  try {
    const eventPopups = await EventPopup.find().sort({ createdAt: -1 });
    res.json(eventPopups);
  } catch (error) {
    res
      .status(500)
      .json({ error: "이벤트 팝업 목록 조회 중 오류가 발생했습니다." });
  }
});

router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const eventPopups = await EventPopup.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });
    res.json(eventPopups);
  } catch (error: any) {
    res.status(500).json({
      message: "활성 이벤트 팝업 조회에 실패했습니다.",
      error: error.message,
    });
  }
});

router.put(
  "/:id",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, link, startDate, endDate, isActive } =
        req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const eventPopup = await EventPopup.findById(id);
      if (!eventPopup) {
        return res
          .status(404)
          .json({ message: "이벤트 팝업을 찾을 수 없습니다." });
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
      res.status(500).json({
        message: "이벤트 팝업 수정에 실패했습니다.",
        error: error.message,
      });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const popup = await EventPopup.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ error: "팝업을 찾을 수 없습니다." });
    }

    const imagePath = popup.imageUrl;
    if (imagePath) {
      const fullPath = path.join(__dirname, "..", "..", imagePath);

      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) {
          }
        });
      }
    }

    await EventPopup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "팝업이 삭제되었습니다." });
  } catch (error: any) {
    res.status(500).json({
      message: "팝업 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

export default router;
