export function delay(ms = 400) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
