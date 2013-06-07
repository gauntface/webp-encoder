var red, blue, reset;
red   = '\033[31m';
blue  = '\033[34m';
reset = '\033[0m';

var WEBP_QUALITY = 80;

var currentImgDir, newImgDir;
var requiredTools = ['cwebp'];
var imgQuality = WEBP_QUALITY;

var exec = require('child_process').exec;
var fs = require('fs');

if(!prepare()) {
  end();
} else {
  console.log('\nLet\'s get encoding.....\n');
  checkForRequiredTools(requiredTools, onToolsCheckComplete);
}

function prepare() {
  currentImgDir = process.argv[2];
  newImgDir = process.argv[3];

  if(!currentImgDir || !newImgDir) {
    console.log(blue+'\nTo use this tool run the command\n\nnode start <Current Image Dir> <New Image Dir>');
    return false;
  }
  return true;
}

function checkForRequiredTools(tools, cb) {
  checkRequiredToolsExist(tools, 0, cb);
}

function checkRequiredToolsExist(tools, index, cb) {
	var child = exec(tools[index],
   	function (error, stdout, stderr) {
    	if (error !== null) {
        	console.error(red+'It look\'s like you don\'t have tools[index] available on your command line: ' + error+'\n');
          	console.error(blue+'Head over to https://developers.google.com/speed/webp/ to get the tools and then add it to your $PATH\n');
          	end();
          	return;
      	}

      	index++;
      	if(index < tools.length) {
      		checkRequiredToolsExist(tools, index, cb);
      	} else {
      		cb();
      	}
	});
}

function onToolsCheckComplete() {
	console.log('We have all the tools we need.....\n');

  if(!checkDirectoryExists(currentImgDir)) {
    console.log(red+'Directory of images to convert, isn\'t a directory');
    end();
  }

  if(!fs.existsSync(newImgDir)) {
    fs.mkdirSync(newImgDir, 0777, true);
  }

  findImagesAndConvert();
}

function checkDirectoryExists(directory) {
  try {
    // Query the entry
    stats = fs.lstatSync(directory);

    return stats.isDirectory(); 
  }
  catch (e) {
    console.log(red+'There was an error attempting to access your image directory: '+e);
    return false;
  }
}

function findImagesAndConvert() {
  stepDirectory([currentImgDir], function() {
    // Success Callback
    happyEnding();
  }, function() {
    // Error Callback
    end();
  });
}

function stepDirectory(directories, successCb, errorCb) {
  console.log('======================================================');
  if(directories.length == 0) {
    successCb();
    return;
  }

  var directory = directories[0];
  var subDirectory = directory.substring(currentImgDir.length);

  directories.splice(0, 1);

  console.log('Current looking in directory - '+directory);
  console.log('Subdirectory is calculated to be - '+subDirectory);
  console.log('Looking to put images in: '+newImgDir+subDirectory+'\n\n');

  if(!fs.existsSync(newImgDir+subDirectory)) {
    fs.mkdirSync(newImgDir+subDirectory, 0777, true);
  }

  fs.readdir(directory, function(err, list) {
    if (err) {
      console.log(red+'A problem occured when reading directory: '+directory+' err = '+err);
      errorCb();
      return;
    }
    
    var files = [];
    for(var i = 0; i < list.length; i++) {
      var fileToCheck = directory+list[i];
      var stat = fs.statSync(fileToCheck);
      if (stat && stat.isDirectory()) {
        console.log('Found Directory: '+fileToCheck);
        directories.push(fileToCheck+'/');
      } else {
        files.push({
          currentFileDirectory: currentImgDir+subDirectory,
          newFileDirectory: newImgDir+subDirectory,
          filename: list[i]
        });
      }
    }  

    convertFiles(files, function(err) {
      if(err) {
        console.log(red+"An error occured while converting these images: "+err);
        console.log(reset);
      }

      stepDirectory(directories, successCb, errorCb);
    });
  });
}

function convertFiles(files, cb) {
  var fileExtension;
  
  var filesToConvert = [];
  for(var i = 0; i < files.length; i++) {
    fileExtension = getFileExtension(files[i].filename);
    fileExtension = fileExtension.toLowerCase();
  
    if(!fileIsImage(fileExtension)) {
      continue;
    }

    filesToConvert.push(files[i]);
  }

  performConversion(filesToConvert, cb);
}

function performConversion(files, cb) {
  if(files.length == 0) {
    cb();
    return;
  }

  var strippedFilename = getFilenameOnly(files[0].filename);

  var currentFile = files[0].currentFileDirectory+files[0].filename;
  var newFile = files[0].newFileDirectory+strippedFilename+'.webp';

  files.splice(0, 1);

  exec('cwebp -q '+imgQuality+' '+currentFile+' -o '+newFile, function(error, stdout, stderr) {
    if(error) {
      console.error(red+'Problem converting '+currentFile+': '+error);
      console.error('stderr: ' + stderr);
      console.log(reset);
    }

    performConversion(files, cb);
  });
}

function getFilenameOnly(filename) {
  var splitName = filename.split('.');
  splitName.pop();
  return splitName.join('.');

}

function fileIsImage(fileExtension) {
  var acceptedExtensions = [
    'gif',
    'png',
    'jpg',
    'jpeg',
    'tiff'
  ];

  for(var j = 0; j < acceptedExtensions.length; j++) {
    if(fileExtension === acceptedExtensions[j]) {
      return true;
    }
  }
  
  return false;
}

function getFileExtension(filename) {
 return filename.split('.').pop();
}

/**function stepDirectory(directory, successCb, errCb) {
  fs.readdir(directory, function(err, list) {
    if (err) {
      console.log(red+'A problem occured when reading directory: '+directory);
      return errCb();
    }

    var i = 0;

    (function next() {
      var filename = list[i++];
      if (!file) {
        return successCb;
      }

      // Check if image

      // If Image then convert to .webp

      var newfile = newImgDir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          stepDirectory(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })()
  });
}**/

function end() {
  console.log(reset);
}

function happyEnding() {

  end();
}