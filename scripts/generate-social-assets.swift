import AppKit
import CoreText
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let media = root.appendingPathComponent("blocklets/fomo4good/content/media")
let sourceURL = media.appendingPathComponent("og-base.png")
let fontURL = media.appendingPathComponent("VT323-Regular.ttf")
let width = 1200
let height = 630

guard let source = NSImage(contentsOf: sourceURL),
      let sourceCG = source.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  fatalError("Unable to load \(sourceURL.path)")
}

CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, nil)

struct Card {
  let file: String
  let kicker: String
  let title: [String]
  let foot: String
  let practice: Bool
}

let cards = [
  Card(file: "og-arc.jpg", kicker: "FOMO4GOOD / REAL MONEY", title: ["THE WINNER", "GETS NOTHING."], foot: "THEIR CHARITY GETS EVERYTHING.", practice: false),
  Card(file: "og-arc-teams.jpg", kicker: "FIVE CHARITIES / ONE TIMER", title: ["ZERO", "BAD GUYS."], foot: "PICK YOUR CHAOTIC GOOD.", practice: false),
  Card(file: "og-arc-leaderboard.jpg", kicker: "THE RECEIPTS / THE EGOS", title: ["HALL OF", "GOOD."], foot: "MONEY BUYS RANK. PERSONAL RETURN: $0.", practice: false),
  Card(file: "og-arc-rules.jpg", kicker: "RULES / FAQ / QUESTIONABLE DECISIONS", title: ["HOW TO LOSE", "BEAUTIFULLY."], foot: "THE FINE PRINT GOT A PERSONALITY.", practice: false),
  Card(file: "og-practice.jpg", kicker: "PRACTICE ROUND / FUSD", title: ["FAKE USD.", "REAL FOMO."], foot: "ZERO CONSEQUENCES. PROBABLY.", practice: true),
  Card(file: "og-practice-teams.jpg", kicker: "PRACTICE TEAMS / FUSD", title: ["ZERO REAL", "DOLLARS."], foot: "PICK A TEAM. SPEND NOTHING.", practice: true),
  Card(file: "og-practice-leaderboard.jpg", kicker: "IMAGINARY GENEROSITY / REAL EGO", title: ["TOP FUSD", "DONORS."], foot: "GENEROSITY HAS NEVER BEEN EASIER.", practice: true),
  Card(file: "og-practice-rules.jpg", kicker: "FUSD MONETARY POLICY", title: ["BACKING:", "NONE."], foot: "VALUE: $0.00. STABILITY: REMARKABLE.", practice: true),
]

func color(_ hex: UInt32, alpha: CGFloat = 1) -> CGColor {
  CGColor(red: CGFloat((hex >> 16) & 255) / 255,
          green: CGFloat((hex >> 8) & 255) / 255,
          blue: CGFloat(hex & 255) / 255,
          alpha: alpha)
}

func drawText(_ text: String, x: CGFloat, top: CGFloat, size: CGFloat, color: CGColor, context: CGContext) {
  let font = CTFontCreateWithName("VT323" as CFString, size, nil)
  let attributed = NSAttributedString(string: text, attributes: [
    NSAttributedString.Key(kCTFontAttributeName as String): font,
    NSAttributedString.Key(kCTForegroundColorAttributeName as String): color,
    .kern: 1.4,
  ])
  let line = CTLineCreateWithAttributedString(attributed)
  context.textPosition = CGPoint(x: x, y: CGFloat(height) - top - size * 0.83)
  CTLineDraw(line, context)
}

for card in cards {
  guard let context = CGContext(data: nil,
                                width: width,
                                height: height,
                                bitsPerComponent: 8,
                                bytesPerRow: 0,
                                space: CGColorSpaceCreateDeviceRGB(),
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    fatalError("Unable to create bitmap context")
  }

  context.interpolationQuality = .none
  context.draw(sourceCG, in: CGRect(x: 0, y: 0, width: width, height: height))

  let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                            colors: [color(0x050510, alpha: 0.98), color(0x050510, alpha: 0.89), color(0x050510, alpha: 0.12), color(0x050510, alpha: 0.0)] as CFArray,
                            locations: [0, 0.38, 0.68, 1])!
  context.drawLinearGradient(gradient,
                             start: CGPoint(x: 0, y: CGFloat(height) / 2),
                             end: CGPoint(x: CGFloat(width) * 0.72, y: CGFloat(height) / 2),
                             options: [])

  context.setFillColor(card.practice ? color(0xffe374) : color(0xad88ed))
  context.fill(CGRect(x: 58, y: height - 88, width: 18, height: 18))
  drawText(card.kicker, x: 92, top: 53, size: 31, color: color(0xf4eedd), context: context)

  var top: CGFloat = 125
  for line in card.title {
    drawText(line, x: 58, top: top, size: 89, color: card.practice ? color(0xffe374) : color(0xb9ffd0), context: context)
    top += 82
  }

  context.setFillColor(color(0xad88ed))
  context.fill(CGRect(x: 58, y: height - 355, width: 380, height: 4))
  drawText(card.foot, x: 58, top: 382, size: 34, color: color(0xf4eedd), context: context)
  drawText("FOMO4GOOD.COM", x: 58, top: 543, size: 31, color: color(0xa9a8cc), context: context)
  drawText(card.practice ? "FAKE MONEY / REAL EGO" : "BUILT ON ARC / PAID ON Arc", x: 296, top: 543, size: 31, color: card.practice ? color(0xffe374) : color(0xb9ffd0), context: context)

  guard let image = context.makeImage() else { fatalError("Unable to finalize image") }
  let rep = NSBitmapImageRep(cgImage: image)
  guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else {
    fatalError("Unable to encode JPEG")
  }
  try data.write(to: media.appendingPathComponent(card.file), options: .atomic)
  print("wrote \(card.file)")
}
