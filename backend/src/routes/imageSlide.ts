import express from "express";
import { upload } from "../config/multer";
import ImageSlide from "../models/ImageSlide";
import { Request, Response } from "express";
import { deleteFile } from "../utils/fileUtils";

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { title, description, link, order } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      if (!imageUrl) {
        return res.status(400).json({ message: "이미지는 필수입니다." });
      }

      const imageSlide = new ImageSlide({
        title,
        description,
        link,
        imageUrl,
        order: order ? parseInt(order) : 0,
      });

      await imageSlide.save();
      res.status(201).json(imageSlide);
    } catch (error: any) {
      console.error("이미지 슬라이드 생성 에러:", error);
      res
        .status(500)
        .json({
          message: "이미지 슬라이드 생성에 실패했습니다.",
          error: error.message,
        });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const imageSlides = await ImageSlide.find().sort({
      order: 1,
      createdAt: -1,
    });
    res.json(imageSlides);
  } catch (error: any) {
    console.error("이미지 슬라이드 조회 에러:", error);
    res
      .status(500)
      .json({
        message: "이미지 슬라이드 조회에 실패했습니다.",
        error: error.message,
      });
  }
});

router.get("/active", async (req, res) => {
  try {
    const imageSlides = await ImageSlide.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json(imageSlides);
  } catch (error: any) {
    console.error("활성 이미지 슬라이드 조회 에러:", error);
    res
      .status(500)
      .json({
        message: "활성 이미지 슬라이드 조회에 실패했습니다.",
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
      const { title, description, link, order, isActive } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const imageSlide = await ImageSlide.findById(id);
      if (!imageSlide) {
        return res
          .status(404)
          .json({ message: "이미지 슬라이드를 찾을 수 없습니다." });
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
      console.error("이미지 슬라이드 수정 에러:", error);
      res
        .status(500)
        .json({
          message: "이미지 슬라이드 수정에 실패했습니다.",
          error: error.message,
        });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imageSlide = await ImageSlide.findById(id);

    if (!imageSlide) {
      return res
        .status(404)
        .json({ message: "이미지 슬라이드를 찾을 수 없습니다." });
    }

    if (imageSlide.imageUrl) {
      try {
        await deleteFile(imageSlide.imageUrl);
      } catch (error) {
        console.error("이미지 파일 삭제 실패:", error);
      }
    }

    await ImageSlide.findByIdAndDelete(id);
    res.json({ message: "이미지 슬라이드가 삭제되었습니다." });
  } catch (error: any) {
    console.error("이미지 슬라이드 삭제 에러:", error);
    res
      .status(500)
      .json({
        message: "이미지 슬라이드 삭제에 실패했습니다.",
        error: error.message,
      });
  }
});

export default router;
