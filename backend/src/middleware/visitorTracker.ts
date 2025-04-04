import { Request, Response, NextFunction } from 'express';
import Visitor from '../models/Visitor';

export const visitorTracker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 정적 파일 요청 또는 API 요청이 아닌 경우에만 추적
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next();
    }
    
    const today = new Date().toISOString().split('T')[0];
    const ip = req.ip || req.connection.remoteAddress || '';
    
    // 오늘 방문자 정보 조회 또는 생성
    let visitor = await Visitor.findOne({ date: today });
    
    if (!visitor) {
      // 해당 날짜의 방문자 정보가 없으면 생성
      visitor = new Visitor({ date: today, count: 1, ip: [ip] });
      await visitor.save();
    } else if (!visitor.ip.includes(ip)) {
      // 이미 방문자 정보가 있고, 같은 IP가 아니면 카운트 증가
      visitor.count += 1;
      visitor.ip.push(ip);
      await visitor.save();
    }
    
    next();
  } catch (error) {
    console.error('방문자 추적 오류:', error);
    next(); // 오류가 발생해도 요청은 계속 처리
  }
};
