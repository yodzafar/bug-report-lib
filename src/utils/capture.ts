// export async function captureScreenshot(): Promise<string> {
//   const html2canvasModule = await import("html2canvas")
//   const html2canvas = html2canvasModule.default || html2canvasModule

//   const canvas = await html2canvas(document.body, {
//     backgroundColor: "#ffffff", // Ruxsat etilgan background
//     ignoreElements: (element) => {
//       // HTML CSSda noto‘g‘ri "color" funksiyalarni istisno qilish (CSS Variables)
//       const style = getComputedStyle(element)
//       return (
//         style.backgroundColor?.includes("color(") ||
//         style.color?.includes("color(")
//       )
//     },
//   })

//   return canvas.toDataURL()
// }

export async function captureScreenshot(): Promise<string> {
  const domtoimage = await import("html-to-image")
  const element = document.body // yoki kerakli element
  const dataUrl = await domtoimage.toPng(element)
  return dataUrl
}
