// Puts the Viggle walk clip on the site's bone studio so it joins the hero seamlessly.
//   • Vision lifts Ryviel out of every frame; he is composited onto flat #e9e6e1 with a soft
//     contact shadow whenever his feet are in shot.
//   • The opening close-up is eased smaller and lower (back to the clip's own framing as the camera
//     pulls back), so the hero wordmark and copy above his head stay readable. Hair cut off by the
//     top of the source frame fades out instead of ending in a hard line.
// Usage: swiftc -O scripts/bone-walk.swift -o /tmp/bone-walk
//        /tmp/bone-walk in.mp4 out.mp4          (walk preset: scroll orbit)
//        /tmp/bone-walk in.mp4 out.mp4 look     (look preset: hero head turn — no reframing,
//                                                a keyframe every 4 frames for fast seeks)
import AVFoundation
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("usage: bone-walk <in.mp4> <out.mp4> [walk|look]")
  exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
// "studio" keeps the clip's own background and only re-encodes it with frequent keyframes.
let studioPreset = args.count >= 4 && args[3] == "studio"
let lookPreset = args.count >= 4 && (args[3] == "look" || studioPreset)
try? FileManager.default.removeItem(at: outURL)

// Framing script (t = 0…1 through the clip).
let CLOSE_SCALE = lookPreset ? 1.0 : 0.68 // close-up size at the start
let CLOSE_DROP = lookPreset ? 0.0 : 0.10 // close-up moved down by this fraction of the frame height
let EASE_FROM = 0.25 // keep the close-up framing until here…
let EASE_TO = 0.60 // …then ease back to the clip's own framing by here
let TOP_FEATHER = lookPreset ? 0.04 : 0.075 // fade hair touching the top edge over this fraction
let SHADOWS = true // only drawn when his feet are in shot
let KEYFRAME_EVERY = lookPreset ? 4 : 12
let BONE = (233.0 / 255, 230.0 / 255, 225.0 / 255)

func smoothstep(_ a: Double, _ b: Double, _ x: Double) -> Double {
  let t = min(1, max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

let asset = AVURLAsset(url: inURL)
let track = try await asset.loadTracks(withMediaType: .video)[0]
let natural = try await track.load(.naturalSize)
let duration = try await asset.load(.duration).seconds
let W = Int(natural.width)
let H = Int(natural.height)
let Wd = Double(W)
let Hd = Double(H)

let reader = try AVAssetReader(asset: asset)
let readerOut = AVAssetReaderTrackOutput(
  track: track,
  outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
readerOut.alwaysCopiesSampleData = false
reader.add(readerOut)
reader.startReading()

let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true // index at the front, so the browser can stream-decode
let writerIn = AVAssetWriterInput(
  mediaType: .video,
  outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: W,
    AVVideoHeightKey: H,
    AVVideoColorPropertiesKey: [
      AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
      AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
      AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: [
      AVVideoAverageBitRateKey: 7_000_000,
      AVVideoMaxKeyFrameIntervalKey: KEYFRAME_EVERY,
      AVVideoAllowFrameReorderingKey: false,
      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    ],
  ])
writerIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: writerIn,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: W,
    kCVPixelBufferHeightKey as String: H,
  ])
writer.add(writerIn)
writer.startWriting()

// No colour management: pixel values pass straight through, so the bone stays exactly #e9e6e1.
let ctx = CIContext(options: [.workingColorSpace: NSNull(), .outputColorSpace: NSNull()])
let frameRect = CGRect(x: 0, y: 0, width: Wd, height: Hd)
let bone = CIImage(color: CIColor(red: BONE.0, green: BONE.1, blue: BONE.2)).cropped(to: frameRect)
let clear = CIImage(color: .clear).cropped(to: frameRect)
// Vertical ramp: 0 at the top edge → 1 at TOP_FEATHER down (CI's origin is bottom-left).
let topRamp = CIFilter(
  name: "CILinearGradient",
  parameters: [
    "inputPoint0": CIVector(x: 0, y: Hd),
    "inputPoint1": CIVector(x: 0, y: Hd * (1 - TOP_FEATHER)),
    "inputColor0": CIColor(red: 0, green: 0, blue: 0),
    "inputColor1": CIColor(red: 1, green: 1, blue: 1),
  ])!.outputImage!.cropped(to: frameRect)

/// Bounding box of the subject in image rows/columns (row 0 = top), from Vision's float mask.
func subjectBox(_ mask: CVPixelBuffer) -> (minX: Int, maxX: Int, minY: Int, maxY: Int)? {
  CVPixelBufferLockBaseAddress(mask, .readOnly)
  defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
  let w = CVPixelBufferGetWidth(mask)
  let h = CVPixelBufferGetHeight(mask)
  let stride = CVPixelBufferGetBytesPerRow(mask)
  guard let base = CVPixelBufferGetBaseAddress(mask) else { return nil }
  var minX = w, maxX = -1, minY = h, maxY = -1
  for y in Swift.stride(from: 0, to: h, by: 2) {
    let row = base.advanced(by: y * stride).assumingMemoryBound(to: Float32.self)
    for x in Swift.stride(from: 0, to: w, by: 2) where row[x] > 0.5 {
      minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
    }
  }
  return maxX < 0 ? nil : (minX, maxX, minY, maxY)
}

var frames = 0
var firstPTS: CMTime?
let started = Date()
while let sample = readerOut.copyNextSampleBuffer() {
  guard let pixels = CMSampleBufferGetImageBuffer(sample) else { continue }
  let pts = CMSampleBufferGetPresentationTimeStamp(sample)
  if firstPTS == nil {
    firstPTS = pts
    writer.startSession(atSourceTime: pts)
  }
  let t = (pts - firstPTS!).seconds / duration
  let k = smoothstep(EASE_FROM, EASE_TO, t)
  let s = CLOSE_SCALE + (1 - CLOSE_SCALE) * k
  let drop = CLOSE_DROP * Hd * (1 - k)
  // Scale about the bottom-centre, then move down (the bottom edge slides out of frame).
  let place = CGAffineTransform(translationX: Wd * (1 - s) / 2, y: -drop).scaledBy(x: s, y: s)

  var frame = bone
  let handler = VNImageRequestHandler(cvPixelBuffer: pixels)
  let request = VNGenerateForegroundInstanceMaskRequest()
  if studioPreset {
    frame = CIImage(cvPixelBuffer: pixels) // keep the clip's own studio background
  } else {
    try handler.perform([request])
  }
  if !studioPreset, let obs = request.results?.first {
    let maskBuffer = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
    let mask = CIImage(cvPixelBuffer: maskBuffer).applyingFilter(
      "CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: topRamp])
    let subject = CIImage(cvPixelBuffer: pixels).applyingFilter(
      "CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: mask])
    var ground = bone
    if SHADOWS, let box = subjectBox(maskBuffer), box.maxY < H - 6 {
      // Feet are in shot: lay a soft contact shadow under them.
      let footX = Double(box.minX + box.maxX) / 2 * s + Wd * (1 - s) / 2
      let footY = (Hd - Double(box.maxY)) * s - drop
      let radius = Double(box.maxX - box.minX) * s * 0.62
      let shadow = CIFilter(
        name: "CIRadialGradient",
        parameters: [
          "inputCenter": CIVector(x: 0, y: 0),
          "inputRadius0": 0,
          "inputRadius1": radius,
          "inputColor0": CIColor(red: 0.24, green: 0.19, blue: 0.15, alpha: 0.32),
          "inputColor1": CIColor(red: 0.24, green: 0.19, blue: 0.15, alpha: 0),
        ])!.outputImage!
        .transformed(by: CGAffineTransform(translationX: footX, y: footY + 2).scaledBy(x: 1, y: 0.16))
        .cropped(to: frameRect)
      ground = shadow.composited(over: bone)
    }
    frame = subject.transformed(by: place).cropped(to: frameRect).composited(over: ground)
  }

  guard let pool = adaptor.pixelBufferPool else { fatalError("writer has no pixel buffer pool") }
  var out: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, pool, &out)
  ctx.render(frame, to: out!, bounds: frameRect, colorSpace: nil)
  while !writerIn.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
  adaptor.append(out!, withPresentationTime: pts)
  frames += 1
  if frames % 25 == 0 { print("  \(frames) frames…") }
}
writerIn.markAsFinished()
await writer.finishWriting()
let secs = String(format: "%.1f", Date().timeIntervalSince(started))
print("wrote \(outURL.lastPathComponent): \(frames) frames, \(W)x\(H), \(String(format: "%.2f", duration))s in \(secs)s")
