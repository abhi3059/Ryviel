// Lifts the subject out of an image with macOS Vision and saves it as a transparent PNG,
// cropped to the subject. Usage: swift scripts/cutout.swift <input image> <output prefix>
// Writes <prefix>.png (all subjects) and, when several are found, <prefix>-i<N>.png per subject.
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("usage: cutout <input> <output-prefix>")
  exit(2)
}
let input = URL(fileURLWithPath: args[1])
let prefix = args[2]

let handler = VNImageRequestHandler(url: input)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let observation = request.results?.first else {
  print("no subject found in \(args[1])")
  exit(1)
}

let context = CIContext()
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

func write(_ instances: IndexSet, _ suffix: String) throws {
  let buffer = try observation.generateMaskedImage(
    ofInstances: instances, from: handler, croppedToInstancesExtent: true)
  let image = CIImage(cvPixelBuffer: buffer)
  let url = URL(fileURLWithPath: prefix + suffix + ".png")
  try context.writePNGRepresentation(of: image, to: url, format: .RGBA8, colorSpace: srgb)
  print("\(url.lastPathComponent) \(Int(image.extent.width))x\(Int(image.extent.height))")
}

let all = observation.allInstances
try write(all, "")
if all.count > 1 {
  for i in all { try write(IndexSet(integer: i), "-i\(i)") }
}
