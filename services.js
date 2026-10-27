// plane's size is 1,1
// calculate the visible height and width of the scene based on the camera's parameter
// based on the aspect ratio of the window and the video, stretch the plane to the visible height or width based while maintaining the video's aspect ratio

export const resizeVideoPlane = (camera, plane, videoWidth, videoHeight) => {
  const windowAspect = window.innerWidth / window.innerHeight;
  const videoAspect = videoWidth / videoHeight;

  const distance = Math.abs(camera.position.z - plane.position.z);
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * windowAspect;

  let scaleX, scaleY;
  if (windowAspect < videoAspect) {
    scaleX = visibleWidth;
    scaleY = visibleWidth / videoAspect;
  } else {
    scaleX = visibleHeight * videoAspect;
    scaleY = visibleHeight;
  }
  plane.scale.set(scaleX, scaleY, 1);
}

export const resizeVideoPlaneForCover = (camera, plane, videoWidth, videoHeight) => {
  const windowAspect = window.innerWidth / window.innerHeight;
  const videoAspect = videoWidth / videoHeight

  const distance = Math.abs(camera.position.z - plane.position.z);
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * windowAspect;

  let scaleX, scaleY;
  if (windowAspect < videoAspect) {
    scaleX = visibleHeight * videoAspect;
    scaleY = visibleHeight;
  } else {
    scaleX = visibleWidth;
    scaleY = visibleWidth / videoAspect;
  }

    plane.scale.set(scaleX, scaleY, 1);
}

export const resizeScene = (renderer, composer, camera, plane, video, isCover = false) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (video.videoWidth > 0) {
    if(isCover) {
      resizeVideoPlaneForCover(camera, plane, video.videoWidth, video.videoHeight);
    } else {
      resizeVideoPlane(camera, plane, video.videoWidth, video.videoHeight)
    }
  }
}