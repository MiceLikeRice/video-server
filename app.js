const express = require('express');
const multer = require('multer');
const range = require('range-parser');
const fs = require('fs');
const path = require('path');


const app = express();
const port = 50010; // 指定应用的端口


const storage = multer.memoryStorage(); // 存储文件在内存中
const upload = multer({ storage: storage });

app.get("/index/:videoname", async (req, res) => {
    const videoname = req.params.videoname; // 获取URL参数 videoname
    const pathname = path.join(__dirname, "video.html");

    // 读取HTML文件
    fs.readFile(pathname, "utf8", (err, html) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }

        // 替换HTML中的占位符
        html = html.replace("<%= videoname %>", videoname);

        // 发送响应
        res.send(html);
    });
});


app.post('/upload', upload.single('video'), (req, res) => {
    const videoFile = req.file; // 访问上传的视频文件
  
    if (!videoFile) {
      return res.status(400).json({ error: '未找到上传的视频文件' });
    }
  
    // 确保./resources目录存在，如果不存在，则创建
    const resourcesDir = path.join(__dirname, 'resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir);
    }
  
    // 生成保存文件的完整路径
    const savedFilePath = path.join(resourcesDir, videoFile.originalname);
  
    // 将文件保存到指定目录
    fs.writeFileSync(savedFilePath, videoFile.buffer);
  
    // 返回成功响应
    res.status(200).json({ message: '文件上传成功',videoname:videoFile.originalname });
  });

  app.get("/videos/:filename", (req, res) => {
    const filename = req.params.filename;
    const videoFilePath = path.join(__dirname, 'resources',filename);
  
    if (!fs.existsSync(videoFilePath)) {
      return res.status(404).send("文件不存在");
    }
  
    const stat = fs.statSync(videoFilePath);
    const fileSize = stat.size;
  
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  
      const chunkSize = (end - start) + 1;
  
      res.status(206)
        .set({
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`
        });
  
      const fileStream = fs.createReadStream(videoFilePath, { start, end });
      fileStream.pipe(res);
    } else {
      res.status(200)
        .set({
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`
        });
  
      const fileStream = fs.createReadStream(videoFilePath);
      fileStream.pipe(res);
    }
  });
  
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});