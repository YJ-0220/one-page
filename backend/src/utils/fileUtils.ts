import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const absolutePath = path.join(__dirname, '../../', filePath);
    fs.unlink(absolutePath, (err) => {
      if (err) {
        console.error('파일 삭제 실패:', err);
        reject(err);
      } else {
        console.log('파일 삭제 성공:', filePath);
        resolve();
      }
    });
  });
}; 