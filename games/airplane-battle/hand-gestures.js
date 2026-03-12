// hand-gestures.js
// Uses MediaPipe Hands to detect a closed hand (fist) and trigger shooting.

let hgVideo = null;
let hgCamera = null;

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;

let wasClosed = false;
let closedCooldown = 0;

window.addEventListener('load', () => {
  hgVideo = document.getElementById('webcam');
  initHandTracking();
});

function setCameraStatus(text) {
  const el = document.getElementById('cameraState');
  if (el) el.textContent = text;
}

function initHandTracking() {
  try {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(onHandResults);

    hgCamera = new Camera(hgVideo, {
      onFrame: async () => {
        try {
          await hands.send({ image: hgVideo });
        } catch (err) {
          console.error('Error sending frame to hands:', err);
        }
      },
      width: 640,
      height: 480,
    });

    hgCamera.start().then(
      () => setCameraStatus('on'),
      (err) => {
        console.error('Camera start error:', err);
        setCameraStatus('blocked');
      }
    );
  } catch (err) {
    console.error('Failed to initialize MediaPipe Hands:', err);
    setCameraStatus('error');
  }
}

function onHandResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    wasClosed = false;
    return;
  }

  const hand = results.multiHandLandmarks[0];
  const wrist = hand[WRIST];
  const thumb = hand[THUMB_TIP];
  const index = hand[INDEX_TIP];
  const middle = hand[MIDDLE_TIP];
  const ring = hand[RING_TIP];
  const pinky = hand[PINKY_TIP];

  const dThumb = Math.hypot(thumb.x - wrist.x, thumb.y - wrist.y);
  const dIndex = Math.hypot(index.x - wrist.x, index.y - wrist.y);
  const dMiddle = Math.hypot(middle.x - wrist.x, middle.y - wrist.y);
  const dRing = Math.hypot(ring.x - wrist.x, ring.y - wrist.y);
  const dPinky = Math.hypot(pinky.x - wrist.x, pinky.y - wrist.y);

  const avgFingers = (dIndex + dMiddle + dRing + dPinky) / 4;

  const CLOSED_THRESHOLD = 0.18;
  const OPEN_THRESHOLD = 0.26;
  let isClosed = wasClosed;

  if (avgFingers < CLOSED_THRESHOLD && dThumb < CLOSED_THRESHOLD) isClosed = true;
  else if (avgFingers > OPEN_THRESHOLD) isClosed = false;

  if (closedCooldown > 0) closedCooldown -= 1;

  if (isClosed && !wasClosed && closedCooldown === 0) {
    if (typeof window.handleGestureShoot === 'function') {
      window.handleGestureShoot();
      closedCooldown = 5;
    }
  }

  wasClosed = isClosed;
}

