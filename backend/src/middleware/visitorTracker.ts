import { Request, Response, NextFunction } from 'express';
import Visitor from '../models/Visitor';

export const visitorTracker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next();
    }
    
    const today = new Date().toISOString().split('T')[0];
    const ip = req.ip || req.connection.remoteAddress || '';
    
    let visitor = await Visitor.findOne({ date: today });
    
    if (!visitor) {
      visitor = new Visitor({ date: today, count: 1, ip: [ip] });
      await visitor.save();
    } else if (!visitor.ip.includes(ip)) {
      visitor.count += 1;
      visitor.ip.push(ip);
      await visitor.save();
    }
    
    next();
  } catch (error) {
    console.error('방문자 추적 오류:', error);
    next();
  }
};
