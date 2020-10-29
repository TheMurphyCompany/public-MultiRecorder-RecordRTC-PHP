<?php
header("Access-Control-Allow-Origin: *");
error_reporting(E_ALL);
ini_set('display_errors', 1);

set_error_handler("someFunction");

function someFunction($errno, $errstr) {
    echo '<h2>Upload failed.</h2><br>';
    echo '<p>'.$errstr.'</p>';
}
function selfInvoker()
{
    if (!isset($_POST['audio-filename']) && !isset($_POST['video-filename'])) {
        echo 'Empty file name.';
        return;
    }

    // do NOT allow empty file names
    if (empty($_POST['audio-filename']) && empty($_POST['video-filename'])) {
        echo 'Empty file name.';
        return;
    }
    
    $fileName = '';
    $tempName = '';
    $file_idx = '';
    
	$file_idx = 'video-blob';
	$isSafari = $_POST['isSafari'] == 'true';
	$fileName = $_POST['video-filename'];
	if (!$isSafari) $fileName = str_replace(".mp4",".webm",$fileName);
	
	$tempName = $_FILES[$file_idx]['tmp_name'];
    
    if (empty($fileName) || empty($tempName)) {
        if(empty($tempName)) {
            echo 'Invalid temp_name: '.$tempName;
            return;
        }

        echo 'Invalid file name: '.$fileName;
        return;
    }

	//JRM :: Folder Path to upload webm/mp4 for conversion, relative to this PHP file
    $filePath = 'uploads/' . $fileName;
    
    // make sure that one can upload only allowed audio/video files
    $allowed = array(
        'webm',
        'mp4',
        'mkv'
    );
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    if (!$extension || empty($extension) || !in_array($extension, $allowed)) {
        echo 'Invalid file extension: '.$extension;
        return;
    }
    
    if (!move_uploaded_file($tempName, $filePath)) {
        if(!empty($_FILES["file"]["error"])) {
            $listOfErrors = array(
                '1' => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
                '2' => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
                '3' => 'The uploaded file was only partially uploaded.',
                '4' => 'No file was uploaded.',
                '6' => 'Missing a temporary folder. Introduced in PHP 5.0.3.',
                '7' => 'Failed to write file to disk. Introduced in PHP 5.1.0.',
                '8' => 'A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help.'
            );
            $error = $_FILES["file"]["error"];

            if(!empty($listOfErrors[$error])) {
                echo $listOfErrors[$error];
            }
            else {
                echo 'Not uploaded because of error #'.$_FILES["file"]["error"];
            }
        }
        else {
            echo 'Problem saving file: '.$tempName;
        }
        return;
    }
	
    $basePath = '/home/murphy/public_html/demoios/method2/'; //JRM :: Full Path to the location of this file
	$filePath = $basePath.$filePath; 
	$newFilePath = $basePath.'/uploads/converted/'.str_replace(".webm",".mp4",$fileName); //JRM :: Path to Converted Files, relative to this file
	
	//JRM :: BUFSIZE / MaxRate : Maximum File Size
	if ($_POST['orientation'] == 'landscape' && !$_POST['isSafari']=='false')
		shell_exec("ffmpeg -i {$filePath} -vf \"hflip,scale=480x640\" -c:a -r 24 -an {$newFilePath} 2>&1");
	else if ($_POST['isSafari'] == 'true' && $_POST['orientation'] == 'landscape')
		shell_exec("ffmpeg -i {$filePath} -vf \"vflip\" -c:a -an -maxrate 1M -bufsize 1M {$newFilePath} 2>&1");
	else if ($_POST['isSafari'] == 'true' && $_POST['orientation'] == 'potrait')
		shell_exec("ffmpeg -i {$filePath} -vf \"hflip,transpose=2,scale=480x640\" -c:a -an -maxrate 1M -bufsize  1M {$newFilePath} 2>&1");
	else 
		shell_exec("ffmpeg -i {$filePath} -vf \"hflip\" {$newFilePath} 2>&1");
	
	unlink($filePath);
	echo $newFilePath;
}

selfInvoker();
?>
