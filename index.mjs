import fetch from 'node-fetch';
import editly from 'editly';
import fs from 'fs';
import path from 'path';

import express from 'express';

const app = express();

async function downloadImage(url, dest) {
 const jpegUrl = `${url}-/format/jpeg/`;

 const response = await fetch(jpegUrl);
 const buffer = await response.buffer();

 const destPath = `${dest}.jpg`;

 await fs.promises.writeFile(destPath, buffer);
 return destPath;
}


const dir = './images';
const outDir = './out.mp4';

console.log(process.env.NODE_ENV)

async function downloadImages(urls) {
 const localPaths = [];

 if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
 }

 for (const [index, url] of urls.entries()) {
  const localPath = path.join(dir, `image${index}`);
  const destPath = await downloadImage(url, localPath);
  localPaths.push(destPath);
 }
 return localPaths;
}


const createEdit = async (images) => {
 const endFill = {
  layers: [
   {
    type: 'video',
    path: 'end.mp4',
    resizeMode: 'cover',
   },
  ],
 }

 const clipLength = 0.3
 const duration = images.length * clipLength

 const clip = {
  layers: images.map((path, index) => {
   console.log({path})
   const start = index * clipLength

   const displacementAmount = 0.5
   const zoomAmount = 0.4

   const xDisplacement = (Math.random() - 0.5) * displacementAmount
   const yDisplacement = (Math.random() - 0.5) * displacementAmount
   const zoomDisplacement = (Math.random() - 0.5) * zoomAmount

   return {
    type: 'image-overlay',
    path,
    start,
    width: 0.8 + zoomDisplacement,
    position: {
     x: 0.5 + xDisplacement,
     y: 0.5 + yDisplacement,
     originX: 'center',
     originY: 'center',
    },
   }
  }),
  duration,
  transition: {
   name: 'CrossZoom',
   duration: 0.5,
   params: {strength: 0.4, seed: 0.1},
  },
 }

 await editly({
  clips: [clip, endFill],
  defaults: {},
  fast: false,
  width: 720,
  height: 720 * 2,
  fps: 30,
  outPath: outDir,
 })

 return outDir
};


const port = process.env.PORT || 3000;


app.get('/', async (req, res) => {
  const { imagePaths } = req.query;
  const decodedImagePaths = JSON.parse(imagePaths);

  console.log({ decodedImagePaths });

  if (!Array.isArray(decodedImagePaths)) {
    res.status(400).send('imagePaths must be an array');
    return;
  }

  try {
    const localPaths = await downloadImages(decodedImagePaths);
    const outDir = await createEdit(localPaths);
    res.send({ message: 'Images processed successfully', outDir });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing images');
  }
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



const array = ['https://ucarecdn.com/7794e859-84b3-4c26-8dd5-bfda225f2db8/-/preview/500x500/-/quality/smart_retina/-/format/jpeg/', 'https://ucarecdn.com/638a7f3f-b596-4f62-b362-b7735fd07aff/-/preview/500x500/-/quality/smart_retina/-/format/jpeg/', 'https://ucarecdn.com/ce532a99-51af-4225-a526-73ce1117f2ec/-/preview/500x500/-/quality/smart_retina/-/format/jpeg/', 'https://ucarecdn.com/f090ae0f-a8bb-40af-8e6d-fde5cdefee72/-/preview/500x500/-/quality/smart_retina/-/format/jpeg/', 'https://ucarecdn.com/89063cab-dd88-447e-a1fc-8a5bda052e47/-/preview/500x500/-/quality/smart_retina/-/format/auto/',];
const encodedArray = encodeURIComponent(JSON.stringify(array));
const url = `http://localhost:3000/?imagePaths=${encodedArray}`;


console.log(url);

