const Jimp = require('jimp');
const inquirer = require('inquirer');
const { existsSync } = require('node:fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  if (!existsSync(inputFile)) {
    throw new Error(`Input file ${inputFile} does not exist`);
  }
  const image = await Jimp.read(inputFile);
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const textData = {
    text,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  };
  image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
  await image.quality(100).writeAsync(outputFile);
};
const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  if (!existsSync(inputFile)) {
    throw new Error(`Input file ${inputFile} does not exist`);
  }
  const image = await Jimp.read(inputFile);
  const watermark = await Jimp.read(watermarkFile);
  const x = image.getWidth() / 2 - watermark.getWidth() / 2;
  const y = image.getHeight() / 2 - watermark.getHeight() / 2;
  image.composite(watermark, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.5,
  });
  await image.quality(100).writeAsync(outputFile);
};

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file and watermark type
  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  },
  {
    name: 'editInput',
    type: 'confirm',
    message: 'Do you want to edit your input image?',
  }]);

  if(options.editInput){
    const editOptions = await inquirer.prompt([{
      name: 'edit',
      type: 'list',
      message: 'What do you want to do with your input image?',
      choices: ['Brightness', 'Contrast', 'Black&White', 'Invert'],
    }])

    if (existsSync(`./img/${options.inputImage}`)){
        try{
        Jimp.read(`./img/${options.inputImage}`)
        .then(image => {
          switch(editOptions.edit){
            case 'Brightness':
              image.brightness(0.5);
              break;
            case 'Contrast':
              image.contrast(0.5);
              break;
            case 'Black&White':
              image.grayscale();
              break;
            case 'Invert':
              image.invert();
              break;
          }
          image.write(`./img/edited-${options.inputImage}`);
        })
        }
        catch(error){
            console.log("Something went wrong... Try again!")
        }
        console.log('Successs!! Input image was edited')
        startApp();
    }else{
        console.log(`There is no edited-${options.inputImage} in the "img" directory.`); 
    }
};
    const watermarkOptions = await inquirer.prompt([{
        name: 'watermarkType',
        type: 'list',
        message: 'What type of watermark do you want to add?',
        choices: ['Text watermark', 'Image watermark'],
    }]);


  if(watermarkOptions.watermarkType === 'Text watermark') {
   const text = await inquirer.prompt([{
     name: 'value',
     type: 'input',
     message: 'Type your watermark text:',
   }]);
   options.watermarkText = text.value;
    if (existsSync(`./img/edited-${options.inputImage}`)){
        try{
        await addTextWatermarkToImage('./img/edited-' + options.inputImage, './test-with-watermark.jpg', options.watermarkText);
        }
        catch(error){
            console.log("Something went wrong... Try again!")
        }
        console.log('Successs!! Watermark image was generated in main directory')
        startApp();
    }else{
        console.log(`There is no edited-${options.inputImage} in the "img" directory.`); 
    }
 }else if(watermarkOptions.watermarkType === 'Image watermark') {
   const image = await inquirer.prompt([{
     name: 'filename',
     type: 'input',
     message: 'Type your watermark name:',
     default: 'logo.png',
   }]);
   options.watermarkImage = image.filename;
    if (existsSync(`./img/edited-${options.inputImage}`) && existsSync(`./img/${options.watermarkImage}`)){
        try{
            addImageWatermarkToImage('./img/edited-' + options.inputImage, './test-with-watermark.jpg', './img/' + options.watermarkImage);
        }
        catch(error){
            console.log("Something went wrong... Try again!")
        }
            console.log('Successs!! Watermark image was generated in main directory')
            startApp();
    }else{
        console.log(`There is no ${options.watermarkImage} or edited-${options.inputImage} in the "img" directory.`); 
    }
 }

}

startApp();