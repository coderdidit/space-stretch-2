import 'regenerator-runtime/runtime'
import { Camera } from './camera';
import { predict } from './predictions'
import { handleMoveToEvent } from './game-state'
import * as params from './pose-detection-cfg';
import { getAngleBetween } from './angles';
import { left, right, up, stop } from './game-state'

const spinner = document.getElementById('spinner')
const welcomBg = document.getElementById('welcom-bg')

const stratSpinner = () => {
    // hide main bg
    welcomBg.style.display = 'none'
    spinner.classList.remove("visually-hidden")
}

const stopSpinner = () => {
    spinner.classList.add("visually-hidden")
}

const startGame = async () => {
    stratSpinner()

    console.log('starting camera setup')
    const camera = await Camera.setupCamera();
    if (camera.video.readyState < 2) {
        await new Promise((resolve) => {
            camera.video.onloadeddata = () => {
                resolve(video);
            };
        });
    }
    console.log('setupCamera finished', camera)

    // un-hide game and camera canvas
    const mainCanvas = document.getElementById('main-canvas')
    mainCanvas.style.display = 'block'
    const videoOutput = document.getElementById('video-output')
    videoOutput.style.display = 'block'

    // ai
    console.log('starting pose prediction')
    predictPose(camera)
}

// TODO implement jump up move after 3 stop, up moves 
let movedUp = false
const handlePoseToGameEvents = (pose) => {
    const poseKeypoints = pose.keypoints

    const nose = poseKeypoints[0]

    const leftEye = poseKeypoints[3]
    const rightEye = poseKeypoints[6]

    const leftShoulder = poseKeypoints[12]
    const rightShoulder = poseKeypoints[11]

    const leftElbow = poseKeypoints[14]
    const rightElbow = poseKeypoints[13]

    const leftElbowToSholder = getAngleBetween(leftShoulder, leftElbow)
    const rightElbowToSholder = getAngleBetween(rightShoulder, rightElbow)

    // arms and elbows
    const angle = 40
    const bothArmsUp = (leftElbowToSholder > angle)
        && (rightElbowToSholder > angle)

    const noseToLeftEyeYdistance = nose.y - leftEye.y
    const noseToRightEyeYdistance = nose.y - rightEye.y

    // vissibility
    const scoreThreshold = params.PoseDetectionCfg.modelConfig.scoreThreshold || 0;

    const noseVissible = nose.score > scoreThreshold
    const lEVissible = leftEye.score > scoreThreshold
    const REVissible = rightEye.score > scoreThreshold

    const lShoulderVissible = leftShoulder.score > scoreThreshold
    const rShoulderVissible = rightShoulder.score > scoreThreshold
    const lElbowVissible = leftElbow.score > scoreThreshold
    const rElbowVissible = rightElbow.score > scoreThreshold

    const shouldersVisible = lShoulderVissible && rShoulderVissible

    let visibleShoulders = 0
    if (lElbowVissible) {
        visibleShoulders += 1
    }
    if (rElbowVissible) {
        visibleShoulders += 1
    }
    const shouldersAndElbowsVissible = shouldersVisible && visibleShoulders == 2

    // new moves
    const noseX = nose.x
    const leftElbowX = leftElbow.score >= scoreThreshold ? leftElbow.x : Number.MAX_SAFE_INTEGER
    const rightElbowX = rightElbow.score >= scoreThreshold ? rightElbow.x : Number.MAX_SAFE_INTEGER

    const leftElbowY = leftElbow.score >= scoreThreshold ? leftElbow.y : Number.MAX_SAFE_INTEGER
    const rightElbowY = rightElbow.score >= scoreThreshold ? rightElbow.y : Number.MAX_SAFE_INTEGER

    const noseLElbowXDiff = leftElbowX - noseX
    const noseRElbowXDiff = rightElbowX - noseX

    const noseLElbowYDiff = nose.y - leftElbowY
    const noseRElbowYDiff = nose.y - rightElbowY

    if (noseLElbowYDiff < 0 && noseLElbowXDiff < 170) {
        return left;
    }

    if (noseRElbowYDiff < 0 && noseRElbowXDiff < 170) {
        return right;
    }

    console.log('noseLElbowXDiff, noseRElbowXDiff',
        noseLElbowXDiff, noseRElbowXDiff)

    const moveSideActivationDist = 8
    if (noseVissible && lEVissible
        && noseToLeftEyeYdistance < moveSideActivationDist) {
        return stop;
    } else if (noseVissible && REVissible
        && noseToRightEyeYdistance < moveSideActivationDist) {
        return stop;
    } else if (shouldersAndElbowsVissible && bothArmsUp) {
        movedUp = true
        return up;
    } else {
        movedUp = false
        return stop;
    }
}

// fps for predictions
let fps = 20;
let then = Date.now();
let now, delta;
let interval = 1000 / fps;
let poses

let spinnerStopped = false

const predictPose = async (camera) => {
    requestAnimationFrame(() => {
        predictPose(camera)
    })

    now = Date.now();
    delta = now - then;
    if (delta > interval) {
        then = now - (delta % interval);
        poses = await predict(camera.video)

        if (!spinnerStopped) {
            stopSpinner()
            spinnerStopped = true
        }

        camera.drawCtx()
        if (poses && poses.length > 0) {
            camera.drawResults(poses);
            const pose = poses[0]
            const move = handlePoseToGameEvents(pose)
            handleMoveToEvent(move)
        }
    }
}

const playBtn = document.getElementById('play-btn')
playBtn.addEventListener('click', () => startGame())
