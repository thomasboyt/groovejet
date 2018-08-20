export interface BaseMessage {
  type: string;
}

export interface BaseErrorMessage extends BaseMessage {
  type: 'error';
  errorType: string;
  errorMessage: string;
}

export interface MissingRoomCodeErrorMessage extends BaseErrorMessage {
  errorType: 'missingRoomCode';
}

export interface NoRoomFoundErrorMessage extends BaseErrorMessage {
  errorType: 'noRoomFound';
}

export interface HostDisconnectedErrorMessage extends BaseErrorMessage {
  errorType: 'hostDisconnected';
}

export interface HostAlreadyExistsMessage extends BaseErrorMessage {
  errorType: 'hostAlreadyExists';
}

export type ErrorMessage =
  | HostAlreadyExistsMessage
  | MissingRoomCodeErrorMessage
  | NoRoomFoundErrorMessage
  | HostDisconnectedErrorMessage;

/**
 * Message sent by server on initial connection with a unique client ID for the
 * current connection.
 */
export interface SIdentityMessage {
  type: 'identity';
  data: {
    clientId: string;
  };
}

/**
 * Message sent from the server to a host when a guest sends an offer signal.
 */
export interface SGuestSignalMessage {
  type: 'guestOfferSignal';
  data: {
    offerSignal: string;
    clientId: string;
  };
}

/**
 * Message sent from the server to a host when a host answers an offer signal.
 */
export interface SHostSignalMessage {
  type: 'hostAnswerSignal';
  data: {
    answerSignal: string;
  };
}

/**
 * Messages sent by the Groovejet server.
 */
export type ServerMessage =
  | SIdentityMessage
  | SGuestSignalMessage
  | SHostSignalMessage;

/**
 * Message sent from a connecting guest to the host with an offer signal.
 */
export interface CGuestSignalMessage {
  type: 'guestOfferSignal';
  data: {
    offerSignal: string;
  };
}

/**
 * Message sent from a host to a connecting guest with an answer signal.
 */
export interface CHostSignalMessage {
  type: 'hostAnswerSignal';
  data: {
    answerSignal: string;
    clientId: string;
  };
}

/**
 * Messages received by the Groovejet server.
 */
export type ClientMessage = CGuestSignalMessage | CHostSignalMessage;
