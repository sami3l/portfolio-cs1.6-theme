/** Start a download of a same-origin file under the given name. */
export function downloadFile(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}
