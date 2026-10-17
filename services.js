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

export const resizeScene = (renderer, composer, camera, plane, video) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (video.videoWidth > 0) {
    resizeVideoPlane(camera, plane, video.videoWidth, video.videoHeight);
  }
}