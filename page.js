  window.scrollTo(0,0);
		(function() {
					var params = {},
						r = /([^&=]+)=?([^&]*)/g;

					function d(s) {
						return decodeURIComponent(s.replace(/\+/g, ' '));
					}

					var match, search = window.location.search;
					while (match = r.exec(search.substring(1))) {
						params[d(match[1])] = d(match[2]);

						if(d(match[2]) === 'true' || d(match[2]) === 'false') {
							params[d(match[1])] = d(match[2]) === 'true' ? true : false;
						}
					}

					window.params = params;
		})();
			const RecordPosition = {'None' : -1, 'Ready' : 0 , 'Running' : 1, 'Recorded' : 2  }; 
			const RecordText = {'Start' :'Mulai Perekaman', 'Loading' : '..Memutar ulang rekaman ..', 'Restart' : 'Ulangi Perekaman','Running' : 'Sedang Merekam ..'};
			var recordPos = RecordPosition.None;
			var recordingDIV = document.querySelector('.recordrtc');
            var recordingMedia = recordingDIV.querySelector('.recording-media');
			var base64Box = recordingDIV.querySelector('#base64');
			var videoLoader = recordingDIV.querySelector('#spinner');
            var videoRecorder = recordingDIV.querySelector('#recorder');
			var videoPlayer = recordingDIV.querySelector('#player');
            var mediaContainerFormat = recordingDIV.querySelector('.media-container-format');
			var replay = document.getElementById("replayButton");
			
            recordingDIV.querySelector('button').onclick = function(event) {
                var button = this;
				//activate camera
				hide(videoPlayer);
				hide(base64Box);
				show(videoRecorder);
				if (recordPos == RecordPosition.None) {
					recordPos = RecordPosition.Ready;
					button.innerHTML = RecordText.Start;
					if (navigator.mediaDevices.getUserMedia) {
					  navigator.mediaDevices.getUserMedia({ video: true })
						.then(function (stream) {
						  videoRecorder.srcObject = stream;
						})
						.catch(function (err0r) {
						  console.log("Something went wrong!");
						});
					}
					return;
				}
				
                button.disabled = true;
				document.getElementById("base64").value = "";
				recordPos = RecordPosition.Running;

                var commonConfig = {
                    onMediaCaptured: function(stream) {
						
                        button.stream = stream;
						
                        if(button.mediaCapturedCallback) {
                            button.mediaCapturedCallback();
                        }

                        button.innerHTML = RecordText.Running;
                        button.disabled = true;
                    },
                    onMediaCapturingFailed: function(error) {
                        if(error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
                            InstallTrigger.install({
                                'Foo': {
                                    // https://addons.mozilla.org/firefox/downloads/latest/655146/addon-655146-latest.xpi?src=dp-btn-primary
                                    URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
                                    toString: function () {
                                        return this.URL;
                                    }
                                }
                            });
                        }

                        commonConfig.onMediaStopped();
                    }
                };
				captureVideo(commonConfig);


				button.mediaCapturedCallback = function() {
					button.recordRTC = RecordRTC(button.stream, {
						type: 'video',
						mimeType:  isSafari ? 'video/mp4' : 'video\/webm;codecs=vp8',
						videoBitsPerSecond: 512000, //JRM ::  BitRate, ADjust with SAVE.PHP line 88 +
						bitrate:512000,//JRM :: BitRate, ADjust with SAVE.PHP line 88 +
						canvas: {   
							width: 480,
							height: 640
						},
						frameRate: 24, // FPS
						frameInterval: 24 // FPS bagi CanvasRecord/WhammyRecorder
					});
					
					button.recordRTC.setRecordingDuration(8*1000).onRecordingStopped(function() {
					    button.innerHTML = RecordText.Loading;
					    var blob = this.getBlob();
						var fileType = 'video'; 
						
						window.fileName = Date.now()+'.mp4';
						
						var formData = new FormData();
						formData.append("orientation",(window.innerHeight < window.innerWidth) ?  "landscape" : "potrait");
						formData.append("isSafari", isSafari);
						formData.append(fileType + '-filename', fileName);
						formData.append(fileType + '-blob', blob);

						//Hide recorder & show spinner
						hide(videoRecorder);
						show(videoLoader);
						xhr('save.php', formData, function (fName) {
							show(videoPlayer);
							replay.className = "";
							filePath = './uploads/converted/'+window.fileName
							var xhr = new XMLHttpRequest();
							xhr.open('GET',filePath, true);
							xhr.responseType = 'blob';
							xhr.onload = function(e) {
							  if (this.status == 200) {
									videoPlayer.src  = null;
									videoPlayer.src = URL.createObjectURL(this.response);
									videoPlayer.load();
									videoPlayer.oncanplay=function(){
										show(videoPlayer);
										hide(videoLoader);
										videoPlayer.play();
										button.innerHTML = RecordText.Restart;
										button.disabled = false;
									}
									blobToBase64(this.response).then(res => {
										document.getElementById("base64").value = res;
										show(base64Box);
									});
							   }
							};
							xhr.send();
						});
						
					});
					
					button.recordRTC.startRecording();
				};
			}
			const blobToBase64 = blob => {
			  const reader = new FileReader();
			  reader.readAsDataURL(blob);
			  return new Promise(resolve => {
				reader.onloadend = () => {
				  resolve(reader.result);
				};
			  });
			};
			
            function captureVideo(config) {
                captureUserMedia({video: true,audio:false}, function(videoStream) {
                    videoRecorder.srcObject = videoStream;
                    config.onMediaCaptured(videoStream);
					
                    videoStream.onended = function() {
                        config.onMediaStopped();
                    };
                }, function(error) {
                    config.onMediaCapturingFailed(error);
                });
            }
			
			function xhr(url, data, callback) {
				var request = new XMLHttpRequest();
				request.onreadystatechange = function () {
					if (request.readyState == 4 && request.status == 200) {
						callback(location.href + request.responseText);
					}
				};
				request.open('POST', url);
				request.send(data);
			}

            function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
                navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
            }
			
            var MY_DOMAIN = 'demoios.themurphycompany.com';

            function isMyOwnDomain() {
                return document.domain.indexOf(MY_DOMAIN) !== -1;
            }
			// Show an element
			var show = function (elem) {
				elem.style.display = 'block';
			};

			// Hide an element
			var hide = function (elem) {
				elem.style.display = 'none';
			};

			function videoEnd() {
			  replay.className = "replayButton";
			}
			
			function replay_me() {
				videoPlayer.play();
				replay.className = "";
			}
			videoPlayer.addEventListener("ended", videoEnd, false);  