/**
 * WhatsApp / notification stub.
 * Twilio integration removed — add your own provider here if needed.
 */

export const notifyInquiryReceived = async (
    _whatsappNumber: string,
    _businessName: string,
    _inquirerName: string,
    _message: string
): Promise<void> => {
    // TODO: integrate your WhatsApp provider here if needed
};

export const notifyNewDiamondAdded = async (
    _whatsappNumber: string,
    _businessName: string,
    _shape: string,
    _carat: number,
    _color: string,
    _clarity: string,
    _certificateNumber?: string | null
): Promise<void> => {
    // TODO: integrate your WhatsApp provider here if needed
};
