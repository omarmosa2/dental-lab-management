export async function waitForLicenseApi(timeout = 3000, interval = 100) {
  const start = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  while (Date.now() - start < timeout) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).licenseApi !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).licenseApi;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('licenseApi not available after waiting');
}
