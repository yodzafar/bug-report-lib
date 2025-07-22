export async function captureScreenshot(): Promise<string> {
  const html2canvasModule = await import("html2canvas")
  const html2canvas = html2canvasModule.default || html2canvasModule
  const canvas = await html2canvas(document.body)
  return canvas.toDataURL()
}
