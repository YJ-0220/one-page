import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const absolutePath = path.join(__dirname, '../../', filePath);
    fs.unlink(absolutePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}; 