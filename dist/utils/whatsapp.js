"use strict";
/**
 * WhatsApp / notification stub.
 * Twilio integration removed — add your own provider here if needed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyNewDiamondAdded = exports.notifyInquiryReceived = void 0;
const notifyInquiryReceived = async (_whatsappNumber, _businessName, _inquirerName, _message) => {
    // TODO: integrate your WhatsApp provider here if needed
};
exports.notifyInquiryReceived = notifyInquiryReceived;
const notifyNewDiamondAdded = async (_whatsappNumber, _businessName, _shape, _carat, _color, _clarity, _certificateNumber) => {
    // TODO: integrate your WhatsApp provider here if needed
};
exports.notifyNewDiamondAdded = notifyNewDiamondAdded;
