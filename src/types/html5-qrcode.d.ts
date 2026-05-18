declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraIdOrConfig: any,
      configurations?: any,
      qrCodeSuccessCallback?: (decodedText: string) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
    clear(): Promise<void>;
  }

  export default Html5Qrcode;
}
